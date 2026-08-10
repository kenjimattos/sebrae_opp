#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera `public/api-snapshot/emendas.json` — a resposta de `GET /api/emendas` servida
estaticamente na branch de snapshot (mesmo padrão de `municipalities.json`, com os
rewrites do `vercel.json` e o bypass do proxy no `vite.config.ts`).

Lê os snapshots dos dois ETLs de emendas e monta o shape do contrato:

    database/data/emendas_federais_pb.json    (gerar_seed_emendas_federais.py)
    database/data/emendas_estaduais_pb.json   (gerar_seed_emendas_estaduais.py)
        -> public/api-snapshot/emendas.json

O shape emitido aqui é o MESMO que a rota Fastify vai devolver quando ela existir
(server/), lendo a coleção `emendas` do Mongo. O contrato TypeScript é
`src/types/emendas.ts` — se mexer num, mexa nos dois.

Municípios sem dado numa esfera saem com `null` naquela esfera (e não zero), para a
UI distinguir "não recebeu" de "não medimos".

USO:
    python3 database/scripts/gerar_api_snapshot_emendas.py
    python3 database/scripts/gerar_api_snapshot_emendas.py --pretty   # legível (maior)

Só stdlib. Compatível com Python 3.6.
"""
import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
OUT = REPO_ROOT / "public" / "api-snapshot" / "emendas.json"

FONTES = {
    "federal": DATA_DIR / "emendas_federais_pb.json",
    "estadual": DATA_DIR / "emendas_estaduais_pb.json",
}

ATRIBUICAO = {"federal": "ibge", "estadual": "texto-beneficiario"}

CRITERIO_ANO = {
    "federal": "ano do documento de despesa (quando o recurso foi empenhado ou pago)",
    "estadual": "ano da emenda (a origem publica a execução agregada, sem data de documento)",
}

SOURCE = {
    "federal": "Portal da Transparência (CGU) — Emendas parlamentares por Documentos de Despesa",
    "estadual": "CODATA/CGE-PB — Portal da Transparência do Estado da Paraíba (emendas da ALPB)",
}


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    pares = re.findall(r'\{"_id": "(\d{7})", "name": "([^"]+)"', text)
    if len(pares) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(pares)))
    return pares


def valores(agg, com_valor):
    """Normaliza um agregado do snapshot para o shape do contrato."""
    if not agg:
        return None
    out = {
        "empenhado": agg.get("empenhado", 0.0),
        "pago": agg.get("pago", 0.0),
        "porAno": agg.get("porAno") or {},
        "nEmendas": agg.get("nEmendas", 0),
        "nAutores": agg.get("nAutores", 0),
    }
    if com_valor:
        out["valor"] = agg.get("valor", 0.0)
    return out


def main():
    ap = argparse.ArgumentParser(description="Gera public/api-snapshot/emendas.json")
    ap.add_argument("--pretty", action="store_true", help="JSON indentado (arquivo maior)")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    snapshots = {}
    for esfera, path in FONTES.items():
        if not path.exists():
            sys.exit("Snapshot ausente: {}\nRode o gerador da esfera '{}' primeiro.".format(
                path, esfera))
        snapshots[esfera] = json.loads(path.read_text(encoding="utf-8"))

    esferas = {}
    for esfera, snap in snapshots.items():
        com_valor = esfera == "estadual"
        if esfera == "federal":
            # o federal guarda o resto no bucket `semMunicipioPB`; o total do estado
            # é municipalizado + esse resto.
            sem = snap.get("semMunicipioPB") or {}
            muni = snap.get("municipios") or {}
            tot_emp = sum(a.get("empenhado", 0.0) for a in muni.values())
            tot_pago = sum(a.get("pago", 0.0) for a in muni.values())
            estado_emp = round(tot_emp + sem.get("empenhado", 0.0), 2)
            estado_pago = round(tot_pago + sem.get("pago", 0.0), 2)
            por_ano = {}
            for a in list(muni.values()) + [sem]:
                for ano, v in (a.get("porAno") or {}).items():
                    s = por_ano.setdefault(ano, {"empenhado": 0.0, "pago": 0.0})
                    s["empenhado"] = round(s["empenhado"] + v.get("empenhado", 0.0), 2)
                    s["pago"] = round(s["pago"] + v.get("pago", 0.0), 2)
            estado = {
                "empenhado": estado_emp, "pago": estado_pago,
                "porAno": dict(sorted(por_ano.items())),
                "nEmendas": snap.get("nEmendasPB", 0), "nAutores": snap.get("nAutoresPB", 0),
                "naoMunicipalizado": {
                    "empenhado": sem.get("empenhado", 0.0),
                    "pago": sem.get("pago", 0.0),
                    "nota": "aplicação estadual/nacional; não entra em nenhum dos 223 municípios",
                },
            }
            cobertura = round(tot_pago / estado_pago, 4) if estado_pago else 0.0
        else:
            e = snap.get("estado") or {}
            meta = snap.get("meta") or {}
            muni = snap.get("municipios") or {}
            tot = {k: sum(a.get(k, 0.0) for a in muni.values())
                   for k in ("valor", "empenhado", "pago")}
            estado = {
                "valor": e.get("valor", 0.0),
                "empenhado": e.get("empenhado", 0.0),
                "pago": e.get("pago", 0.0),
                "porAno": e.get("porAno") or {},
                "nEmendas": meta.get("nEmendas", 0), "nAutores": meta.get("nAutores", 0),
                "naoMunicipalizado": {
                    "valor": round(e.get("valor", 0.0) - tot["valor"], 2),
                    "empenhado": round(e.get("empenhado", 0.0) - tot["empenhado"], 2),
                    "pago": round(e.get("pago", 0.0) - tot["pago"], 2),
                    "nota": "emendas cujo beneficiário declarado não é um município "
                            "(ONGs, associações, fundos e órgãos estaduais)",
                },
            }
            cobertura = meta.get("coberturaValor", 0.0)

        esferas[esfera] = {
            "janela": snap.get("janela") or {},
            "atribuicao": ATRIBUICAO[esfera],
            "criterioQuebraAnual": CRITERIO_ANO[esfera],
            "source": SOURCE[esfera],
            "coletadoEm": snap.get("fetchedAt") or "",
            "estado": estado,
            "coberturaMunicipal": cobertura,
        }

    municipios = []
    for ibge, nome in municipios_canonicos():
        municipios.append({
            "id": ibge,
            "name": nome,
            "federal": valores((snapshots["federal"].get("municipios") or {}).get(ibge), False),
            "estadual": valores((snapshots["estadual"].get("municipios") or {}).get(ibge), True),
        })

    payload = {"esferas": esferas, "municipios": municipios}
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    if args.pretty:
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    else:
        out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                       encoding="utf-8")

    com_fed = sum(1 for m in municipios if m["federal"])
    com_est = sum(1 for m in municipios if m["estadual"])
    print("OK — {} ({:.0f} KB)".format(out, out.stat().st_size / 1024))
    print("  {} municípios · federal em {} · estadual em {}".format(
        len(municipios), com_fed, com_est))
    for esfera, meta in esferas.items():
        print("  {:9s} janela {}–{} · cobertura municipal {:.1f}% · coletado {}".format(
            esfera, meta["janela"].get("de"), meta["janela"].get("ate"),
            meta["coberturaMunicipal"] * 100, meta["coletadoEm"]))


if __name__ == "__main__":
    main()
