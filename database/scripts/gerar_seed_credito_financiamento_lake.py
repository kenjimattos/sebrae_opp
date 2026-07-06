#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) do indicador **Crédito concedido no município** (`credito-financiamento`,
agenda "Acesso a crédito e viabilização financeira") — VIA ETL do data lake do Sebrae
(base **ESTBAN**, Estatística Bancária Mensal e por Município do Banco Central), NÃO de API.

== Métrica: NÍVEL (R$ de SALDO), não fluxo ==
O ESTBAN reporta o **saldo de fim de mês** das contas do balancete das instituições por
município — não há "concessão" (fluxo). A métrica é o **saldo das Operações de Crédito** no
município, que o próprio ESTBAN consolida no verbete **160** ("Operações de crédito"):

  numericValue = Σ_instituições  VERBETE_160_OPERACOES_DE_CREDITO   (no município, no mês-base)

  O verbete 160 já é o ROLLUP oficial dos componentes de crédito (161 empréstimos e títulos
  descontados, 162 financiamentos, 163–166 financiamentos rurais, 167 agroindustriais, 169
  imobiliários, 171/172 outras operações/outros créditos) — confirmado no dump: em um doc real
  161 (2.880.161) + 172 (327.984) = 160 (3.208.145). Usar o 160 evita dupla contagem e dispensa
  escolher a cesta. O 160 é LÍQUIDO de provisão (= Σ(161..172) + 173 créditos em liquidação +
  174 provisão, negativa) — confirmado na PB dez/2019. Se um mês não tiver o 160, cai para a
  soma dos componentes (CREDITO_CODES, que já inclui 173/174 p/ casar o valor líquido).

  - mês-base = ÚLTIMO mês disponível no lake (foto mais recente do saldo). Como o ESTBAN é um
                ESTOQUE, NÃO se soma meses (contaria o mesmo saldo N vezes). Use --dezembro p/
                o último fim de ano (comparação a.a.) ou --mes AAAAMM p/ fixar. referenceYear =
                ano do mês-base; o mês exato fica em breakdown.mesBase.
  - Município SEM instituição com agência (não está no ESTBAN) → numericValue = null (lacuna
                de cobertura bancária, não "R$ 0 de crédito"). Na PB só ~47/223 têm agência.
  - SEM threshold: saldo absoluto (R$), sem faixa oficial — o BCB não classifica.

== Schema do dump ESTBAN (confirmado jun/2026 via doc real 202011) ==
Base **ESTBAN** (Mongo 10.19.4.174:27018, authSource admin, usr_ESTBAN). 1 coleção por mês
"AAAAMM". Cada doc é uma linha (instituição × município):
  DATA_BASE(int AAAAMM) · UF(str "PB") · CODMUN(int, cód. BACEN) · CODMUN_IBGE(int, IBGE 7-díg)
  · MUNICIPIO(str) · CNPJ(int) · NOME_INSTITUICAO · AGENCIA · VERBETE_<código>_<descrição>(int R$)
Recorte PB por UF == "PB"; município = CODMUN_IBGE (já é o IBGE 7-díg — não o CODMUN do BACEN).
Valores em REAIS (inteiros). Reconfirme com --inspect se schemas de meses antigos divergirem.

== USO ==
    python3 ..._credito_financiamento_lake.py --inspect            # 1 doc + coleções + campos
    python3 ..._credito_financiamento_lake.py --inspect-verbetes   # soma PB por verbete
    python3 ..._credito_financiamento_lake.py                      # auto: último dez/AAAA
    python3 ..._credito_financiamento_lake.py --mes 202012
    python3 ..._credito_financiamento_lake.py --write-mongo        # + OPP_MONGO_USER/PASS no .env
    python3 ..._credito_financiamento_lake.py --offline            # regenera o seed do snapshot

Requer: pip install 'pymongo<4'. Host do ETL é Python 3.6 — sem list[...] / X | None.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple  # 3.6: sem PEP585/604


def env(key, default=""):
    """os.environ.get que trata presente-porém-VAZIO ('') como ausente — o .env modelo deixa
    chaves em branco e '' não deve sobrescrever default (int('') quebra)."""
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
SNAPSHOT = DATA_DIR / "credito_financiamento_pb.json"
SEED_FILE = SEED_DIR / "indicador-credito-financiamento.mongodb.js"
LAKE_HOST = "10.19.4.174"

INDICATOR_ID = "credito-financiamento"
AGENDA = "credito"
ORDER = 0                       # 1ª posição na agenda "credito" (ver catalog.ts)
LABEL = "Crédito concedido no município"
DESCRIPTION = (
    "Saldo das operações de crédito no município (R$), no mês mais recente disponível, somando "
    "todas as instituições financeiras com agência no município. Operações de crédito = "
    "empréstimos e títulos descontados + financiamentos + financiamentos rurais e "
    "agroindustriais + outras operações de crédito (verbete 160 do ESTBAN, líquido de provisão). "
    "Fonte: ESTBAN (Estatística Bancária Mensal e por Município) do Banco Central, via data lake "
    "do Sebrae. É um SALDO de fim de mês (estoque), não a concessão do período — o ESTBAN não "
    "publica fluxo de concessão por município. O ESTBAN só cobre municípios com agência bancária "
    "(na Paraíba, ~47 dos 223); os demais ficam sem valor (lacuna de cobertura, não ausência de "
    "crédito — os residentes podem tomar crédito em agências de outros municípios)."
)
SOURCE = (
    "ESTBAN — Estatística Bancária Mensal e por Município (Banco Central do Brasil), via data "
    "lake do Sebrae. Saldo de fim de mês das Operações de Crédito (verbete 160), soma das "
    "instituições do município. Mês-base: último mês disponível"
)
SOURCE_DATASET = "bcb_estban_municipio"

UF_PB = "PB"

# --- campos da coleção ESTBAN (confirmados; override por env só se um mês divergir) --------
CAMPO_UF = env("ESTBAN_CAMPO_UF", "UF")
CAMPO_CODMUN = env("ESTBAN_CAMPO_CODMUN", "CODMUN_IBGE")      # IBGE 7-díg (NÃO o CODMUN do BACEN)
CAMPO_MUNICIPIO = env("ESTBAN_CAMPO_MUNICIPIO", "MUNICIPIO")  # nome (só p/ inspeção)
CAMPO_CNPJ = env("ESTBAN_CAMPO_CNPJ", "CNPJ")                # instituição (distinct → nInst)

# Verbetes têm nome "VERBETE_<código>_<descrição>" → resolvemos o campo pelo código LÍDER.
VERBETE_PREFIX = env("ESTBAN_VERBETE_PREFIX", "VERBETE_")
HEADLINE_CODE = env("ESTBAN_HEADLINE_CODE", "160")           # rollup "Operações de crédito"
# Componentes de crédito (fallback se faltar o 160 no mês). Inclui 173 (créditos em
# liquidação) e 174 (provisão, negativa) porque o 160 é LÍQUIDO de provisão — confirmado na
# PB dez/2019: Σ(161..172) + 173 + 174 = 160 (a soma sem 173/174 superestima ~R$0,5bi).
CREDITO_CODES = [c.strip() for c in env(
    "ESTBAN_CREDITO_CODES", "161,162,163,164,165,166,167,169,171,172,173,174").split(",") if c.strip()]
# Grupos do breakdown (rótulo legível -> códigos a somar; pulam se ausentes no mês).
BREAKDOWN_GROUPS = [
    ("emprestimos", "Empréstimos e títulos descontados", ["161"]),
    ("financiamentos", "Financiamentos", ["162"]),
    ("rurais", "Financiamentos rurais", ["163", "164", "165", "166"]),
    ("agroindustriais", "Financiamentos agroindustriais", ["167"]),
    ("imobiliarios", "Financiamentos imobiliários", ["169"]),
    ("outros", "Outras operações / outros créditos", ["171", "172"]),
]


# ============================================================================
# Conexão + utilidades
# ============================================================================

def _client(args):
    from pymongo import MongoClient
    return MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db or args.mongo_db, serverSelectionTimeoutMS=15000,
    )


def _coll(args, coll_name):
    return _client(args)[args.mongo_db][coll_name]


def _list_meses(args):
    """Coleções "AAAAMM" da base ESTBAN, ordenadas."""
    nomes = _client(args)[args.mongo_db].list_collection_names()
    return sorted(n for n in nomes if re.match(r"^\d{6}$", n))


def _latest_december(meses):
    dez = [m for m in meses if m.endswith("12")]
    if dez:
        return dez[-1]
    return meses[-1] if meses else None


def parse_valor(v):
    """float a partir de número OU string BR ('1.234.567,89') / US. Vazio/None → 0.0."""
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


def resolve_verbete_fields(sample):
    """{código-líder -> nome real do campo} a partir das chaves de um doc. O nome é
    'VERBETE_<código>_<descrição>' (ou campos combinados 'VERBETE_167_...+VERBETE_168_...');
    casamos pelo código que ABRE o nome."""
    out = {}
    for k in sample:
        m = re.match(r"^" + re.escape(VERBETE_PREFIX) + r"0*(\d+)", str(k))
        if m:
            out.setdefault(m.group(1), k)   # 1ª ocorrência do código-líder vence
    return out


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def _resolve_code(raw, code7_set, code6_map):
    """CODMUN_IBGE do ESTBAN → IBGE 7-díg dos 223. Aceita 7-díg direto ou 6-díg (sem DV)."""
    if raw is None:
        return None
    s = re.sub(r"\D", "", str(raw))
    if len(s) == 7 and s in code7_set:
        return s
    if len(s) == 6:
        return code6_map.get(s)
    if len(s) == 7:
        return code6_map.get(s[:6])
    return None


# ============================================================================
# Harvest: soma o verbete 160 (e o breakdown) por município (cliente, PB pequeno)
# ============================================================================

def harvest(args, mes, code7_set, code6_map):
    """{code7 -> {saldo, breakdown{grupo->R$}, nInst, nLinhas}} para a PB no mês `mes`."""
    coll = _coll(args, mes)
    sample = coll.find_one({CAMPO_UF: UF_PB}) or coll.find_one()
    if not sample:
        sys.exit("Coleção vazia: {}".format(mes))
    if CAMPO_CODMUN not in sample:
        sys.exit("Campo de município {!r} ausente em {}. Rode --inspect e ajuste "
                 "ESTBAN_CAMPO_CODMUN.".format(CAMPO_CODMUN, mes))
    cod2field = resolve_verbete_fields(sample)

    headline_field = cod2field.get(HEADLINE_CODE)
    component_fields = [(c, cod2field[c]) for c in CREDITO_CODES if c in cod2field]
    if headline_field:
        print("[lake/ESTBAN] {}: saldo = {!r} (rollup 160).".format(mes, headline_field),
              file=sys.stderr)
    else:
        print("[lake/ESTBAN] {}: sem verbete 160 → soma dos componentes {}.".format(
            mes, [f for _, f in component_fields]), file=sys.stderr)
    # campos de breakdown (grupo -> [field]); dedup, ignora grupos sem nenhum campo no mês
    grupos = []
    for key, label, codes in BREAKDOWN_GROUPS:
        flds = []
        for c in codes:
            f = cod2field.get(c)
            if f and f not in flds:
                flds.append(f)
        if flds:
            grupos.append((key, label, flds))

    proj = {CAMPO_CODMUN: 1, CAMPO_CNPJ: 1, "_id": 0}
    if headline_field:
        proj[headline_field] = 1
    for _, f in component_fields:
        proj[f] = 1
    for _, _, flds in grupos:
        for f in flds:
            proj[f] = 1

    def run(query, via):
        cur = coll.find(query, proj)
        n = 0
        agg = {}
        fora = set()
        for d in cur:
            n += 1
            code = _resolve_code(d.get(CAMPO_CODMUN), code7_set, code6_map)
            if not code:
                raw = d.get(CAMPO_CODMUN)
                if raw not in (None, ""):
                    fora.add(str(raw))
                continue
            a = agg.setdefault(code, {"saldo": 0.0, "breakdown": {}, "cnpjs": set(), "nLinhas": 0})
            a["nLinhas"] += 1
            c = d.get(CAMPO_CNPJ)
            if c not in (None, ""):
                a["cnpjs"].add(str(c))
            if headline_field:
                a["saldo"] += parse_valor(d.get(headline_field))
            else:
                for _, f in component_fields:
                    a["saldo"] += parse_valor(d.get(f))
            for gkey, _, flds in grupos:
                gv = sum(parse_valor(d.get(f)) for f in flds)
                if gv:
                    a["breakdown"][gkey] = round(a["breakdown"].get(gkey, 0.0) + gv, 2)
        return n, agg, fora, via

    n_docs, agg, fora, via = run({CAMPO_UF: UF_PB}, "UF=PB")
    if n_docs == 0:
        print("[lake/ESTBAN] 0 docs por {}={!r}; tentando CODMUN ^25…".format(CAMPO_UF, UF_PB),
              file=sys.stderr)
        n_docs, agg, fora, via = run({CAMPO_CODMUN: {"$regex": "^25"}}, "CODMUN ^25")

    if fora:
        print("[lake/ESTBAN] aviso: {} CODMUN não casaram com os 223 da PB (amostra: {}).".format(
            len(fora), ", ".join(sorted(fora)[:10])), file=sys.stderr)
    out = {}
    for code, a in agg.items():
        out[code] = {"saldo": round(a["saldo"], 2), "breakdown": a["breakdown"],
                     "nInst": len(a["cnpjs"]), "nLinhas": a["nLinhas"]}
    print("[lake/ESTBAN] {}: {} linhas ({}), {} municípios da PB com saldo de crédito.".format(
        mes, n_docs, via, len(out)), file=sys.stderr)
    if len(out) < 20:
        print("[lake/ESTBAN] ⚠️ MUITO poucos municípios — confira CAMPO_UF/CAMPO_CODMUN com --inspect.",
              file=sys.stderr)
    else:
        print("[lake/ESTBAN] cobertura: {} municípios da PB têm agência no ESTBAN (os demais → "
              "null, sem agência).".format(len(out)), file=sys.stderr)
    return out


# ============================================================================
# build_values + emit + write-mongo
# ============================================================================

GROUP_LABELS = {k: lbl for k, lbl, _ in BREAKDOWN_GROUPS}


def fmt_reais(v):
    if v >= 1e9:
        return ("R$ {:.2f} bi".format(v / 1e9)).replace(".", ",")
    if v >= 1e6:
        return ("R$ {:.2f} mi".format(v / 1e6)).replace(".", ",")
    if v >= 1e3:
        return "R$ {:.0f} mil".format(v / 1e3)
    return "R$ {:.0f}".format(v)


def build_values(snapshot):
    ref = snapshot["refYear"]
    mes = snapshot["mesBase"]
    codes = municipios_canonicos()
    muni = snapshot["municipios"]
    valores = []
    pb = {"saldo": 0.0, "comCredito": 0, "breakdown": {}}
    for code in codes:
        a = muni.get(code)
        bd_componentes = {}
        if a:
            for gkey, val in (a.get("breakdown") or {}).items():
                bd_componentes[gkey] = {"valor": round(float(val), 2),
                                        "label": GROUP_LABELS.get(gkey, gkey)}
                pb["breakdown"][gkey] = round(pb["breakdown"].get(gkey, 0.0) + float(val), 2)
        common_bd = {
            "refYear": ref, "mesBase": mes, "verbete": HEADLINE_CODE,
            "componentes": bd_componentes,
            "nInstituicoes": int(a.get("nInst")) if a else 0,
            "escopo": "saldo de fim de mês das operações de crédito (verbete 160), todas as instituições",
            "fonte": "lake",
        }
        if not a:                        # município sem instituição no ESTBAN → cobertura
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ref),
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(common_bd, semInstituicao=True),
            })
            continue
        saldo = float(a["saldo"])
        pb["saldo"] += saldo
        if saldo > 0:
            pb["comCredito"] += 1
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": fmt_reais(saldo), "numericValue": round(saldo, 2),
            "referenceYear": str(ref), "source": SOURCE, "isFictional": False,
            "breakdown": common_bd,
        })
    return valores, {"refYear": ref, "mesBase": mes, "pb": pb}


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_credito_financiamento_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(ref):
    return {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: saldo absoluto (R$), sem faixa oficial do BCB.
        "referenceYear": str(ref),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "R$",
        "placements": [{"section": "agenda", "agendaId": AGENDA, "order": ORDER}],
    }


def emit(values, ref):
    indicator = build_indicator(ref)
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: {} (agenda {}) ---".format(INDICATOR_ID, AGENDA))
    lines.append("// Saldo (R$) das operações de crédito por município — NÍVEL, dez/{}.".format(ref))
    lines.append("// ESTBAN (Estatística Bancária Mensal, BCB) — data lake do Sebrae. SEM threshold.")
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

def _inspect(args):
    meses = _list_meses(args)
    print("\n=== coleções 'AAAAMM' na base {} ({} meses) ===".format(args.mongo_db, len(meses)))
    print("  primeiras: {}".format(meses[:6]))
    print("  últimas:   {}".format(meses[-6:]))
    print("  dezembros: {}".format([m for m in meses if m.endswith('12')]))
    alvo = args.mes or _latest_december(meses)
    if not alvo:
        return print("Nenhuma coleção mensal encontrada.")
    coll = _coll(args, alvo)
    s = coll.find_one({CAMPO_UF: UF_PB}) or coll.find_one()
    print("\n=== 1 doc de {} (chaves não-verbete) ===".format(alvo))
    for k, v in (s or {}).items():
        if str(k).upper().startswith(VERBETE_PREFIX.upper()):
            continue
        print("  {:18s} {:8s} = {!r}".format(str(k)[:18], type(v).__name__, v))
    print("\n=== campos configurados (ajuste ESTBAN_CAMPO_* se não casar) ===")
    for nome, campo in [("uf", CAMPO_UF), ("codmun(IBGE)", CAMPO_CODMUN),
                        ("municipio", CAMPO_MUNICIPIO), ("cnpj", CAMPO_CNPJ)]:
        present = bool(s) and campo in s
        print("  {:14s} -> {!r:16s} {}".format(nome, campo,
              "OK = {!r}".format(s.get(campo)) if present else "NÃO ENCONTRADO"))
    cod2field = resolve_verbete_fields(s or {})
    print("\n=== verbete da métrica (headline {}) ===".format(HEADLINE_CODE))
    hf = cod2field.get(HEADLINE_CODE)
    print("  {}".format("{} = {!r}".format(hf, s.get(hf)) if hf else
          "AUSENTE ← cairá na soma dos componentes {}".format(CREDITO_CODES)))
    print("\n=== componentes/breakdown resolvidos ===")
    for gkey, label, codes in BREAKDOWN_GROUPS:
        flds = [cod2field[c] for c in codes if c in cod2field]
        print("  {:16s} {:42s} {}".format(gkey, label, flds or "—"))


def _inspect_verbetes(args):
    """Soma cada verbete sobre a PB no mês alvo — confere o 160 e a cesta de crédito."""
    meses = _list_meses(args)
    alvo = args.mes or _latest_december(meses)
    coll = _coll(args, alvo)
    s = coll.find_one({CAMPO_UF: UF_PB}) or coll.find_one()
    if not s:
        return print("Coleção vazia: {}".format(alvo))
    verbete_keys = sorted(k for k in s if str(k).upper().startswith(VERBETE_PREFIX.upper()))
    if not verbete_keys:
        return print("Nenhum campo {!r}. Rode --inspect e ajuste VERBETE_PREFIX.".format(VERBETE_PREFIX))
    print("[verbetes] somando {} verbetes sobre a PB em {}…".format(len(verbete_keys), alvo),
          file=sys.stderr)
    proj = {k: 1 for k in verbete_keys}
    proj["_id"] = 0
    totals = {k: 0.0 for k in verbete_keys}
    n = 0
    for d in coll.find({CAMPO_UF: UF_PB}, proj):
        n += 1
        for k in verbete_keys:
            totals[k] += parse_valor(d.get(k))
    cod2field = resolve_verbete_fields(s)
    credito_set = set([cod2field.get(HEADLINE_CODE)] + [cod2field.get(c) for c in CREDITO_CODES])
    print("\n=== soma PB por verbete em {} ({} linhas) ===".format(alvo, n))
    for k in sorted(totals, key=lambda x: totals[x], reverse=True):
        flag = " ◀ crédito" if k in credito_set else ""
        print("  {:52s} {:>20}{}".format(str(k)[:52], "R$ {:,.2f}".format(totals[k]), flag))
    hf = cod2field.get(HEADLINE_CODE)
    if hf:
        comp = sum(totals.get(cod2field.get(c), 0.0) for c in CREDITO_CODES if cod2field.get(c))
        print("\n  headline 160 = R$ {:,.2f}".format(totals.get(hf, 0.0)))
        print("  Σ componentes {} = R$ {:,.2f}  (deve ~bater com o 160)".format(CREDITO_CODES, comp))


# ============================================================================
# main
# ============================================================================

def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Seed de {} via lake ESTBAN (saldo de crédito R$).".format(INDICATOR_ID))
    ap.add_argument("--inspect", action="store_true", help="1 doc + coleções + campos configurados")
    ap.add_argument("--inspect-verbetes", action="store_true", help="soma PB por verbete (confere o 160)")
    ap.add_argument("--offline", action="store_true", help="regenera o seed do snapshot (não toca no lake)")
    ap.add_argument("--mes", default="", help="mês-base AAAAMM (default: último mês disponível)")
    ap.add_argument("--dezembro", action="store_true", help="usa o último dezembro (fim de ano) em vez do último mês")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    ap.add_argument("--mongo-host", default=env("ESTBAN_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("ESTBAN_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("ESTBAN_MONGO_DB", "ESTBAN"))
    ap.add_argument("--mongo-user", default=env("ESTBAN_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("ESTBAN_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("ESTBAN_AUTH_DB", "admin"))
    ap.add_argument("--write-mongo", action="store_true")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    args = ap.parse_args()
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)

    if args.inspect:
        return _inspect(args)
    if args.inspect_verbetes:
        return _inspect_verbetes(args)

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — refYear {}, mês {}, {} municípios.".format(
            snapshot.get("fetchedAt"), snapshot["refYear"], snapshot.get("mesBase"),
            len(snapshot.get("municipios") or {})), file=sys.stderr)
    else:
        codes = municipios_canonicos()
        code7_set = set(codes)
        code6_map = {c[:6]: c for c in codes}
        meses = _list_meses(args)
        if not meses:
            sys.exit("Nenhuma coleção 'AAAAMM' na base {}.".format(args.mongo_db))
        if args.mes:
            mes = args.mes
            if mes not in meses:
                sys.exit("Mês {} não está no lake. Disponíveis (últimos): {}".format(mes, meses[-6:]))
        elif args.dezembro:
            mes = _latest_december(meses)
            print("[lake] mês-base auto = {} (último dezembro disponível).".format(mes), file=sys.stderr)
        else:
            mes = meses[-1]
            print("[lake] mês-base auto = {} (último mês disponível).".format(mes), file=sys.stderr)
        municipios = harvest(args, mes, code7_set, code6_map)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "refYear": int(mes[:4]), "mesBase": mes, "fonte": "lake",
            "verbete": HEADLINE_CODE, "componentes": CREDITO_CODES,
            "municipios": municipios,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[lake] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    values, meta = build_values(snapshot)
    out = emit(values, meta["refYear"])
    pb = meta["pb"]
    com = [v for v in values if v["numericValue"] is not None]
    print("{} (SALDO R$, {}): {}/223 municípios no ESTBAN; {} com saldo de crédito > 0.".format(
        INDICATOR_ID, meta["mesBase"], len(com), pb["comCredito"]))
    print("Total PB: saldo de operações de crédito R$ {:,.2f}.".format(pb["saldo"]))
    if pb["breakdown"]:
        print("Por componente (PB): " + " · ".join(
            "{} R$ {:,.0f}".format(GROUP_LABELS.get(k, k), pb["breakdown"][k])
            for k, _, _ in BREAKDOWN_GROUPS if k in pb["breakdown"]))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, build_indicator(meta["refYear"]), values)


if __name__ == "__main__":
    main()
