#!/usr/bin/env python3
"""
Gera o script de seed (mongosh) do indicador GINI (base econômica) do banco da OPP.

Fonte:
  - Índice de Gini 2010: basedosdados `mundo_onu_adh.municipio` (Atlas do Desenvolvimento
    Humano — PNUD/Ipea/FJP, Censo 2010), coluna `indice_gini`, consultado via BigQuery.
    É a MESMA tabela do IDH-M (gerar_seed_idh_m.py). 2010 é o teto de qualquer fonte
    municipal — o Censo 2022 não teve quesito de renda e a PNAD não desce a município.

Variação: **não exibida** — igual ao IDH-M. A série do Atlas é decenal (1991/2000/2010);
  a única variação possível seria 2010 vs 2000 (uma década, não ano-a-ano), e o card é
  rotulado "2010" → por decisão do projeto o Gini entra SEM `variation` (coerente com o
  idh-m; ver a nota de variação no MAPEAMENTO). Os demais cards da base econômica com série
  anual/edições continuam carregando `variation`.

Saídas (idempotentes):
  - database/seed/indicador-gini.mongodb.js
  - database/data/gini_pb_2010.json  (snapshot versionado da consulta)

Uso:
  python3 database/scripts/gerar_seed_gini.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_gini.py --offline   # usa o snapshot já salvo

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
SNAPSHOT = DATA_DIR / "gini_pb_2010.json"

ANO_REF = "2010"
SOURCE = "Atlas do Desenvolvimento Humano (PNUD/Ipea/FJP), Censo 2010 — basedosdados mundo_onu_adh"
SOURCE_DATASET = "mundo_onu_adh"

DESC_GINI = (
    "Índice de Gini da renda domiciliar per capita — mede a desigualdade na distribuição "
    "de renda numa escala de 0 (igualdade perfeita) a 1 (desigualdade máxima). "
    "Fonte: Atlas do Desenvolvimento Humano (Censo 2010)."
)

# Sem threshold: não há faixa oficial de semáforo para o Gini (não inventamos cortes,
# como em idsc/idh-m/trabalhadores-*). ordem 5 = posição na base econômica do catalog.ts.
INDICATORS = [
    {
        "_id": "gini",
        "label": "GINI (2010)",
        "referenceYear": ANO_REF,
        "description": DESC_GINI,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "índice (0–1)",
        "placements": [{"section": "socialeconomic", "order": 5}],
    },
]

# Só 2010 (sem variação — ver docstring). É a mesma tabela/edição do IDH-M.
QUERY = """
SELECT id_municipio, indice_gini
FROM `basedosdados.mundo_onu_adh.municipio`
WHERE ano = 2010 AND id_municipio LIKE '25%' AND indice_gini IS NOT NULL
ORDER BY id_municipio
"""


def br(value: float) -> str:
    """Formata em padrão brasileiro com 3 casas: 0.527 -> '0,527'."""
    return f"{value:.3f}".replace(".", ",")


def fetch_gini(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    return rows


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_gini.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    """Serializa em JS/JSON compacto e estável (ordem de chaves preservada)."""
    return json.dumps(obj, ensure_ascii=False)


def emit_indicador_gini(rows: list[dict]) -> None:
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador GINI (base econômica) ---"]
    lines.append("// Sem threshold: o Gini não tem faixa oficial de semáforo.")
    lines.append("const indicators = [")
    for ind in INDICATORS:
        lines.append(f"  {js(ind)},")
    lines.append("]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(gini) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município, GINI {ANO_REF} ---")
    lines.append("// Sem variation: série decenal do Atlas (ver docstring), igual ao idh-m.")
    lines.append("const values = [")
    n = 0
    for r in sorted(rows, key=lambda x: x["id_municipio"]):
        gini = float(r["indice_gini"])
        value = {
            "municipalityId": r["id_municipio"],
            "indicatorId": "gini",
            "rawValue": br(gini),
            "numericValue": round(gini, 3),
            "referenceYear": ANO_REF,
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {},
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
    lines.append("print(`indicatorValues(gini) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-gini.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK — {n} valores de GINI ({ANO_REF}, sem variação). Seed em {SEED_DIR}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador GINI (base econômica).")
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
        rows = fetch_gini(project)
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    emit_indicador_gini(rows)


if __name__ == "__main__":
    main()
