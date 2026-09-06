#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador **Ranking municipal Redesim/PB** (`ranking-redesim`)
da agenda "Simplificação e digitalização" da OPP.

Fonte: Ranking Municipal do Ambiente de Negócios da Redesim Paraíba, via a API REST
pública (sem autenticação) do portal Mapa de Empresas/PB (app Next.js):
  base = https://www.redesim.pb.gov.br/api/mapa-empresas-service
  - GET /ranking-periodo                                       -> anos/meses disponíveis
  - GET /ranking-municipal?periodoInicial=YYYY-MM-01&periodoFinal=YYYY-MM-01
        -> 223 municípios da PB já com **código IBGE** (`cod_municipio`), posição e a
           pontuação decomposta.

Janela: o ranking é apurado nos **últimos 6 meses** (o 6º é o mês selecionado). O gerador
pega a janela de 6 meses que termina no mês mais recente disponível.

INDICADOR: `ranking-redesim`. A API soma as avaliações dos 6 meses, então as escalas são
6× as da metodologia mensal (Documentos Habilitados 35→210, Índice de Atendimento 15→90,
Índice de Tempo 50→300, Total 100→600). Por decisão do projeto (jun/2026):
  - `numericValue` = **total** (0–600), a pontuação consolidada da janela.
  - `breakdown` guarda posição (1–223), percentual (total normalizado 0–100) e as 3
    componentes (documento/índice de atendimento/índice de tempo) + região e a janela.

SEM THRESHOLD (semáforo): o ranking publica posição e pontos, mas **não** uma faixa
oficial de "bom/atenção/alerta" para o total. Seguindo a regra do projeto (não inventar
cortes), o indicador entra **sem `threshold`** — exibe só o valor/posição. (O corte
`higher-better 900/600` que estava em src/data/indicators/thresholds.ts era inventado e
numa escala que nem bate com a fonte.)

Cobertura: os 223 municípios da PB (a API devolve os 223; o gerador valida contra a lista
canônica do seed de municípios e aborta se faltar/sobrar algum).

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-ranking-redesim.mongodb.js   (catálogo + valores)
  - database/data/ranking_redesim_pb.json                (snapshot versionado da resposta)

Uso:
  python3 database/scripts/gerar_seed_ranking_redesim.py            # online (consulta a API)
  python3 database/scripts/gerar_seed_ranking_redesim.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "ranking_redesim_pb.json"
SEED_FILE = SEED_DIR / "indicador-ranking-redesim.mongodb.js"

API_BASE = "https://www.redesim.pb.gov.br/api/mapa-empresas-service"
JANELA_MESES = 6  # o ranking é apurado nos últimos 6 meses
TOTAL_MAX = 600   # 100 pts/mês × 6 meses

INDICATOR_ID = "ranking-redesim"
ORDER = 3  # posição na agenda simplificacao (espelha catalog.ts)
LABEL = "Ranking municipal Redesim/PB"
DESCRIPTION = (
    "Pontuação do município no Ranking Municipal do Ambiente de Negócios da Redesim/PB, "
    "somando os 6 meses da janela (Documentos Habilitados + Índice de Atendimento + "
    "Índice de Tempo). Escala 0–600; o breakdown traz posição e as componentes."
)
SOURCE = ("Ranking Municipal do Ambiente de Negócios — Redesim Paraíba "
          "(redesim.pb.gov.br/mapa-empresas/ranking-municipal)")
SOURCE_DATASET = "redesim_pb_ranking_municipal"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


def _get(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "opp-seed/1.0"})
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def municipios_canonicos() -> list[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


def janela() -> tuple[str, str]:
    """(periodoInicial, periodoFinal) no formato YYYY-MM-01 da janela de 6 meses mais recente."""
    per = json.loads(_get(f"{API_BASE}/ranking-periodo"))
    # mês final = maior (ano, mês) disponível
    fim = max((e["ano"], e["meses"]["fim"]) for e in per)
    ano_f, mes_f = fim
    # 6 meses contando o final: volta 5 meses
    idx = ano_f * 12 + (mes_f - 1) - (JANELA_MESES - 1)
    ano_i, mes_i = divmod(idx, 12)
    mes_i += 1
    return f"{ano_i}-{mes_i:02d}-01", f"{ano_f}-{mes_f:02d}-01"


def fetch() -> dict:
    ini, fim = janela()
    rows = json.loads(_get(f"{API_BASE}/ranking-municipal?periodoInicial={ini}&periodoFinal={fim}"))
    if not isinstance(rows, list) or not rows:
        sys.exit("ranking-municipal não devolveu lista — verifique a API/janela.")
    return {
        "periodoInicial": ini,
        "periodoFinal": fim,
        "janelaLabel": f"{ini[:7]} a {fim[:7]}",
        "totalMax": TOTAL_MAX,
        "rows": rows,
    }


def build_values(snapshot: dict) -> list[dict]:
    by_code = {str(r["cod_municipio"]): r for r in snapshot["rows"]}
    codes = municipios_canonicos()
    extra = set(by_code) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: " + ", ".join(sorted(extra))[:400])
    ref_year = snapshot["periodoFinal"][:4]
    janela_label = snapshot["janelaLabel"]
    source = f"{SOURCE} — últimos 6 meses ({janela_label})"
    valores = []
    for code in codes:
        r = by_code.get(code)
        if not r:  # município sem linha no ranking (não habilitado na janela)
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": ref_year,
                "source": source, "isFictional": False,
                "breakdown": {"semDados": True, "mesesAbrangidos": janela_label},
            })
            continue
        total = int(r["total"])
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": str(total), "numericValue": total,
            "referenceYear": ref_year, "source": source, "isFictional": False,
            "breakdown": {
                "posicao": int(r["posicao"]),               # 1 = melhor (de 223)
                "totalMaximo": TOTAL_MAX,                    # 600
                "percentual": int(r["percentual"]),          # total normalizado 0–100
                "documentoHabilitado": int(r["documento"]),  # componente DH (máx 210)
                "indiceAtendimento": int(r["indice"]),       # componente IA (máx 90)
                "indiceTempo": int(r["tempo"]),              # componente Índice de Tempo (máx 300)
                "regiao": r.get("region"),
                "mesesAbrangidos": janela_label,
            },
        })
    return valores


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_ranking_redesim.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict], ref_year: str, janela_label: str) -> Path:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: o ranking não publica faixa oficial de bom/atenção/alerta para o total.
        "referenceYear": ref_year,
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "pontos (0–600)",
        "placements": [{"section": "agenda", "agendaId": "simplificacao", "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append(f"// --- 1) Catálogo: o indicador {INDICATOR_ID} (agenda simplificacao) ---")
    lines.append("// SEM threshold: a fonte não publica faixa oficial p/ o total (não inventamos cortes).")
    lines.append("// numericValue = total (0–600); breakdown traz posição, percentual e componentes.")
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({INDICATOR_ID}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), janela {janela_label} ---")
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
    lines.append(f"print(`indicatorValues({INDICATOR_ID}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)")
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def main() -> None:
    ap = argparse.ArgumentParser(description=f"Gera o seed do indicador {INDICATOR_ID} (Redesim/PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] snapshot {snapshot['janelaLabel']} — {len(snapshot['rows'])} municípios.")
    else:
        snapshot = fetch()
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(snapshot['rows'])} municípios; snapshot salvo em {SNAPSHOT}")

    values = build_values(snapshot)
    ref_year = snapshot["periodoFinal"][:4]
    out = emit(values, ref_year, snapshot["janelaLabel"])

    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    print(f"{INDICATOR_ID}: {len(com)}/223 com dado; total médio={media:.0f}/600 "
          f"(janela {snapshot['janelaLabel']}).")
    print(f"OK — seed em {out}")


if __name__ == "__main__":
    main()
