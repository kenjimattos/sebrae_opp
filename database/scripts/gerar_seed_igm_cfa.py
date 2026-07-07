#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador IGM-CFA do banco da OPP.

Fonte: Índice CFA de Governança Municipal (IGM-CFA), do Conselho Federal de
Administração (CFA). O CFA não publica microdados em CSV — só um dashboard
Power BI "publish to web" (https://igm.cfa.org.br/bi). Este script raspa esse
dashboard pela API pública do Power BI (endpoint `querydata`), filtrando UF=PB.

⚠️  FRÁGIL (ver database/MAPEAMENTO_BASE_DOS_DADOS.md §6): o `RESOURCE_KEY`
    abaixo é o token anônimo embutido no iframe do dashboard. Ele gira de tempos
    em tempos (meses). Quando o modo --online quebrar (HTTP 403/expired), reabra
    https://igm.cfa.org.br/bi, capture no DevTools a URL app.powerbi.com/view?r=…,
    decodifique o base64 do parâmetro `r` ({"k":<resourceKey>,"t":<tenant>}) e
    atualize RESOURCE_KEY. O REPORT_ID/DATASET_ID/MODEL_ID saem de uma chamada GET
    a `.../public/reports/{RESOURCE_KEY}/modelsAndExploration`.

Cobertura: os 223 municípios da Paraíba, painel histórico 2017–2026 (10 anos).
Por padrão a UI exibe o ano em indicators.referenceYear; aqui é o mais recente.

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-igm-cfa.mongodb.js
  - database/data/igm_cfa_pb.json   (snapshot versionado da raspagem, já com IBGE)

Uso:
  python3 database/scripts/gerar_seed_igm_cfa.py            # online (raspa o CFA)
  python3 database/scripts/gerar_seed_igm_cfa.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GEOJSON = REPO_ROOT / "src" / "data" / "geo" / "paraiba.json"
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
SNAPSHOT = DATA_DIR / "igm_cfa_pb.json"

SOURCE = "Índice CFA de Governança Municipal (IGM-CFA) — Conselho Federal de Administração (CFA)"
SOURCE_DATASET = "cfa_igm_powerbi"
INDICATOR_ID = "igm-cfa"
LABEL = "IGM – Índice CFA de Governança Municipal"
# Faixas OFICIAIS do CFA (escala 0-10): Alto > 7,51 · Médio 5,01-7,50 · Baixo < 5,00.
# https://cfa.org.br/diagnostico-brasil-igm-cfa-... — mapeadas para o semáforo:
# success = 7,51 (Alto = verde) · warning = 5,01 (Médio = amarelo) · < 5,01 = Baixo (vermelho).
THRESHOLD = {"kind": "higher-better", "success": 7.51, "warning": 5.01}
# descrição espelha src/data/indicators/descriptions/indicators.ts ('igm-cfa-2025').
DESCRIPTION = (
    "Índice do Conselho Federal de Administração que avalia a qualidade da gestão "
    "pública municipal em três dimensões: Finanças, Gestão e Desempenho."
)

# ---- Power BI publish-to-web (dashboard do CFA) ----
WABI = "https://wabi-brazil-south-api.analysis.windows.net/public/reports/querydata?synchronous=true"
RESOURCE_KEY = "eecd56d2-d4d2-40d0-9ee7-1203cc50aa11"  # token anônimo — gira; ver docstring
DATASET_ID = "d80b919d-d054-4d99-944b-88893df2e69e"
REPORT_ID = "13522802"
MODEL_ID = 11356413
ENTITY = "IGM CFA"  # tabela do modelo Power BI

# Municípios renomeados: nome no IGM-CFA (atual) -> código IBGE no GeoJSON
# (o GeoJSON do IBGE ainda traz os nomes antigos).
ALIAS_IBGE = {
    "sao-domingos-de-pombal": "2513968",  # GeoJSON: "São Domingos"
    "tacima": "2516409",                  # GeoJSON: "Campo de Santana"
}

# Colunas pedidas ao Power BI (ordem = projeção no Binding).
SELECT = [
    ("nome", "Column", "nome"),
    ("ano", "Column", "ano"),
    ("igm", "Aggregation", "IGM/CFA"),
    ("fin", "Aggregation", "Finanças - Dimensão"),
    ("ges", "Aggregation", "Gestão - Dimensão"),
    ("des", "Aggregation", "Desempenho - Dimensão"),
]


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def br(value: float) -> str:
    """Formata em padrão BR com 2 casas (escala 0-10): 6.8 -> '6,80'."""
    return f"{value:.2f}".replace(".", ",")


# ---------- raspagem do Power BI ----------

def _build_query() -> dict:
    src = {"SourceRef": {"Source": "i"}}
    sel = []
    for i, (name, kind, prop) in enumerate(SELECT):
        if kind == "Column":
            sel.append({"Column": {"Expression": src, "Property": prop}, "Name": name})
        else:
            sel.append({"Aggregation": {"Expression": {"Column": {"Expression": src, "Property": prop}}, "Function": 0}, "Name": name})
    return {
        "version": "1.0.0",
        "queries": [{
            "Query": {"Commands": [{"SemanticQueryDataShapeCommand": {
                "Query": {
                    "Version": 2,
                    "From": [{"Name": "i", "Entity": ENTITY, "Type": 0}],
                    "Select": sel,
                    "Where": [{"Condition": {"In": {
                        "Expressions": [{"Column": {"Expression": src, "Property": "estado (sigla)"}}],
                        "Values": [[{"Literal": {"Value": "'PB'"}}]],
                    }}}],
                },
                "Binding": {
                    "Primary": {"Groupings": [{"Projections": list(range(len(SELECT)))}]},
                    "DataReduction": {"DataVolume": 3, "Primary": {"Window": {"Count": 30000}}},
                    "Version": 1,
                },
            }}]},
            "QueryId": "",
            "ApplicationContext": {"DatasetId": DATASET_ID, "Sources": [{"ReportId": REPORT_ID, "VisualId": ""}]},
        }],
        "cancelQueries": [],
        "modelId": MODEL_ID,
    }


def _post(payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(WABI, data=body, method="POST", headers={
        "X-PowerBI-ResourceKey": RESOURCE_KEY,
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://app.powerbi.com",
        "Referer": "https://app.powerbi.com/",
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "gzip",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    if raw[:2] == b"\x1f\x8b":  # gzip magic
        raw = gzip.decompress(raw)
    return json.loads(raw)


def _parse_dsr(resp: dict) -> list[dict]:
    data = resp["results"][0]["result"]["data"]
    shapes = data.get("dsr", {}).get("DataShapes")
    if shapes and isinstance(shapes, list) and "odata.error" in shapes[0]:
        sys.exit("Power BI retornou erro (resourceKey expirou? schema mudou?): "
                 + json.dumps(shapes[0]["odata.error"], ensure_ascii=False)[:300])
    ds = data["dsr"]["DS"][0]
    dicts = ds.get("ValueDicts", {})
    seg = ds["PH"][0]["DM0"]
    ncol = len(seg[0]["S"])
    schema = seg[0]["S"]  # [{N,T,DN?}, ...] na ordem das colunas
    rows, prev = [], [None] * ncol
    for r in seg:
        C, R, O = r.get("C", []), r.get("R", 0), r.get("Ø", 0)
        vals, ci = [None] * ncol, 0
        for i in range(ncol):
            if R & (1 << i):
                vals[i] = prev[i]
            elif O & (1 << i):
                vals[i] = None
            else:
                vals[i] = C[ci]; ci += 1
        prev = vals
        # resolve value-dict: T:1 com DN aponta índice no dicionário; senão é literal
        out = []
        for i, col in enumerate(schema):
            v = vals[i]
            dn = col.get("DN")
            out.append(dicts[dn][v] if (dn and isinstance(v, int)) else v)
        rows.append(out)
    names = [c[0] for c in SELECT]  # nome,ano,igm,fin,ges,des
    return [dict(zip(names, row)) for row in rows]


def fetch_igm() -> list[dict]:
    recs = _parse_dsr(_post(_build_query()))
    if not recs:
        sys.exit("Raspagem retornou 0 registros.")
    return recs


def load_geo() -> dict:
    gj = json.loads(GEOJSON.read_text(encoding="utf-8"))
    geo = {}
    for ft in gj["features"]:
        p = ft["properties"]
        geo[slugify(p["name"])] = p["id"]
    return geo


def resolve_ibge(recs: list[dict], geo: dict) -> list[dict]:
    out, missing = [], set()
    for r in recs:
        sl = slugify(r["nome"])
        ibge = geo.get(sl) or ALIAS_IBGE.get(sl)
        if not ibge:
            missing.add(r["nome"]); continue
        out.append({"ibge": ibge, **r})
    if missing:
        sys.exit("Municípios sem código IBGE (atualizar ALIAS_IBGE): " + ", ".join(sorted(missing)))
    return out


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_igm_cfa.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(recs: list[dict]) -> None:
    anos = sorted({int(r["ano"]) for r in recs})
    ano_default = str(anos[-1])
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        "threshold": THRESHOLD,
        "referenceYear": ano_default,  # ano exibido por padrão (mais recente disponível)
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "índice (0–10)",
        "placements": [{"section": "agenda", "agendaId": "governanca", "order": 1}],
    }
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador IGM-CFA (agenda governanca) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(igm-cfa) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município × ano ({len(recs)} docs), IGM-CFA {anos[0]}–{anos[-1]} ---")
    lines.append("// Série histórica: a chave inclui referenceYear, então todos os anos convivem.")
    lines.append("// o status deriva do threshold do indicador. breakdown = 3 dimensões do IGM.")
    lines.append("const values = [")
    for r in sorted(recs, key=lambda x: (x["ibge"], int(x["ano"]))):
        value = {
            "municipalityId": r["ibge"],
            "indicatorId": INDICATOR_ID,
            "rawValue": br(float(r["igm"])),
            "numericValue": round(float(r["igm"]), 3),
            "referenceYear": str(int(r["ano"])),
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {
                "financas": round(float(r["fin"]), 3),
                "gestao": round(float(r["ges"]), 3),
                "desempenho": round(float(r["des"]), 3),
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
    lines.append("print(`indicatorValues(igm-cfa) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-igm-cfa.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador IGM-CFA.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem raspar o CFA")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    geo = load_geo()

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        recs = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] {len(recs)} registros do snapshot.")
    else:
        raw = fetch_igm()
        recs = resolve_ibge(raw, geo)
        SNAPSHOT.write_text(json.dumps(recs, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(recs)} registros raspados; snapshot salvo em {SNAPSHOT}")

    emit(recs)
    anos = sorted({int(r["ano"]) for r in recs})
    muns = {r["ibge"] for r in recs}
    print(f"OK — {len(muns)} municípios, {len(recs)} valores IGM-CFA ({anos[0]}–{anos[-1]}). Seed em {SEED_DIR}")


if __name__ == "__main__":
    main()
