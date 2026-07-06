#!/usr/bin/env python3
"""
Gera o script de seed (mongosh) do indicador PIB per capita (base econômica) do banco da OPP.

Fonte:
  - PIB municipal: basedosdados `br_ibge_pib.municipio` (IBGE, Contas Regionais), coluna
    `pib` (em REAIS — não em milhares) + VAB por setor. A tabela NÃO traz população nem
    per capita → join com `br_ibge_populacao.municipio` (`populacao`) por (id_municipio, ano).
    PIB per capita = pib / populacao. Consultado via BigQuery.
  - Último ano disponível (jun/2026): **2023**, 223/223 municípios da PB.

Variação: como os demais cards da base econômica, cada doc carrega `variation`
  (deltaPct/previousValue/previousYear/basis). Série anual → variação **2023 vs 2022**
  (basis `yoy`).

Saídas (idempotentes):
  - database/seed/indicador-pib-per-capita.mongodb.js
  - database/data/pib_per_capita_pb_2023.json  (snapshot versionado da consulta)

Uso:
  python3 database/scripts/gerar_seed_pib_per_capita.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_pib_per_capita.py --offline

Requer (para a consulta online): credenciais ADC do GCP
  gcloud auth application-default login
  pip install google-cloud-bigquery
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
SNAPSHOT = DATA_DIR / "pib_per_capita_pb_2023.json"

ANO_REF = "2023"
ANO_PREV = "2022"
SOURCE = "IBGE, Produto Interno Bruto dos Municípios (Contas Regionais) — basedosdados br_ibge_pib × br_ibge_populacao"
SOURCE_DATASET = "br_ibge_pib"

DESC_PIB_PC = (
    "Produto Interno Bruto per capita — razão entre o PIB municipal a preços correntes e a "
    "população residente estimada, em reais por habitante. Fonte: IBGE, Contas Regionais."
)

# Sem threshold: valor absoluto (R$/hab) não tem faixa oficial de semáforo.
# ordem 8 = posição na base econômica do catalog.ts (após empresas-ativas-total).
INDICATORS = [
    {
        "_id": "pib-per-capita",
        "label": "PIB per capita (2023)",
        "updatedAt": ANO_REF,
        "description": DESC_PIB_PC,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "socialeconomic", "order": 8}],
    },
]

# PIB (reais) + VAB por setor + população, para 2022 e 2023, PB.
QUERY = """
SELECT p.id_municipio, p.ano, p.pib, p.impostos_liquidos,
       p.va_agropecuaria, p.va_industria, p.va_servicos, p.va_adespss,
       pop.populacao
FROM `basedosdados.br_ibge_pib.municipio` p
JOIN `basedosdados.br_ibge_populacao.municipio` pop USING (id_municipio, ano)
WHERE p.ano IN (2022, 2023) AND p.id_municipio LIKE '25%'
  AND pop.populacao IS NOT NULL AND pop.populacao > 0
ORDER BY p.id_municipio, p.ano
"""


def br_reais(value: float) -> str:
    """Formata reais em padrão brasileiro com 2 casas: 34106.05 -> 'R$ 34.106,05'."""
    inteiro = f"{value:,.2f}"  # 34,106.05
    inteiro = inteiro.replace(",", "@").replace(".", ",").replace("@", ".")  # -> 34.106,05
    return "R$ " + inteiro


def fetch_pib(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    return rows


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_pib_per_capita.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def por_municipio(rows: list[dict]) -> dict:
    """Agrupa as linhas (2022/2023) por município: {id: {ano: rowdict}}."""
    out: dict = {}
    for r in rows:
        out.setdefault(r["id_municipio"], {})[str(r["ano"])] = r
    return out


def per_capita(row: dict) -> float:
    return float(row["pib"]) / float(row["populacao"])


def _int(x):
    """int() tolerante a None (alguns municípios têm VAB setorial nulo)."""
    return int(x) if x is not None else None


def emit_indicador_pib(rows: list[dict]) -> None:
    dados = por_municipio(rows)
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador PIB per capita (base econômica) ---"]
    lines.append("// Sem threshold: valor absoluto (R$/hab) não tem faixa oficial de semáforo.")
    lines.append("const indicators = [")
    for ind in INDICATORS:
        lines.append(f"  {js(ind)},")
    lines.append("]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(pib-per-capita) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município, PIB per capita {ANO_REF} (R$/hab) ---")
    lines.append("// variation = variação anual vs. 2022 (basis 'yoy'), ou null se faltar.")
    lines.append("const values = [")
    n = 0
    for mid in sorted(dados):
        serie = dados[mid]
        atual_row = serie.get(ANO_REF)
        if atual_row is None:
            continue
        pc = per_capita(atual_row)
        prev_row = serie.get(ANO_PREV)
        variation = None
        if prev_row is not None:
            pc_prev = per_capita(prev_row)
            if pc_prev != 0:
                variation = {
                    "deltaPct": round((pc - pc_prev) / pc_prev * 100, 1),
                    "previousValue": round(pc_prev, 2),
                    "previousYear": ANO_PREV,
                    "basis": "yoy",
                }
        value = {
            "municipalityId": mid,
            "indicatorId": "pib-per-capita",
            "rawValue": br_reais(pc),
            "numericValue": round(pc, 2),
            "referenceYear": ANO_REF,
            "source": SOURCE,
            "isFictional": False,
            "variation": variation,
            "breakdown": {
                "pibTotal": _int(atual_row["pib"]),
                "populacao": _int(atual_row["populacao"]),
                "vabAgropecuaria": _int(atual_row["va_agropecuaria"]),
                "vabIndustria": _int(atual_row["va_industria"]),
                "vabServicos": _int(atual_row["va_servicos"]),
                "vabAdmPublica": _int(atual_row["va_adespss"]),
                "impostosLiquidos": _int(atual_row["impostos_liquidos"]),
            },
        }
        lines.append(f"  {js(value)},")
        n += 1
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`indicatorValues(pib-per-capita) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-pib-per-capita.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK — {n} valores de PIB per capita ({ANO_REF}, variação vs {ANO_PREV}). Seed em {SEED_DIR}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador PIB per capita (base econômica).")
    ap.add_argument("--project", help="projeto GCP de faturamento para a consulta BigQuery")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar o BigQuery")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        rows = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] {len(rows)} registros do snapshot.")
    else:
        project = args.project or os.environ.get("GCP_BILLING_PROJECT")
        rows = fetch_pib(project)
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    emit_indicador_pib(rows)


if __name__ == "__main__":
    main()
