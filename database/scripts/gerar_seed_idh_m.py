#!/usr/bin/env python3
"""
Gera os scripts de seed (mongosh) das AGENDAS e do indicador IDH-M do banco da OPP.

(Os municípios têm gerador próprio: database/scripts/gerar_seed_municipios.py.)

Fonte:
  - IDH-M 2010: basedosdados `mundo_onu_adh.municipio` (Atlas do Desenvolvimento
    Humano — PNUD/Ipea/FJP, Censo 2010), consultado via BigQuery.

Saídas (idempotentes, próprias para rodar no NoSQLBooster):
  - database/seed/agendas.mongodb.js
  - database/seed/indicador-idh-m.mongodb.js
  - database/data/idhm_pb_2010.json  (snapshot versionado da consulta)

Uso:
  python3 database/scripts/gerar_seed_idh_m.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_idh_m.py --offline   # usa o snapshot já salvo

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
SNAPSHOT = DATA_DIR / "idhm_pb_2010.json"

ANO_IDHM = "2010"
SOURCE = "Atlas do Desenvolvimento Humano (PNUD/Ipea/FJP), Censo 2010 — basedosdados mundo_onu_adh"
SOURCE_DATASET = "mundo_onu_adh"

# Catálogo (espelha src/data/indicators/catalog.ts). Mantido aqui para o gerador
# ser autossuficiente; é a estrutura fixa das agendas da OPP.
AGENDAS = [
    ("governanca", "Governança: Parcerias público, privada, social para o desenvolvimento local"),
    ("simplificacao", "Serviços públicos mais simples e digitais para os pequenos negócios"),
    ("inovacao", "Ecossistemas de Inovação: Inclusão e digitalização para Pequenos Negócios"),
    ("educacao", "Educação empreendedora"),
    ("credito", "Acesso a crédito e viabilização financeira"),
    ("inclusao", "Iniciativas para gerar trabalho e renda para os pequenos negócios"),
]

# Um único indicador IDH-M, com colocações ("placements") em duas seções: na agenda
# 'governanca' e na seção 'socialeconomic' (cards do Panorama). threshold/descrição
# espelham thresholds.ts e descriptions/*.ts.
DESC_IDHM = (
    "Índice de Desenvolvimento Humano Municipal — combina longevidade, educação e "
    "renda numa escala de 0 a 1. Quanto mais próximo de 1, maior o desenvolvimento humano."
)
INDICATORS = [
    {
        "_id": "idh-m",
        "label": "IDH-M",
        "threshold": {"kind": "higher-better", "success": 0.7, "warning": 0.6},
        "updatedAt": ANO_IDHM,
        "description": DESC_IDHM,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [
            # order 2 na governanca: o IGM-CFA ocupa a posição 1 (espelha catalog.ts)
            {"section": "agenda", "agendaId": "governanca", "order": 2},
            {"section": "socialeconomic", "order": 1},
        ],
    },
]

QUERY = """
SELECT id_municipio, idhm, idhm_e, idhm_l, idhm_r
FROM `basedosdados.mundo_onu_adh.municipio`
WHERE ano = 2010 AND id_municipio LIKE '25%'
ORDER BY id_municipio
"""


def br(value: float) -> str:
    """Formata em padrão brasileiro com 3 casas: 0.72 -> '0,720'."""
    return f"{value:.3f}".replace(".", ",")


def fetch_idhm(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    return rows


# ---------- emissão dos scripts mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_idh_m.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    """Serializa em JS/JSON compacto e estável (ordem de chaves preservada)."""
    return json.dumps(obj, ensure_ascii=False)


def emit_agendas() -> None:
    lines = [HEADER, "", "// Estrutura das 6 agendas da OPP (catálogo)."]
    lines.append("const agendas = [")
    for order, (aid, name) in enumerate(AGENDAS):
        lines.append(f"  {js({'_id': aid, 'name': name, 'order': order})},")
    lines.append("]")
    lines.append("")
    lines.append("const ops = agendas.map(a => ({ updateOne: {")
    lines.append("  filter: { _id: a._id },")
    lines.append("  update: { $set: { name: a.name, order: a.order } },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.agendas.bulkWrite(ops, { ordered: false })")
    lines.append("print(`agendas -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "agendas.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def emit_indicador_idhm(rows: list[dict]) -> None:
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador IDH-M (placements: agenda + socialeconomic) ---"]
    lines.append("const indicators = [")
    for ind in INDICATORS:
        lines.append(f"  {js(ind)},")
    lines.append("]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(idh-m) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(rows)} docs), IDH-M {ANO_IDHM} ---")
    lines.append("// Um doc por município. status/tone derivam do threshold do indicador onde for exibido.")
    lines.append("const values = [")
    for r in rows:
        idhm = float(r["idhm"])
        value = {
            "municipalityId": r["id_municipio"],
            "indicatorId": "idh-m",
            "rawValue": br(idhm),
            "numericValue": round(idhm, 3),
            "referenceYear": ANO_IDHM,
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {
                "educacao": float(r["idhm_e"]),
                "longevidade": float(r["idhm_l"]),
                "renda": float(r["idhm_r"]),
            },
        }
        lines.append(f"  {js(value)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`indicatorValues(idh-m) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-idh-m.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera os scripts de seed do banco da OPP.")
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
        rows = fetch_idhm(project)
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    emit_agendas()
    emit_indicador_idhm(rows)
    print(f"OK — {len(rows)} valores de IDH-M. Scripts em {SEED_DIR}")


if __name__ == "__main__":
    main()
