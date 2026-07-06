#!/usr/bin/env python3
"""
Gera os seeds (mongosh) dos indicadores do **ISDEL** no banco da OPP, a partir de um
único CSV interno do Sebrae. Um gerador, uma fonte (database/data/isdel_pb.csv), **dois
seeds** (um arquivo por indicador):

  - indicador-isdel-governanca.mongodb.js    (dimensão Governança para o Desenvolvimento)
  - indicador-isdel-educacao-emp.mongodb.js  (subdimensão Educação Empreendedora)

Fonte: ISDEL 2.0 (Índice Sebrae de Desenvolvimento Econômico Local, SEBRAE/MG +
CEDEPLAR-UFMG). 106 variáveis → 39 indicadores → 18 subdimensões → 5 dimensões DEL,
cada componente normalizado na escala 0–1. Origem do dado: acervo público do ISDEL do
Sebrae Minas — https://inteligencia.sebraemg.com.br/isdel/acervo (planilha da PB salva
como CSV, o próprio CSV é o snapshot). O CSV traz a série anual da PB (2015–2023) com as
duas colunas do ISDEL que estão no catálogo da OPP.

Os dois indicadores têm naturezas diferentes — refletidas na config abaixo:

  • Governança para o Desenvolvimento — é uma das **5 dimensões DEL**. COM threshold:
    as faixas OFICIAIS do ISDEL (nota metodológica 2021, Figura 4) — Muito Baixo <0,150 ·
    Baixo 0,151–0,310 · Médio 0,311–0,470 · Alto 0,471–0,630 · Muito Alto ≥0,631 →
    success 0,471 / warning 0,311. Ressalva: a faixa é do índice **agregado**, aplicada
    à dimensão (extrapolação razoável — a nota p.36 diz que a pontuação "no agregado ou
    nas dimensões" usa o mesmo 0–1 e interpretação). Ano exibido: 2023.

  • Educação Empreendedora — é uma **subdimensão** de Capital Empreendedor (peso 0,1),
    medindo penetração de programas Sebrae (Sebraetec + Empreendedor do Futuro, PF/PJ).
    SEM threshold: a faixa oficial é do índice agregado e a nota (p.36) só a estende às
    **dimensões**, não a subdimensões; além disso é fortemente zero-inflada (nota p.34:
    "elevado número de municípios com zeros"). Nos dados da PB 58% são 0 e 2022–2023 estão
    ~100% zerados, então aplicar a faixa marcaria todos como "Muito Baixo"/vermelho — sem
    sentido. Entra sem semáforo (só o número), como Trabalhadores C&T/TIC. Ano exibido:
    2021 (último ano com dado real; 2022–2023 zerados não servem de default).

Comparabilidade: a nota (p.17) diz que o ISDEL 2.0 recalculou a série 2015–2019 e passou
a divulgá-la anualmente; logo a série 2015–2023 é toda 2.0 (comparável entre si). NÃO é
comparável ao ISDEL 1.0 (p.18). Cobertura: 223 municípios da PB × 9 anos = 2.007 valores
por indicador. Ver database/README.md → Classificação.

Saídas (idempotentes, próprias para o NoSQLBooster). Uso:
  python3 database/scripts/gerar_seed_isdel.py
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
CSV_SOURCE = DATA_DIR / "isdel_pb.csv"

# Um indicador por coluna do CSV. `threshold=None` => indicador entra sem semáforo.
INDICATORS = [
    {
        "id": "isdel-governanca",
        "label": "Governança para o Desenvolvimento – ISDEL",
        "column": "Governança para o Desenvolvimento",
        "seed_file": "indicador-isdel-governanca.mongodb.js",
        "default_year": "2023",
        # faixas OFICIAIS do ISDEL (nota 2021, Fig. 4): Alto começa em 0,471; Médio em 0,311.
        "threshold": {"kind": "higher-better", "success": 0.471, "warning": 0.311},
        "description": (
            "Dimensão do Índice Sebrae de Desenvolvimento Econômico Local (ISDEL) que "
            "avalia a capacidade institucional do município para promover desenvolvimento "
            "econômico."
        ),
        "source": ("Índice Sebrae de Desenvolvimento Econômico Local (ISDEL 2.0) — dimensão "
                   "Governança para o Desenvolvimento (Sebrae/CEDEPLAR-UFMG)"),
        "agenda_id": "governanca",
        # ordem na agenda governanca (catalog.ts: igm-cfa=1, idh-m=2, isdel=3, igma=4).
        "order": 3,
        "kind_note": "dimensão Governança para o Desenvolvimento do ISDEL (escala 0–1)",
    },
    {
        "id": "isdel-educacao-emp",
        "label": "Educação Empreendedora – ISDEL",
        "column": "Educação Empreendedora",
        "seed_file": "indicador-isdel-educacao-emp.mongodb.js",
        "default_year": "2021",  # 2022–2023 ~100% zerados
        "threshold": None,  # subdimensão zero-inflada; faixa oficial é do índice agregado
        # descrição fiel à nota metodológica 2021 (Quadro 1) — não é "rede de ensino".
        "description": (
            "Subdimensão do ISDEL (dimensão Capital Empreendedor) que mede a penetração "
            "dos programas de educação empreendedora do Sebrae no município — clientes "
            "Sebraetec e Programa Empreendedor do Futuro (PF e PJ)."
        ),
        "source": ("Índice Sebrae de Desenvolvimento Econômico Local (ISDEL 2.0) — subdimensão "
                   "Educação Empreendedora (Sebrae/CEDEPLAR-UFMG)"),
        "agenda_id": "educacao",
        "order": 1,  # 1º indicador da agenda educacao (catalog.ts)
        "kind_note": "subdimensão Educação Empreendedora do ISDEL (escala 0–1)",
    },
]
SOURCE_DATASET = "isdel_sebrae"


def br3(value: float) -> str:
    """Formata na escala ISDEL em padrão BR com 3 casas: 0.4313 -> '0,431'."""
    return f"{value:.3f}".replace(".", ",")


def canonical_municipios() -> list[str]:
    """Os 223 municípios da PB — fonte única: o seed de municípios."""
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


def read_csv() -> tuple[list[dict], list[str]]:
    if not CSV_SOURCE.exists():
        sys.exit(f"CSV fonte não encontrado: {CSV_SOURCE}")
    with CSV_SOURCE.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        fields = reader.fieldnames or []
        for spec in INDICATORS:
            if spec["column"] not in fields:
                sys.exit(f"Coluna '{spec['column']}' ausente no CSV. Colunas: {fields}")
        rows = [r for r in reader if (r.get("Ano") or "").strip() and (r.get("Mun_Cod") or "").strip()]
    if not rows:
        sys.exit("CSV sem linhas de dados.")
    anos = sorted({(r.get("Ano") or "").strip() for r in rows})
    return rows, anos


def build_values(rows: list[dict], spec: dict) -> list[dict]:
    codes = canonical_municipios()
    code_set = set(codes)
    col = spec["column"]

    by_year: dict[str, dict[str, str]] = {}
    for r in rows:
        by_year.setdefault(r["Ano"].strip(), {})[r["Mun_Cod"].strip()] = (r.get(col) or "").strip()
    for ano, got in by_year.items():
        extra = set(got) - code_set
        missing = code_set - set(got)
        if extra or missing:
            sys.exit(f"[{spec['id']}] ano {ano}: cobertura inconsistente — "
                     f"faltando {sorted(missing)[:5]} sobrando {sorted(extra)[:5]}")

    values = []
    for ano in sorted(by_year):
        for code in codes:  # ordem canônica (IBGE crescente)
            num = float((by_year[ano][code] or "0").replace(",", "."))
            values.append({
                "municipalityId": code,
                "indicatorId": spec["id"],
                "rawValue": br3(num),
                "numericValue": round(num, 6),
                "referenceYear": ano,
                "source": spec["source"],
                "isFictional": False,
            })
    return values


# ---------- emissão do script mongosh ----------

def header(seed_file: str) -> str:
    return (f"// ARQUIVO GERADO por database/scripts/gerar_seed_isdel.py — NÃO editar à mão.\n"
            "// Idempotente: rodar de novo atualiza (upsert), não duplica.\n"
            "// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.\n"
            "// Para mirar um banco específico, troque a linha abaixo por:\n"
            "//   const database = db.getSiblingDB('opp')\n"
            "const database = db\n")


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(spec: dict, values: list[dict], anos: list[str]) -> Path:
    indicator = {"_id": spec["id"], "label": spec["label"]}
    if spec["threshold"] is not None:
        indicator["threshold"] = spec["threshold"]
    indicator["referenceYear"] = spec["default_year"]
    indicator["unit"] = "índice (0–1)"
    indicator["description"] = spec["description"]
    indicator["source"] = spec["source"]
    indicator["sourceDataset"] = SOURCE_DATASET
    indicator["placements"] = [{"section": "agenda", "agendaId": spec["agenda_id"], "order": spec["order"]}]

    faixa = f"{anos[0]}–{anos[-1]}"
    sem = "" if spec["threshold"] is not None else " SEM threshold (sem faixa oficial aplicável)."
    lines = [header(spec["seed_file"]), "",
             f"// --- 1) Catálogo: {spec['label']} (agenda {spec['agenda_id']}) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({spec['id']}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município × ano ({len(values)} docs), ISDEL {faixa} ---")
    lines.append(f"// {spec['kind_note']}.{sem} referenceYear faz parte da chave.")
    lines.append("const values = [")
    for v in values:
        lines.append(f"  {js(v)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append(f"print(`indicatorValues({spec['id']}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)")
    out = SEED_DIR / spec["seed_file"]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def main() -> None:
    argparse.ArgumentParser(description="Gera os seeds dos indicadores ISDEL (governança + educação empreendedora).").parse_args()
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    rows, anos = read_csv()
    for spec in INDICATORS:
        values = build_values(rows, spec)
        out = emit(spec, values, anos)
        com_valor = sum(1 for v in values if v["numericValue"] > 0)
        tipo = "threshold oficial" if spec["threshold"] is not None else "SEM threshold"
        print(f"OK [{spec['id']}] — {len(values)} valores (223 × {len(anos)} anos {anos[0]}–{anos[-1]}), "
              f"{com_valor} > 0, exibe {spec['default_year']}, {tipo}. Seed: {out.name}")


if __name__ == "__main__":
    main()
