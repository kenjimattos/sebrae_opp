#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) do indicador **Operações não automáticas de crédito** (`bndes-operacoes`,
agenda "Acesso a crédito e viabilização financeira") — a partir do **Portal de Dados Abertos do
BNDES**, conjunto "Operações de Financiamento → Operações não automáticas". NÃO usa o data lake
do Sebrae (o BNDES não está no lake) nem a Base dos Dados (não tem BNDES). É um CSV público.

== O que são "operações não automáticas" ==
Universo do arquivo = operações contratadas **diretamente com o BNDES** (apoio direto) + operações
**indiretas** (via agente financeiro credenciado) **analisadas individualmente** pelo BNDES —
ou seja, "direto + indireto não automático". EXCLUI as operações indiretas automáticas (BNDES
Automático / Finame / Cartão BNDES) e pessoas físicas, que ficam no outro arquivo (1,1 Gb).
No CSV isso aparece como `forma_de_apoio` ∈ {DIRETA, INDIRETA} (a INDIRETA aqui já é a não
automática, pois as automáticas não entram neste conjunto).

== Métrica: FLUXO (R$ contratado), acumulado ==
Diferente do ESTBAN (que é saldo/estoque), aqui cada linha é a **contratação** de um subcrédito.
"Cada contrato pode ter vários subcréditos; o somatório dos subcréditos = valor do contrato"
(doc BNDES). Logo somar as linhas dá o valor total contratado. Como é fluxo, PODE-SE somar no
tempo:

  numericValue = Σ_linhas  valor_contratado_reais  (tomadores no município, na janela)

  - Janela default = TODOS os anos disponíveis (2002→último). Valores NOMINAIS (não deflacionados
    — o BNDES publica assim; corrigir exigiria deflator externo). Use --desde/--ate p/ recortar.
  - referenceYear = ano final da janela (ex.: "2025"); a janela vai em breakdown.janela.
  - Município é o do TOMADOR (`municipio_codigo`, IBGE 7-díg). Linhas "sem município"
    (`municipio_codigo` = "0"/vazio) são atribuídas só à UF → entram no rollup PB, NÃO no total
    municipal (contabilizadas em breakdown.semMunicipioPB do meta).
  - Cobertura = censo nacional de contratos. Município sem contrato → numericValue = 0 (zero real,
    não lacuna). Ressalva: parte das operações da PB fica "sem município".
  - SEM threshold: valor absoluto (R$), sem faixa oficial — o BNDES não classifica.

== Schema do CSV (confirmado jul/2026) ==
BNDES Dados Abertos, resource "Operações não automáticas" (~19 Mb, ~23,5k linhas Brasil).
Encoding **Windows-1252**, delimitador **";"**, decimal **","**. Colunas usadas:
  cliente · cnpj · uf · municipio · municipio_codigo(IBGE 7-díg) · numero_do_contrato
  · data_da_contratacao(ISO AAAA-MM-DD) · valor_contratado_reais · valor_desembolsado_reais
  · forma_de_apoio(DIRETA|INDIRETA) · modalidade_de_apoio · porte_do_cliente · setor_cnae
  · situacao_do_contrato · instituicao_financeira_credenciada
(há ~35 colunas no total; as demais são ignoradas.)

== USO ==
    python3 gerar_seed_bndes_operacoes.py --inspect        # colunas + forma_de_apoio + PB/anos
    python3 gerar_seed_bndes_operacoes.py                   # baixa o CSV, gera snapshot + seed
    python3 gerar_seed_bndes_operacoes.py --csv /path.csv   # usa um CSV já baixado
    python3 gerar_seed_bndes_operacoes.py --desde 2015      # recorta a janela (>= 2015)
    python3 gerar_seed_bndes_operacoes.py --offline         # regenera o seed do snapshot
    python3 gerar_seed_bndes_operacoes.py --write-mongo     # + OPP_MONGO_USER/PASS no .env

Requer só a stdlib (urllib/csv). --write-mongo requer 'pip install pymongo<4'.
Compatível com Python 3.6 (sem f-strings / list[...]).
"""
import argparse
import csv
import io
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional  # 3.6: sem PEP585/604


def env(key, default=""):
    v = os.environ.get(key)
    return v if v not in (None, "") else default


def load_dotenv():
    """Carrega database/.env sem sobrescrever o que já veio do shell/CLI."""
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[7:]
            if "=" not in line:
                continue
            k, val = line.split("=", 1)
            k = k.strip()
            if k and not os.environ.get(k):
                os.environ[k] = val.strip().strip('"').strip("'")


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "bndes_operacoes_pb.json"
SEED_FILE = SEED_DIR / "indicador-bndes-operacoes.mongodb.js"

# BNDES Dados Abertos — conjunto "Operações de Financiamento", recurso "Operações não automáticas".
RESOURCE_ID = "6f56b78c-510f-44b6-8274-78a5b7e931f4"
CSV_URL = ("https://dadosabertos.bndes.gov.br/dataset/10e21ad1-568e-45e5-a8af-43f2c05ef1a2/"
           "resource/{}/download/operacoes-financiamento-operacoes-nao-automaticas.csv".format(RESOURCE_ID))
CSV_ENCODING = "windows-1252"
CSV_DELIM = ";"

INDICATOR_ID = "bndes-operacoes"
AGENDA = "credito"
ORDER = 1                       # após credito-financiamento (order 0) na agenda "credito"
LABEL = "Crédito contratado no BNDES"
DESCRIPTION = (
    "Valor total (R$) das operações de crédito NÃO AUTOMÁTICAS do BNDES contratadas por tomadores "
    "no município — soma acumulada dos contratos na janela (default 2002 até o último ano), em "
    "valores NOMINAIS (não deflacionados). 'Não automáticas' = apoio DIRETO (contratado direto com "
    "o BNDES) + apoio INDIRETO analisado individualmente (via agente financeiro credenciado); "
    "exclui as indiretas automáticas (BNDES Automático/Finame/Cartão) e pessoas físicas. Cada "
    "contrato pode ter vários subcréditos — o valor é a soma dos subcréditos. Fonte: BNDES, Portal "
    "de Dados Abertos ('Operações de Financiamento → Operações não automáticas'). É um FLUXO de "
    "contratação (não saldo). Cobertura = censo nacional de contratos; município sem contrato "
    "aparece com R$ 0 (zero real, não lacuna). Parte das operações fica 'sem município' (atribuída "
    "só à UF) e não entra no total municipal."
)
SOURCE = (
    "BNDES — Portal de Dados Abertos, conjunto 'Operações de Financiamento', recurso 'Operações "
    "não automáticas' (apoio direto + indireto não automático). Valor contratado acumulado, nominal"
)
SOURCE_DATASET = "bndes_operacoes_nao_automaticas"

UF_PB = "PB"

# forma_de_apoio (neste arquivo só há DIRETA / INDIRETA; a INDIRETA já é a não automática).
FORMA_LABELS = {
    "direta": "Apoio direto",
    "indireta": "Apoio indireto (não automático)",
}


# ============================================================================
# utilidades
# ============================================================================

def parse_valor(v):
    """float a partir de número OU string BR ('1.234.567,89'). Vazio/None → 0.0."""
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if not s:
        return 0.0
    neg = s.startswith("-") or (s.startswith("(") and s.endswith(")"))
    s = s.lstrip("-").strip("()").strip()
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        f = float(s)
    except ValueError:
        return 0.0
    return -f if neg else f


def parse_ano(v):
    """Ano (int) de 'AAAA-MM-DD' ou similar; None se não der."""
    if not v:
        return None
    m = re.match(r"\s*(\d{4})", str(v))
    return int(m.group(1)) if m else None


def norm_forma(v):
    """DIRETA/INDIRETA (com acento/caixa variável) → 'direta'|'indireta'|'outra'."""
    s = (v or "").strip().upper()
    if s.startswith("DIRET"):
        return "direta"
    if s.startswith("INDIRET"):
        return "indireta"
    return "outra"


def norm_porte(v):
    s = (v or "").strip()
    return s if s else "NÃO INFORMADO"


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def _resolve_code(raw, code7_set, code6_map):
    """municipio_codigo do BNDES → IBGE 7-díg dos 223. Aceita 7-díg direto ou 6-díg (sem DV)."""
    if raw is None:
        return None
    s = re.sub(r"\D", "", str(raw))
    if not s or s == "0":
        return None
    if len(s) == 7 and s in code7_set:
        return s
    if len(s) == 6:
        return code6_map.get(s)
    if len(s) == 7:
        return code6_map.get(s[:6])
    return None


def download_csv(dest):
    """Baixa o CSV do BNDES p/ `dest` (só stdlib). Retorna o Path."""
    import urllib.request
    print("[bndes] baixando {} …".format(CSV_URL), file=sys.stderr)
    try:
        with urllib.request.urlopen(CSV_URL, timeout=120) as resp, open(dest, "wb") as out:
            out.write(resp.read())
    except Exception as e:  # noqa: BLE001 — mensagem acionável p/ o operador
        sys.exit("[bndes] falha ao baixar o CSV ({}). Baixe manualmente de\n  {}\n"
                 "e rode com --csv <arquivo>.".format(e, CSV_URL))
    print("[bndes] salvo em {} ({:.1f} Mb).".format(dest, dest.stat().st_size / 1e6), file=sys.stderr)
    return dest


def open_rows(csv_path):
    """Iterador de dicts do CSV (Windows-1252, delimitador ';')."""
    fh = io.open(str(csv_path), encoding=CSV_ENCODING, newline="")
    return csv.DictReader(fh, delimiter=CSV_DELIM), fh


# ============================================================================
# harvest: soma valor contratado por município (tomadores da PB)
# ============================================================================

def _blank_agg():
    return {"valorContratado": 0.0, "valorDesembolsado": 0.0, "nOperacoes": 0,
            "contratos": set(), "anoPrimeiro": None, "anoUltimo": None,
            "porForma": {}, "porPorte": {}}


def _acc(a, row, ano):
    vc = parse_valor(row.get("valor_contratado_reais"))
    vd = parse_valor(row.get("valor_desembolsado_reais"))
    a["valorContratado"] += vc
    a["valorDesembolsado"] += vd
    a["nOperacoes"] += 1
    contr = (row.get("numero_do_contrato") or "").strip()
    if contr:
        a["contratos"].add(contr)
    if ano is not None:
        a["anoPrimeiro"] = ano if a["anoPrimeiro"] is None else min(a["anoPrimeiro"], ano)
        a["anoUltimo"] = ano if a["anoUltimo"] is None else max(a["anoUltimo"], ano)
    fk = norm_forma(row.get("forma_de_apoio"))
    a["porForma"][fk] = round(a["porForma"].get(fk, 0.0) + vc, 2)
    pk = norm_porte(row.get("porte_do_cliente"))
    a["porPorte"][pk] = round(a["porPorte"].get(pk, 0.0) + vc, 2)


def _finalize(a):
    return {"valorContratado": round(a["valorContratado"], 2),
            "valorDesembolsado": round(a["valorDesembolsado"], 2),
            "nOperacoes": a["nOperacoes"], "nContratos": len(a["contratos"]),
            "anoPrimeiro": a["anoPrimeiro"], "anoUltimo": a["anoUltimo"],
            "porForma": a["porForma"], "porPorte": a["porPorte"]}


def harvest(csv_path, code7_set, code6_map, desde, ate):
    """Varre o CSV, filtra UF=PB e a janela [desde, ate]; agrega por município + bucket 'sem
    município'. Retorna (municipios{code->agg}, sem_municipio_agg, meta)."""
    rows, fh = open_rows(csv_path)
    cols = rows.fieldnames or []
    for req in ("uf", "municipio_codigo", "valor_contratado_reais", "data_da_contratacao",
                "forma_de_apoio"):
        if req not in cols:
            sys.exit("Coluna obrigatória {!r} ausente no CSV. Colunas: {}".format(req, cols))
    muni = {}                       # code7 -> agg
    sem_mun = _blank_agg()          # PB sem município
    n_total = n_pb = 0
    anos_pb = set()
    fora = set()
    for row in rows:
        n_total += 1
        if (row.get("uf") or "").strip().upper() != UF_PB:
            continue
        ano = parse_ano(row.get("data_da_contratacao"))
        if desde is not None and (ano is None or ano < desde):
            continue
        if ate is not None and (ano is None or ano > ate):
            continue
        n_pb += 1
        if ano is not None:
            anos_pb.add(ano)
        code = _resolve_code(row.get("municipio_codigo"), code7_set, code6_map)
        if code:
            _acc(muni.setdefault(code, _blank_agg()), row, ano)
        else:
            raw = (row.get("municipio_codigo") or "").strip()
            if raw and raw != "0":
                fora.add(raw)
            _acc(sem_mun, row, ano)
    fh.close()

    if fora:
        print("[bndes] aviso: {} municipio_codigo não casaram com os 223 da PB (amostra: {}).".format(
            len(fora), ", ".join(sorted(fora)[:10])), file=sys.stderr)
    meta = {"desde": (min(anos_pb) if anos_pb else desde),
            "ate": (max(anos_pb) if anos_pb else ate),
            "totalLinhas": n_total, "linhasPB": n_pb}
    print("[bndes] {} linhas no CSV; PB: {} operações na janela, {} municípios com contrato, "
          "{} operações 'sem município'.".format(n_total, n_pb, len(muni), sem_mun["nOperacoes"]),
          file=sys.stderr)
    out = {c: _finalize(a) for c, a in muni.items()}
    return out, _finalize(sem_mun), meta


# ============================================================================
# build_values + emit + write-mongo
# ============================================================================

def fmt_reais(v):
    if v >= 1e9:
        return ("R$ {:.2f} bi".format(v / 1e9)).replace(".", ",")
    if v >= 1e6:
        return ("R$ {:.2f} mi".format(v / 1e6)).replace(".", ",")
    if v >= 1e3:
        return "R$ {:.0f} mil".format(v / 1e3)
    return "R$ {:.0f}".format(v)


def _forma_breakdown(por_forma):
    return {k: {"valor": round(float(v), 2), "label": FORMA_LABELS.get(k, k)}
            for k, v in (por_forma or {}).items()}


def build_values(snapshot):
    janela = snapshot["janela"]
    ref = str(snapshot["refYear"])
    codes = municipios_canonicos()
    muni = snapshot["municipios"]
    valores = []
    pb = {"valorContratado": 0.0, "valorDesembolsado": 0.0, "nOperacoes": 0,
          "nContratos": 0, "comOperacao": 0, "porForma": {}}
    for code in codes:
        a = muni.get(code)
        common_bd = {
            "janela": janela, "fonte": "bndes-dados-abertos",
            "escopo": "valor contratado acumulado, operações não automáticas (direto + indireto)",
        }
        if not a:                        # município sem contrato BNDES não automático → zero real
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "R$ 0", "numericValue": 0.0, "referenceYear": ref,
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(common_bd, valorContratado=0.0, valorDesembolsado=0.0,
                                  nOperacoes=0, nContratos=0, componentes={}, semOperacao=True),
            })
            continue
        vc = float(a["valorContratado"])
        pb["valorContratado"] += vc
        pb["valorDesembolsado"] += float(a["valorDesembolsado"])
        pb["nOperacoes"] += int(a["nOperacoes"])
        pb["nContratos"] += int(a["nContratos"])
        if vc > 0:
            pb["comOperacao"] += 1
        for k, v in (a.get("porForma") or {}).items():
            pb["porForma"][k] = round(pb["porForma"].get(k, 0.0) + float(v), 2)
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": fmt_reais(vc), "numericValue": round(vc, 2), "referenceYear": ref,
            "source": SOURCE, "isFictional": False,
            "breakdown": dict(common_bd,
                              valorContratado=round(vc, 2),
                              valorDesembolsado=round(float(a["valorDesembolsado"]), 2),
                              nOperacoes=int(a["nOperacoes"]), nContratos=int(a["nContratos"]),
                              anoPrimeiro=a.get("anoPrimeiro"), anoUltimo=a.get("anoUltimo"),
                              componentes=_forma_breakdown(a.get("porForma")),
                              porPorte=a.get("porPorte") or {}),
        })
    return valores, {"refYear": ref, "janela": janela, "pb": pb,
                     "semMunicipioPB": snapshot.get("semMunicipioPB")}


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_bndes_operacoes.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(ref):
    return {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: valor absoluto (R$), sem faixa oficial do BNDES.
        "referenceYear": str(ref),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "R$",
        "placements": [{"section": "agenda", "agendaId": AGENDA, "order": ORDER}],
    }


def emit(values, ref, janela):
    indicator = build_indicator(ref)
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: {} (agenda {}) ---".format(INDICATOR_ID, AGENDA))
    lines.append("// Valor (R$) contratado em operações não automáticas do BNDES por município.")
    lines.append("// Acumulado {}–{}, nominal. BNDES Dados Abertos. SEM threshold.".format(
        janela.get("desde"), janela.get("ate")))
    lines.append("const indicators = [\n  {},\n]".format(js(indicator)))
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators({}) -> ok`)".format(INDICATOR_ID))
    lines.append("")
    lines.append("// --- 2) Valores por município ({} docs), refYear {} ---".format(len(values), ref))
    lines.append("const values = [")
    for v in values:
        lines.append("  {},".format(js(v)))
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`indicatorValues({}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}}`)".format(INDICATOR_ID))
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def write_mongo(args, indicator, values):
    from datetime import timezone
    from pymongo import MongoClient, UpdateOne
    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db, serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    db.indicators.bulk_write([UpdateOne({"_id": indicator["_id"]}, {"$set": indicator}, upsert=True)],
                             ordered=False)
    now = datetime.now(timezone.utc)
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": dict(v, updatedAt=now)}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP {} -> indicatorValues upserted={} modified={}".format(
        args.opp_db, res.upserted_count, res.modified_count))


# ============================================================================
# inspect
# ============================================================================

def _inspect(csv_path):
    import collections
    rows, fh = open_rows(csv_path)
    print("\n=== colunas ({}) ===".format(len(rows.fieldnames or [])))
    print("  " + ", ".join(rows.fieldnames or []))
    formas = collections.Counter()
    portes_pb = collections.Counter()
    anos_pb = collections.Counter()
    n = n_pb = pb_sem_mun = 0
    exemplo = None
    for row in rows:
        n += 1
        formas[norm_forma(row.get("forma_de_apoio"))] += 1
        if (row.get("uf") or "").strip().upper() == UF_PB:
            n_pb += 1
            portes_pb[norm_porte(row.get("porte_do_cliente"))] += 1
            a = parse_ano(row.get("data_da_contratacao"))
            if a:
                anos_pb[a] += 1
            if not _resolve_code(row.get("municipio_codigo"), set(), {}) and \
                    (row.get("municipio_codigo") or "").strip() in ("", "0"):
                pb_sem_mun += 1
            if exemplo is None:
                exemplo = row
    fh.close()
    print("\n=== forma_de_apoio (Brasil, {} linhas) ===".format(n))
    for k, v in formas.most_common():
        print("  {:8d}  {}".format(v, k))
    print("\n=== PB: {} operações ({} 'sem município') ===".format(n_pb, pb_sem_mun))
    print("  anos: {}".format(dict(sorted(anos_pb.items()))))
    print("  portes: {}".format(dict(portes_pb.most_common())))
    if exemplo:
        keys = ["cliente", "uf", "municipio", "municipio_codigo", "data_da_contratacao",
                "valor_contratado_reais", "forma_de_apoio", "modalidade_de_apoio",
                "porte_do_cliente", "situacao_do_contrato"]
        print("\n=== 1 linha PB (campos-chave) ===")
        for k in keys:
            print("  {:24s} = {!r}".format(k, exemplo.get(k)))


# ============================================================================
# main
# ============================================================================

def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Seed de {} (BNDES operações não automáticas).".format(INDICATOR_ID))
    ap.add_argument("--inspect", action="store_true", help="colunas + forma_de_apoio + PB/anos/portes")
    ap.add_argument("--offline", action="store_true", help="regenera o seed do snapshot (não baixa nada)")
    ap.add_argument("--csv", default="", help="usa um CSV já baixado em vez de baixar do BNDES")
    ap.add_argument("--desde", type=int, default=int(env("BNDES_DESDE", "0")) or None,
                    help="ano inicial da janela (>= AAAA). Default: todos.")
    ap.add_argument("--ate", type=int, default=int(env("BNDES_ATE", "0")) or None,
                    help="ano final da janela (<= AAAA). Default: todos.")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    ap.add_argument("--write-mongo", action="store_true")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)

    if args.inspect:
        csv_path = Path(args.csv) if args.csv else download_csv(DATA_DIR / "_bndes_nao_automaticas.csv")
        return _inspect(csv_path)

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — janela {}, {} municípios.".format(
            snapshot.get("fetchedAt"), snapshot.get("janela"),
            len(snapshot.get("municipios") or {})), file=sys.stderr)
    else:
        codes = municipios_canonicos()
        code7_set = set(codes)
        code6_map = {c[:6]: c for c in codes}
        csv_path = Path(args.csv) if args.csv else download_csv(DATA_DIR / "_bndes_nao_automaticas.csv")
        municipios, sem_mun, meta = harvest(csv_path, code7_set, code6_map, args.desde, args.ate)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "fonte": "bndes-dados-abertos", "resourceId": RESOURCE_ID,
            "dataset": "operacoes-financiamento / operacoes-nao-automaticas",
            "janela": {"desde": meta["desde"], "ate": meta["ate"]},
            "refYear": meta["ate"],
            "totalLinhas": meta["totalLinhas"], "linhasPB": meta["linhasPB"],
            "municipios": municipios, "semMunicipioPB": sem_mun,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[bndes] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    values, m = build_values(snapshot)
    out = emit(values, m["refYear"], m["janela"])
    pb = m["pb"]
    com = [v for v in values if (v["numericValue"] or 0) > 0]
    print("{} (R$ contratado, janela {}–{}): {}/223 municípios com operação; {} operações, "
          "{} contratos.".format(INDICATOR_ID, m["janela"].get("desde"), m["janela"].get("ate"),
                                  len(com), pb["nOperacoes"], pb["nContratos"]))
    print("Total PB (municipalizado): R$ {:,.2f} contratado.".format(pb["valorContratado"]))
    if pb["porForma"]:
        print("Por forma de apoio (PB): " + " · ".join(
            "{} R$ {:,.0f}".format(FORMA_LABELS.get(k, k), pb["porForma"][k])
            for k in sorted(pb["porForma"], key=lambda x: pb["porForma"][x], reverse=True)))
    sm = m.get("semMunicipioPB") or {}
    if sm.get("nOperacoes"):
        print("Fora do total municipal (PB 'sem município'): R$ {:,.2f} em {} operações.".format(
            sm.get("valorContratado", 0.0), sm.get("nOperacoes", 0)))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, build_indicator(m["refYear"]), values)


if __name__ == "__main__":
    main()
