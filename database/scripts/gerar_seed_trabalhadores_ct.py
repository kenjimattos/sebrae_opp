#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador "Trabalhadores nas ocupações de C&T" do banco da OPP.

Fonte: RAIS (Relação Anual de Informações Sociais — Ministério do Trabalho e Emprego),
microdados de vínculos, via basedosdados (`br_me_rais.microdados_vinculos`) no BigQuery.

Definição de "ocupações de C&T" (núcleo científico-tecnológico): vínculos formais
ATIVOS em 31/12 cujo CBO 2002 pertence aos subgrupos principais (2 primeiros dígitos):

    20 — Pesquisadores e profissionais policientíficos
    21 — Profissionais das ciências exatas, físicas e da engenharia (inclui TIC)
    31 — Técnicos de nível médio das ciências físicas, químicas, engenharia e afins

É o "núcleo duro" tecnológico — exclui ensino, saúde, direito, ciências sociais,
artes e administração (que comporiam o conceito HRST amplo da OCDE). Ver
database/MAPEAMENTO_BASE_DOS_DADOS.md (agenda Inovação).

SEM CLASSIFICAÇÃO (semáforo): a RAIS/CBO não publica uma faixa oficial de
"bom/atenção/alerta" para a contagem de trabalhadores de C&T — é um dado bruto. Por
decisão do projeto (jun/2026) não inventamos cortes; o indicador entra SEM `threshold`,
ou seja, exibe apenas o valor, sem cor. (Os índices IDH-M/IGM-CFA/IGMA usam as faixas
oficiais das suas fontes.)

Cobertura: os 223 municípios da Paraíba. Municípios sem nenhum vínculo de C&T na
RAIS não aparecem na consulta e entram com valor 0 (a lista canônica dos 223 vem do
seed de municípios). referenceYear = "2024" (última RAIS consolidada na basedosdados).

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-trabalhadores-ct.mongodb.js
  - database/data/trabalhadores_ct_pb_2024.json   (snapshot versionado da consulta)

Uso:
  python3 database/scripts/gerar_seed_trabalhadores_ct.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_trabalhadores_ct.py --offline   # usa o snapshot

Requer (para a consulta online): credenciais ADC do GCP
  gcloud auth application-default login
  pip install google-cloud-bigquery
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "trabalhadores_ct_pb_2024.json"

ANO = "2024"
SOURCE = ("RAIS — vínculos formais ativos em 31/12/2024, ocupações de C&T "
          "(CBO 2002 subgrupos 20/21/31) — basedosdados br_me_rais")
SOURCE_DATASET = "br_me_rais"
INDICATOR_ID = "trabalhadores-ct"
LABEL = "Trabalhadores nas ocupações de C&T"
# SEM threshold: contagem bruta da RAIS, sem faixa oficial de classificação (ver docstring).
# descrição espelha src/data/indicators/descriptions/indicators.ts ('trabalhadores-ct').
DESCRIPTION = (
    "Número de trabalhadores formais em ocupações de Ciência e Tecnologia, "
    "conforme RAIS/CAGED."
)

# Subgrupos principais (2 primeiros dígitos do CBO 2002) que compõem o núcleo de C&T.
CBO_SUBGRUPOS_CT = ("20", "21", "31")

QUERY = f"""
SELECT id_municipio,
  COUNTIF(SUBSTR(cbo_2002, 1, 2) = '20') AS pesquisadores,
  COUNTIF(SUBSTR(cbo_2002, 1, 2) = '21') AS ciencias_eng,
  COUNTIF(SUBSTR(cbo_2002, 1, 2) = '31') AS tecnicos,
  COUNT(*) AS total
FROM `basedosdados.br_me_rais.microdados_vinculos`
WHERE sigla_uf = 'PB' AND ano = {ANO} AND vinculo_ativo_3112 = '1'
  AND SUBSTR(cbo_2002, 1, 2) IN ('{"', '".join(CBO_SUBGRUPOS_CT)}')
GROUP BY id_municipio
ORDER BY id_municipio
"""


def br_int(value: int) -> str:
    """Formata inteiro em padrão BR com separador de milhar: 19760 -> '19.760'."""
    return f"{value:,}".replace(",", ".")


def fetch(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    # normaliza para int (BigQuery devolve int64)
    for r in rows:
        for k in ("pesquisadores", "ciencias_eng", "tecnicos", "total"):
            r[k] = int(r[k])
    return rows


# ---------- cobertura: os 223 municípios da PB (fonte única: seed de municípios) ----------

def canonical_municipios() -> list[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


def build_values(rows: list[dict]) -> list[dict]:
    """Cruza a consulta (só municípios com >=1 vínculo de C&T) com os 223 canônicos.
    Municípios ausentes na RAIS entram com total 0 (breakdown zerado)."""
    by_code = {r["id_municipio"]: r for r in rows}
    codes = canonical_municipios()
    extra = set(by_code) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: "
                 + ", ".join(sorted(extra))[:400])
    values = []
    for code in codes:
        r = by_code.get(code, {"pesquisadores": 0, "ciencias_eng": 0, "tecnicos": 0, "total": 0})
        total = int(r["total"])
        values.append({
            "municipalityId": code,
            "indicatorId": INDICATOR_ID,
            "rawValue": br_int(total),
            "numericValue": total,
            "referenceYear": ANO,
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {
                "pesquisadores": int(r["pesquisadores"]),   # CBO subgrupo 20
                "cienciasEngenharia": int(r["ciencias_eng"]),  # CBO subgrupo 21
                "tecnicos": int(r["tecnicos"]),             # CBO subgrupo 31
            },
        })
    return values


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_trabalhadores_ct.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict]) -> None:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: dado bruto sem faixa oficial -> sem classificação (semáforo).
        "referenceYear": ANO,  # ano exibido por padrão
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        # primeiro indicador da agenda Inovação (espelha catalog.ts).
        "unit": "vínculos",
        "placements": [{"section": "agenda", "agendaId": "inovacao", "order": 1}],
    }
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador Trabalhadores em C&T (agenda inovacao) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    # replaceOne, não $set: o documento passa a ser exatamente o que este seed
    # declara. Com $set, campo REMOVIDO do seed sobrevive no banco — foi assim que
    # o `threshold` deste indicador, tirado em 72d8e21 por não haver faixa oficial
    # na RAIS, seguiu classificando 219 dos 223 municípios em produção.
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(trabalhadores-ct) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), RAIS {ANO} ---")
    lines.append("// Contagem de vínculos formais ativos em ocupações de C&T (CBO subgrupos")
    lines.append("// 20/21/31). Sem threshold no catálogo -> sem classificação. breakdown = 3 subgrupos.")
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
    lines.append("print(`indicatorValues(trabalhadores-ct) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-trabalhadores-ct.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador Trabalhadores em C&T.")
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
        rows = fetch(project)
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    values = build_values(rows)
    emit(values)
    total = sum(v["numericValue"] for v in values)
    print(f"OK — {len(values)} municípios (223 esperados), {total} vínculos de C&T no total. "
          f"Seed em {SEED_DIR / 'indicador-trabalhadores-ct.mongodb.js'}")


if __name__ == "__main__":
    main()
