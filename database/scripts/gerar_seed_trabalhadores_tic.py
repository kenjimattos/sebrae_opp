#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador "Trabalhadores nos setores de economia criativa,
inovação e TIC" do banco da OPP.

Fonte: RAIS (Relação Anual de Informações Sociais — Ministério do Trabalho e Emprego),
microdados de vínculos, via basedosdados (`br_me_rais.microdados_vinculos`) no BigQuery.

O indicador é a **participação percentual** dos vínculos formais ativos em 31/12 que
estão em setores intensivos em conhecimento, criatividade e tecnologia, sobre o total
de vínculos do município. "Setores de C&T/criativos" = divisões CNAE 2.0 (2 primeiros
dígitos do `cnae_2`):

    TIC:      26 (informática/eletrônica), 61 (telecom), 62 (sistemas/TI), 63 (serviços
              de informação)
    Criativa: 58 (edição), 59 (audiovisual), 60 (rádio/TV), 73 (publicidade),
              74 (design, fotografia), 90 (artes), 91 (patrimônio cultural)
    Inovação: 72 (pesquisa e desenvolvimento científico)

É a definição "TIC + economia criativa + P&D" — corresponde aos três domínios do nome
do indicador. NÃO inclui a divisão 71 (arquitetura/engenharia/testes técnicos), que
diluiria em serviços técnicos gerais. Ver database/MAPEAMENTO_BASE_DOS_DADOS.md (Inovação).

Cobertura: os 223 municípios da Paraíba (todos têm vínculos formais, logo todos têm %).
referenceYear = "2024" (última RAIS consolidada na basedosdados).

SEM CLASSIFICAÇÃO (semáforo): não há faixa oficial de "bom/atenção/alerta" para a
participação em setores criativos/TIC (a FIRJAN publica a média nacional ~3,6% como
referência descritiva, mas não um semáforo, e usa cesta CNAE diferente da nossa). Por
decisão do projeto (jun/2026) não inventamos cortes; o indicador entra SEM `threshold`,
exibindo só o valor. (Os índices IDH-M/IGM-CFA/IGMA usam as faixas oficiais das fontes.)

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-trabalhadores-tic.mongodb.js
  - database/data/trabalhadores_tic_pb_2024.json   (snapshot versionado da consulta)

Uso:
  python3 database/scripts/gerar_seed_trabalhadores_tic.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_trabalhadores_tic.py --offline   # usa o snapshot

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
SNAPSHOT = DATA_DIR / "trabalhadores_tic_pb_2024.json"

ANO = "2024"
SOURCE = ("RAIS — % dos vínculos formais ativos em 31/12/2024 em setores de economia "
          "criativa, inovação e TIC (CNAE 2.0 divisões 26/58/59/60/61/62/63/72/73/74/90/91) "
          "— basedosdados br_me_rais")
SOURCE_DATASET = "br_me_rais"
INDICATOR_ID = "trabalhadores-tic"
LABEL = "Trabalhadores nos setores da economia criativa, inovação e TIC"
# SEM threshold: participação sem faixa oficial de classificação (ver docstring).
# descrição espelha src/data/indicators/descriptions/indicators.ts ('trabalhadores-tic').
DESCRIPTION = (
    "Participação percentual dos trabalhadores formais em setores intensivos em "
    "conhecimento, criatividade e tecnologia."
)

# Divisões CNAE 2.0 (2 primeiros dígitos de cnae_2) por sub-domínio.
DIV_TIC = ("26", "61", "62", "63")
DIV_CRIATIVA = ("58", "59", "60", "73", "74", "90", "91")
DIV_PD = ("72",)
DIV_TODAS = DIV_TIC + DIV_CRIATIVA + DIV_PD


def _in_list(divs: tuple[str, ...]) -> str:
    return "(" + ", ".join(f"'{d}'" for d in divs) + ")"


QUERY = f"""
SELECT id_municipio,
  COUNT(*) AS total,
  COUNTIF(SUBSTR(cnae_2, 1, 2) IN {_in_list(DIV_TIC)}) AS tic,
  COUNTIF(SUBSTR(cnae_2, 1, 2) IN {_in_list(DIV_CRIATIVA)}) AS criativa,
  COUNTIF(SUBSTR(cnae_2, 1, 2) IN {_in_list(DIV_PD)}) AS pesquisa,
  COUNTIF(SUBSTR(cnae_2, 1, 2) IN {_in_list(DIV_TODAS)}) AS setor
FROM `basedosdados.br_me_rais.microdados_vinculos`
WHERE sigla_uf = 'PB' AND ano = {ANO} AND vinculo_ativo_3112 = '1'
GROUP BY id_municipio
ORDER BY id_municipio
"""


def br_pct(value: float) -> str:
    """Formata percentual em padrão BR com 2 casas: 2.17 -> '2,17%'."""
    return f"{value:.2f}".replace(".", ",") + "%"


def fetch(project: str | None) -> list[dict]:
    from google.cloud import bigquery

    client = bigquery.Client(project=project) if project else bigquery.Client()
    rows = [dict(r) for r in client.query(QUERY).result()]
    if not rows:
        sys.exit("Consulta retornou 0 linhas — verifique o projeto/credenciais.")
    for r in rows:
        for k in ("total", "tic", "criativa", "pesquisa", "setor"):
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
    by_code = {r["id_municipio"]: r for r in rows}
    codes = canonical_municipios()
    extra = set(by_code) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: "
                 + ", ".join(sorted(extra))[:400])
    values = []
    for code in codes:
        r = by_code.get(code, {"total": 0, "tic": 0, "criativa": 0, "pesquisa": 0, "setor": 0})
        total = int(r["total"])
        setor = int(r["setor"])
        pct = round(100 * setor / total, 2) if total else 0.0
        values.append({
            "municipalityId": code,
            "indicatorId": INDICATOR_ID,
            "rawValue": br_pct(pct),
            "numericValue": pct,
            "referenceYear": ANO,
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {
                "vinculosSetor": setor,            # numerador
                "vinculosTotal": total,            # denominador
                "tic": int(r["tic"]),              # CNAE 26/61/62/63
                "criativa": int(r["criativa"]),    # CNAE 58/59/60/73/74/90/91
                "pesquisa": int(r["pesquisa"]),    # CNAE 72
            },
        })
    return values


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_trabalhadores_tic.py — NÃO editar à mão.
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
        # sem `threshold`: participação sem faixa oficial -> sem classificação (semáforo).
        "referenceYear": ANO,  # ano exibido por padrão
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        # segundo indicador da agenda Inovação (espelha catalog.ts).
        "unit": "%",
        "placements": [{"section": "agenda", "agendaId": "inovacao", "order": 2}],
    }
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador Trabalhadores em economia criativa/inovação/TIC (agenda inovacao) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(trabalhadores-tic) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), RAIS {ANO} ---")
    lines.append("// % dos vínculos formais ativos em setores de economia criativa/inovação/TIC")
    lines.append("// (CNAE divisões 26/58/59/60/61/62/63/72/73/74/90/91). o status deriva do")
    lines.append("// threshold do indicador. Sem threshold no catálogo -> sem classificação. breakdown = numerador/denominador + split TIC/criativa/pesquisa.")
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
    lines.append("print(`indicatorValues(trabalhadores-tic) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-trabalhadores-tic.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador Trabalhadores em economia criativa/inovação/TIC.")
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
    com_setor = sum(1 for v in values if v["numericValue"] > 0)
    print(f"OK — {len(values)} municípios (223 esperados), {com_setor} com participação > 0. "
          f"Seed em {SEED_DIR / 'indicador-trabalhadores-tic.mongodb.js'}")


if __name__ == "__main__":
    main()
