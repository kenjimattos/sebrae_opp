#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador **Bolsa Família** (`bolsa-familia`) da agenda
"Inclusão produtiva" da OPP.

Fonte: **Observatório Setorial Territorial do Sebrae** (observatorio.sebrae.com.br,
plataforma Datawheel), que expõe uma **API Tesseract OLAP pública sem autenticação**:
  base = https://apiv2-observatorio.sebrae.com.br/tesseract
  - GET /cubes                                  -> catálogo de 59 cubos
  - GET /members?cube=MDS_PBF&level=<nível>     -> membros de uma dimensão
  - GET /data.jsonrecords?cube=MDS_PBF&drilldowns=&measures=&<Nível>=<chaves>  -> dados

Cubo: **MDS_PBF** (Programa Bolsa Família, MDS). Medida `Beneficiary Families`
(famílias beneficiárias, **estoque mensal**) + `Transferred Value`. Geografia até
Município (chave = código IBGE 7 díg.); recorte State=25 (PB). Dimensão Time = Year/Month.

== Ressalva semântica (importante — proxy, igual ao crescimento-mpe) ==
O catálogo da OPP chama este indicador de "Crescimento de beneficiários Bolsa Família
**(18 a 50 anos)**". Esse **recorte etário não existe em fonte municipal aberta e atual**:
  - A tabela agregada da Base dos Dados (`bolsa_familia`) é por município × mês, conta
    **famílias** (sem idade) e está **congelada em 2004–2020** (não tem o Novo Bolsa Família).
  - O recorte por idade só existe no **CadÚnico amostral** (microdado de pessoa, faixa
    etária + flag PBF), que é **amostra desidentificada e defasada (2012–2018)** — ruim para
    contagem municipal de cidade pequena.
  - O cubo MDS_PBF (esta fonte) é **atual (2023–2025)** e municipal, mas **não tem dimensão
    de idade**: a unidade é **família beneficiária**, não pessoa por faixa etária.
Por decisão do projeto (jun/2026) adota-se o **proxy municipal**: crescimento das **famílias
beneficiárias** do Bolsa Família no município. O `_id` permanece `bolsa-familia` para casar
com o slot do catálogo; label/description/source deixam claro que é famílias (sem o recorte
18–50, indisponível em fonte aberta atual). Mesmo patamar de confiança do `crescimento-mpe`.

== Métrica ==
Para cada município e ano Y, calcula-se a **média mensal de famílias beneficiárias** (média
dos estoques mensais disponíveis no ano — robusta a anos com nº de meses diferente: 2023
começa em mar/2023 com o relançamento do programa; o último ano pode vir parcial).
  - `numericValue` = variação % a.a. = (média[refYear] − média[prevYear]) / média[prevYear] × 100
  - refYear  = último ano com dados; prevYear = refYear − 1 (par mais recente e limpo).
  - `breakdown` guarda a média mensal de cada ano, a contagem de meses, a série anual, o
    valor total repassado no ano-ref e `confiabilidade` (baixa quando a base é pequena).

== SEM threshold (semáforo) ==
Não há faixa oficial de "bom/atenção/alerta" para taxa de crescimento de beneficiários do
PBF. Seguindo a regra do projeto (não inventar cortes — ver memory feedback_verify_primary_
sources e o precedente `ranking-redesim`/`crescimento-mpe`), o indicador entra **sem `threshold`**.

Cobertura: os 223 municípios da PB. Municípios sem famílias no ano-base entram com
`numericValue: null` (não há como calcular variação).

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-bolsa-familia.mongodb.js   (catálogo + valores)
  - database/data/bolsa_familia_pb.json               (snapshot versionado da resposta)

Uso:
  python3 database/scripts/gerar_seed_bolsa_familia.py            # online (consulta a API)
  python3 database/scripts/gerar_seed_bolsa_familia.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "bolsa_familia_pb.json"
SEED_FILE = SEED_DIR / "indicador-bolsa-familia.mongodb.js"

API_BASE = "https://apiv2-observatorio.sebrae.com.br/tesseract"
CUBE = "MDS_PBF"
PB_STATE_KEY = "25"                  # Paraíba na dimensão Geography/State
ANO_MIN_SERIE = 2023                 # série guardada no breakdown a partir daqui (Novo PBF)
CONF_BAIXA = 100                     # média mensal de famílias-base < 100 → confiabilidade baixa

INDICATOR_ID = "bolsa-familia"       # mantém o slot do catálogo (agenda inclusao)
ORDER = 4
LABEL = "Crescimento de famílias beneficiárias do Bolsa Família"
DESCRIPTION = (
    "Variação percentual anual na média mensal de famílias beneficiárias do Programa Bolsa "
    "Família no município. Proxy municipal aberto: o recorte por idade (18 a 50 anos) do "
    "catálogo não existe em fonte municipal atual — só no CadÚnico amostral defasado — então "
    "mede-se famílias beneficiárias (Novo Bolsa Família), não pessoas por faixa etária."
)
SOURCE = (
    "Programa Bolsa Família (cubo MDS_PBF — MDS), via API Tesseract pública do "
    "Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br) — "
    "média mensal de famílias beneficiárias por ano"
)
SOURCE_DATASET = "mds_pbf_observatorio_sebrae"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


def _get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "opp-seed/1.0"})
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def municipios_canonicos() -> list:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit("Não consegui ler os códigos IBGE de %s." % MUNICIPIOS_SEED)
    return codes


def fetch() -> dict:
    """Baixa famílias beneficiárias por município × ano × mês (PB)."""
    params = {
        "cube": CUBE,
        "drilldowns": "Municipality,Year,Month",
        "measures": "Beneficiary Families,Transferred Value",
        "State": PB_STATE_KEY,
    }
    url = "%s/data.jsonrecords?%s" % (
        API_BASE, urllib.parse.urlencode(params, quote_via=urllib.parse.quote))
    rows = json.loads(_get(url)).get("data", [])
    if not rows:
        sys.exit("API retornou 0 linhas — verifique o cubo/recorte.")
    return {
        "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
        "cube": CUBE,
        "url": url,
        "rows": rows,
    }


def _series_por_municipio(rows):
    """mun(str) -> {ano:int -> {'fam': [estoques mensais], 'valor': soma repassada}}"""
    serie = defaultdict(lambda: defaultdict(lambda: {"fam": [], "valor": 0.0}))
    for r in rows:
        mid = str(r["Municipality ID"])
        ano = r["Year"]
        if not isinstance(ano, int):
            continue
        cel = serie[mid][ano]
        cel["fam"].append(float(r["Beneficiary Families"]))
        cel["valor"] += float(r.get("Transferred Value") or 0.0)
    return serie


def _media_mensal(anos, ano):
    """Média mensal de famílias no ano (None se não houver meses)."""
    cel = anos.get(ano)
    if not cel or not cel["fam"]:
        return None
    return sum(cel["fam"]) / len(cel["fam"])


def _anos_referencia(rows):
    """(refYear, prevYear). refYear = último ano com dados; prevYear = refYear-1."""
    anos = sorted({r["Year"] for r in rows if isinstance(r["Year"], int)})
    if len(anos) < 2:
        sys.exit("Série anual insuficiente para calcular crescimento.")
    ref = anos[-1]
    return ref, ref - 1


def build_values(snapshot):
    rows = snapshot["rows"]
    serie = _series_por_municipio(rows)
    codes = municipios_canonicos()
    extra = set(serie) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: " + ", ".join(sorted(extra))[:400])

    ref_year, prev_year = _anos_referencia(rows)
    source = "%s (ano-ref %d vs %d)" % (SOURCE, ref_year, prev_year)

    valores = []
    pb = defaultdict(lambda: {"fam": 0.0, "meses": 0})  # cross-check: ano -> média mensal PB
    for code in codes:
        anos = serie.get(code, {})

        # série anual de média mensal (p/ breakdown) e contribuição ao agregado PB
        serie_anual = {}
        for a in sorted(anos):
            if a < ANO_MIN_SERIE:
                continue
            m = _media_mensal(anos, a)
            if m is not None:
                serie_anual[str(a)] = int(round(m))
                cel = anos[a]
                pb[a]["fam"] += sum(cel["fam"])
                pb[a]["meses"] += len(cel["fam"])

        media_ref = _media_mensal(anos, ref_year)
        media_prev = _media_mensal(anos, prev_year)
        meses_ref = len(anos.get(ref_year, {}).get("fam", [])) if ref_year in anos else 0
        meses_prev = len(anos.get(prev_year, {}).get("fam", [])) if prev_year in anos else 0
        valor_ref = anos.get(ref_year, {}).get("valor", 0.0) if ref_year in anos else 0.0

        if not media_prev:  # sem base → não dá pra calcular variação
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ref_year),
                "source": source, "isFictional": False,
                "breakdown": {
                    "semBase": True, "anoBase": prev_year, "anoRef": ref_year,
                    "familiasBaseMedia": int(round(media_prev)) if media_prev else 0,
                    "familiasRefMedia": int(round(media_ref)) if media_ref else None,
                    "mesesRef": meses_ref, "mesesBase": meses_prev,
                    "serieAnual": serie_anual,
                    "metrica": "média mensal de famílias beneficiárias do PBF por ano",
                },
            })
            continue

        crescimento = (media_ref - media_prev) / media_prev * 100.0
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": "%+.0f%%" % crescimento, "numericValue": round(crescimento, 1),
            "referenceYear": str(ref_year), "source": source, "isFictional": False,
            "breakdown": {
                "familiasRefMedia": int(round(media_ref)),    # média mensal de famílias no ano-ref
                "familiasBaseMedia": int(round(media_prev)),  # média mensal no ano anterior
                "anoRef": ref_year, "anoBase": prev_year,
                "mesesRef": meses_ref, "mesesBase": meses_prev,
                "valorRepassadoRef": int(round(valor_ref)),   # total R$ repassado no ano-ref
                "serieAnual": serie_anual,                    # média mensal de famílias/ano
                "confiabilidade": "baixa" if media_prev < CONF_BAIXA else "normal",
                "metrica": "média mensal de famílias beneficiárias do PBF por ano",
            },
        })

    pb_media = {a: (d["fam"] / d["meses"] if d["meses"] else 0.0) for a, d in pb.items()}
    meta = {"refYear": ref_year, "prevYear": prev_year, "pbMediaPorAno": pb_media}
    return valores, meta


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_bolsa_familia.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def emit(values, ref_year):
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: não há faixa oficial p/ taxa de crescimento do PBF (não inventamos cortes).
        "referenceYear": str(ref_year),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "% a.a.",
        "placements": [{"section": "agenda", "agendaId": "inclusao", "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: o indicador %s (agenda inclusao) ---" % INDICATOR_ID)
    lines.append("// Proxy MUNICIPAL (MDS/PBF): crescimento das FAMÍLIAS beneficiárias do Bolsa Família.")
    lines.append("// O recorte '18 a 50 anos' do catálogo não existe em fonte municipal aberta atual")
    lines.append("// (só no CadÚnico amostral 2012–2018) — ver docstring do gerador e o MAPEAMENTO.")
    lines.append("// SEM threshold: não há faixa oficial de crescimento do PBF (não inventamos cortes).")
    lines.append("const indicators = [\n  %s,\n]" % js(indicator))
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(%s) -> ok (${indicators.length} docs)`)" % INDICATOR_ID)
    lines.append("")
    lines.append("// --- 2) Valores por município (%d docs), ano-ref %d vs %d ---"
                 % (len(values), ref_year, ref_year - 1))
    lines.append("const values = [")
    for v in values:
        lines.append("  %s," % js(v))
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`indicatorValues(%s) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)" % INDICATOR_ID)
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def main():
    ap = argparse.ArgumentParser(
        description="Gera o seed do indicador %s (famílias do Bolsa Família — MDS/Observatório Sebrae)." % INDICATOR_ID)
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit("Snapshot não encontrado: %s. Rode online uma vez primeiro." % SNAPSHOT)
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print("[offline] snapshot %s — %d linhas." % (snapshot.get("fetchedAt"), len(snapshot["rows"])))
    else:
        snapshot = fetch()
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[online] %d linhas; snapshot salvo em %s" % (len(snapshot["rows"]), SNAPSHOT))

    values, meta = build_values(snapshot)
    out = emit(values, meta["refYear"])

    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    pb = meta["pbMediaPorAno"]
    ref, prev = meta["refYear"], meta["prevYear"]
    pb_cresc = (pb.get(ref, 0) - pb.get(prev, 0)) / pb.get(prev, 1) * 100 if pb.get(prev) else 0
    print("%s: %d/223 com crescimento calculável; média=%+.1f%% (ano-ref %d vs %d)."
          % (INDICATOR_ID, len(com), media, ref, prev))
    print("Cross-check PB: média mensal de famílias %d=%d -> %d=%d (%+.1f%%)."
          % (prev, int(pb.get(prev, 0)), ref, int(pb.get(ref, 0)), pb_cresc))
    print("OK — seed em %s" % out)


if __name__ == "__main__":
    main()
