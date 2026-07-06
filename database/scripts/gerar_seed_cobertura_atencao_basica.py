#!/usr/bin/env python3
"""
Gera o script de seed (mongosh) do indicador Cobertura da Atenção Básica na Saúde
(card do Panorama / base econômica) do banco da OPP.

Fonte:
  - Cobertura da Atenção Básica 2020: basedosdados `br_ms_atencao_basica.municipio`
    (Ministério da Saúde — e-Gestor AB / SISAB), consultado via BigQuery. A coluna
    `proporcao_cobertura_total_atencao_basica` é a Cobertura da Atenção Básica
    oficial (% da população coberta por equipes de AB, limitada a 100%).

Métrica: **média das 12 competências mensais** do ano de referência (média anual
da cobertura). A cobertura é publicada por competência (mês) e oscila ao longo do
ano — um município pode cair a 0% num mês isolado por lapso de contrato de equipe.
A média anual é robusta a esses buracos pontuais (mesmo critério do `bolsa-familia`,
que usa a média mensal do estoque). O ano de referência é o último disponível na BD.

Variação: cada doc carrega o campo `variation` com a variação YoY (média anual de
2020 vs média anual de 2019), só quando o ano anterior também tem 12 competências.

Sem semáforo: o Ministério da Saúde não publica faixa oficial de classificação
(verde/amarelo/vermelho) para a cobertura — o parâmetro é só o teto de 100%. Logo o
indicador entra sem threshold (não inventamos cortes).

Saídas (idempotentes, próprias para rodar no NoSQLBooster):
  - database/seed/indicador-cobertura-atencao-basica.mongodb.js
  - database/data/cobertura_atencao_basica_pb_2020.json  (snapshot versionado)

Uso:
  python3 database/scripts/gerar_seed_cobertura_atencao_basica.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_cobertura_atencao_basica.py --offline  # usa o snapshot

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

ANO = "2020"
ANO_ANTERIOR = "2019"  # variação YoY: média anual de 2020 vs média anual de 2019
SNAPSHOT = DATA_DIR / f"cobertura_atencao_basica_pb_{ANO}.json"
SOURCE = (
    f"Cobertura da Atenção Básica {ANO} (média das 12 competências mensais), "
    "Ministério da Saúde — e-Gestor AB/SISAB — basedosdados br_ms_atencao_basica"
)
SOURCE_DATASET = "br_ms_atencao_basica"
ESPERADO_PB = 223

DESC = (
    "Proporção da população do município coberta por equipes de Atenção Básica "
    "(Atenção Primária à Saúde), numa escala de 0 a 100%. Mede o alcance da porta "
    "de entrada do SUS — quanto mais próximo de 100%, maior a parcela da população "
    "com acompanhamento de saúde da família/atenção básica."
)

# Indicador único, exibido nos cards do Panorama (base econômica). Na tabela de base
# econômica do MAPEAMENTO vem depois de IDSC (order 0) e IDH-M (order 1) -> order 2.
INDICATORS = [
    {
        "_id": "cobertura-atencao-basica",
        "label": "Cobertura Atenção Básica na Saúde",
        "updatedAt": ANO,
        "description": DESC,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        # sem threshold: o MS não publica faixa oficial de semáforo para a cobertura.
        "placements": [
            {"section": "socialeconomic", "order": 2},
        ],
    },
]

QUERY = f"""
WITH anual AS (
  SELECT id_municipio, ano,
         ROUND(AVG(proporcao_cobertura_total_atencao_basica), 2) AS cobertura_total,
         ROUND(AVG(proporcao_cobertura_estrategia_saude_familia), 2) AS cobertura_esf,
         COUNT(*) AS meses,
         MAX(populacao) AS populacao
  FROM `basedosdados.br_ms_atencao_basica.municipio`
  WHERE sigla_uf = 'PB' AND ano IN ({ANO}, {ANO_ANTERIOR})
  GROUP BY id_municipio, ano)
SELECT a.id_municipio,
       a.cobertura_total, a.cobertura_esf, a.meses, a.populacao,
       p.cobertura_total AS cobertura_total_anterior, p.meses AS meses_anterior
FROM anual a
LEFT JOIN anual p ON p.id_municipio = a.id_municipio AND p.ano = {ANO_ANTERIOR}
WHERE a.ano = {ANO}
ORDER BY a.id_municipio
"""


def br(value: float) -> str:
    """Formata em padrão brasileiro com 2 casas: 98.57 -> '98,57'."""
    return f"{value:.2f}".replace(".", ",")


def fetch_cobertura(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    if len(rows) != ESPERADO_PB:
        print(f"[aviso] esperava {ESPERADO_PB} municípios da PB, recebi {len(rows)}", file=sys.stderr)
    return rows


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_cobertura_atencao_basica.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    """Serializa em JS/JSON compacto e estável (ordem de chaves preservada)."""
    return json.dumps(obj, ensure_ascii=False)


def emit_indicador(rows: list[dict]) -> None:
    lines = [HEADER, "", "// --- 1) Catálogo: Cobertura da Atenção Básica (card do Panorama / base econômica) ---"]
    lines.append("// Sem threshold: o MS não publica faixa oficial de semáforo para a cobertura.")
    lines.append("const indicators = [")
    for ind in INDICATORS:
        lines.append(f"  {js(ind)},")
    lines.append("]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(cobertura-atencao-basica) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(rows)} docs), Cobertura AB {ANO} (média anual) ---")
    lines.append("// Um doc por município. numericValue = % de cobertura total (0-100, sem semáforo).")
    lines.append(f"// variation = variação YoY da média anual ({ANO} vs {ANO_ANTERIOR}), ou null se faltar ano anterior completo.")
    lines.append("const values = [")
    for r in rows:
        cob = float(r["cobertura_total"])
        esf = r.get("cobertura_esf")
        # variação YoY: média anual do ano-ref vs. média anual do ano anterior.
        # Só computa se o ano anterior também tiver os 12 meses (comparação justa).
        prev = r.get("cobertura_total_anterior")
        meses_prev = r.get("meses_anterior")
        variation = None
        if prev is not None and float(prev) != 0 and meses_prev == 12:
            variation = {
                "deltaPct": round((cob - float(prev)) / float(prev) * 100, 1),
                "previousValue": round(float(prev), 2),
                "previousYear": ANO_ANTERIOR,
                "basis": "yoy-media-anual",
            }
        value = {
            "municipalityId": str(r["id_municipio"]),
            "indicatorId": "cobertura-atencao-basica",
            "rawValue": br(cob) + "%",
            "numericValue": round(cob, 2),
            "referenceYear": ANO,
            "source": SOURCE,
            "isFictional": False,
            "variation": variation,
            "breakdown": {
                "coberturaEstrategiaSaudeFamilia": round(float(esf), 2) if esf is not None else None,
                "populacao": int(r["populacao"]) if r.get("populacao") is not None else None,
                "mesesComputados": int(r["meses"]),
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
    lines.append("print(`indicatorValues(cobertura-atencao-basica) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-cobertura-atencao-basica.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador Cobertura da Atenção Básica do banco da OPP.")
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
        rows = fetch_cobertura(project)
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    emit_indicador(rows)
    print(f"OK — {len(rows)} valores de Cobertura AB. Script em {SEED_DIR / 'indicador-cobertura-atencao-basica.mongodb.js'}")


if __name__ == "__main__":
    main()
