#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera os seeds (mongosh) dos indicadores **IDEB** (Índice de Desenvolvimento da Educação
Básica, INEP) — cards da base econômica do Panorama — VIA ETL do data lake do Sebrae
(base **IDEB**, usuário `usr_IDEB`), NÃO de API/BigQuery.

São DOIS indicadores, um por etapa do ensino fundamental (a base traz a etapa no campo
`SERIE`):
  - `ideb-anos-iniciais`  <- SERIE == "ANOS_INICIAIS_FUNDAMENTAL"
  - `ideb-anos-finais`    <- SERIE == "ANOS_FINAIS_FUNDAMENTAL"
Cada um já existe como card em src/data/indicators/catalog.ts (economicBase).

== Métrica ==
IDEB OBSERVADO da edição mais recente (2023), numa escala de 0 a 10. O IDEB combina
fluxo (aprovação) e desempenho (Saeb) — quanto maior, melhor. A base do lake traz a
série completa de edições em colunas `IDEB_OBSERVADO_<ano>`:
  2005 · 2007 · 2009 · 2011 · 2013 · 2015 · 2017 · 2019 · 2021 · 2023
ATENÇÃO ao campo da edição 2021: no dump ele vem como `IDEB_OBSERVADO_20212` (dígito
extra). O gerador resolve a edição pelos 4 PRIMEIROS dígitos do sufixo, então 20212 →
2021 automaticamente (ver resolve_year_fields). A série completa entra no `breakdown`.

  - referenceYear = 2023 (última edição). numericValue = IDEB observado 2023 (0-10).
  - variation = variação vs. a edição anterior (2023 vs 2021), campo `variation`
                (basis "edicao-anterior"), no mesmo formato dos demais cards.
  - Município/etapa SEM IDEB 2023 na base (ex.: rede sem matrícula avaliada) →
                numericValue = null, rawValue "—" (lacuna, não "nota 0").
  - SEM threshold (semáforo): o INEP publica METAS projetadas por município/rede/ano,
                mas não uma faixa universal bom/ruim — e o dump só traz o OBSERVADO, não
                a meta. Não inventamos cortes (mesmo critério de IDSC e Cobertura AB).

== Recorte ==
UF == "PB" e REDE == "PUBLICA" (rede pública municipal+estadual; é a visão municipal do
IDEB). Ajuste com --rede / IDEB_REDE se o dump usar outro rótulo (rode --inspect p/ ver
os valores de REDE e SERIE disponíveis).

== Schema do dump (confirmado jun/2026 via docs de exemplo) ==
Base **IDEB** (Mongo 10.19.4.174:27018, authSource admin, usr_IDEB). Cada doc é uma
linha (município × série × rede):
  COD_MUN(str, IBGE 7-díg) · MUNICIPIO(str) · UF(str "PB") · REDE(str "PUBLICA") ·
  SERIE(str "ANOS_INICIAIS_FUNDAMENTAL"|"ANOS_FINAIS_FUNDAMENTAL") ·
  IDEB_OBSERVADO_<ano>(float | ausente)
Reconfirme com --inspect se o schema divergir.

== USO ==
    python3 ..._ideb_lake.py --inspect            # coleções + 1 doc + REDE/SERIE + campos de ano
    python3 ..._ideb_lake.py                      # online: gera os 2 seeds + snapshot
    python3 ..._ideb_lake.py --offline            # regenera os seeds do snapshot (não toca no lake)
    python3 ..._ideb_lake.py --write-mongo        # + OPP_MONGO_USER/PASS no .env

Requer (online): pip install 'pymongo<4'. Host do ETL é Python 3.6 — sem list[...] / X | None.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional  # 3.6: sem PEP585/604


def env(key, default=""):
    """os.environ.get tratando presente-porém-VAZIO ('') como ausente — o .env modelo
    deixa chaves em branco e '' não deve sobrescrever default (int('') quebra)."""
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
SNAPSHOT = DATA_DIR / "ideb_pb.json"
LAKE_HOST = "10.19.4.174"

UF_PB = "PB"
REF_YEAR = 2023        # última edição do IDEB no dump
PREV_YEAR = 2021       # edição anterior (campo vem como IDEB_OBSERVADO_20212)

# Campos do dump (override por env só se o dump renomear).
CAMPO_UF = env("IDEB_CAMPO_UF", "UF")
CAMPO_CODMUN = env("IDEB_CAMPO_CODMUN", "COD_MUN")
CAMPO_MUNICIPIO = env("IDEB_CAMPO_MUNICIPIO", "MUNICIPIO")
CAMPO_REDE = env("IDEB_CAMPO_REDE", "REDE")
CAMPO_SERIE = env("IDEB_CAMPO_SERIE", "SERIE")
OBSERVADO_PREFIX = env("IDEB_OBSERVADO_PREFIX", "IDEB_OBSERVADO_")
REDE = env("IDEB_REDE", "PUBLICA")

# Os dois indicadores, um por etapa (SERIE). order segue a base econômica do catalog.ts
# (idsc 0, idh-m 1, cobertura 2, ideb-iniciais 3, ideb-finais 4).
SERIES = [
    {
        "serie": "ANOS_INICIAIS_FUNDAMENTAL",
        "indicatorId": "ideb-anos-iniciais",
        "label": "IDEB {} - Anos Iniciais".format(REF_YEAR),
        "etapa": "anos iniciais do ensino fundamental (1º ao 5º ano)",
        "order": 3,
    },
    {
        "serie": "ANOS_FINAIS_FUNDAMENTAL",
        "indicatorId": "ideb-anos-finais",
        "label": "IDEB {} - Anos Finais".format(REF_YEAR),
        "etapa": "anos finais do ensino fundamental (6º ao 9º ano)",
        "order": 4,
    },
]

SOURCE = (
    "IDEB {ano} (observado), Índice de Desenvolvimento da Educação Básica — INEP/MEC, "
    "rede {rede}, {etapa}, via data lake do Sebrae"
)
SOURCE_DATASET = "inep_ideb_municipio"


def DESC(etapa):
    return (
        "Índice de Desenvolvimento da Educação Básica (IDEB) da rede pública para os {etapa}, "
        "numa escala de 0 a 10. Combina o desempenho dos estudantes no Saeb com a taxa de "
        "aprovação (fluxo escolar) — quanto mais próximo de 10, melhor o aprendizado e o fluxo. "
        "Valor observado na edição {ano} (bienal); a série histórica desde 2005 fica no detalhe. "
        "Fonte: INEP/MEC, via data lake do Sebrae."
    ).format(etapa=etapa, ano=REF_YEAR)


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


def _pick_collection(args):
    """Coleção dos docs do IDEB. --collection vence (se existir); senão MUNICIPIO (a base
    tem BRASIL/ESTADO/MUNICIPIO/ESCOLA — queremos a municipal); senão a única; senão a 1ª.
    --inspect lista todas."""
    db = _client(args)[args.mongo_db]
    nomes = [n for n in db.list_collection_names() if not n.startswith("system.")]
    if not nomes:
        sys.exit("Banco {!r} não tem coleções (host {}). Confira IDEB_MONGO_DB (a base pode "
                 "se chamar 'usr_IDEB').".format(args.mongo_db, args.mongo_host))
    if args.collection:
        if args.collection in nomes:
            return args.collection
        print("[lake/IDEB] coleção {!r} não existe; disponíveis: {}".format(
            args.collection, ", ".join(sorted(nomes))), file=sys.stderr)
    for n in nomes:                      # dados municipais
        if n.upper() == "MUNICIPIO":
            return n
    if len(nomes) == 1:
        return nomes[0]
    escolha = sorted(nomes)[0]
    print("[lake/IDEB] {} coleções, sem 'MUNICIPIO'; usando {!r} (use --collection: {}).".format(
        len(nomes), escolha, ", ".join(sorted(nomes))), file=sys.stderr)
    return escolha


def _coll(args):
    return _client(args)[args.mongo_db][_pick_collection(args)]


def parse_nota(v):
    """float a partir de número ou string BR ('6,3'); ausente/'—'/'' → None (lacuna)."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if not s or s in ("-", "—", "ND", "nd", "*"):
        return None
    s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def resolve_year_fields(sample):
    """{ano_edicao(int) -> [nomes dos campos]} a partir das chaves de um doc. O campo é
    'IDEB_OBSERVADO_<sufixo>'; a EDIÇÃO são os 4 PRIMEIROS dígitos do sufixo — assim
    'IDEB_OBSERVADO_20211' e 'IDEB_OBSERVADO_20212' (sufixos inconsistentes do dump entre
    coleções) resolvem ambos para a edição 2021. Quando há mais de um campo p/ a mesma
    edição, o harvest pega o 1º valor NÃO-nulo (um dos sufixos costuma vir vazio)."""
    out = {}
    pat = re.compile(r"^" + re.escape(OBSERVADO_PREFIX) + r"(\d{4})")
    for k in sample:
        m = pat.match(str(k))
        if m:
            out.setdefault(int(m.group(1)), []).append(str(k))
    return out


def _nota_de(d, flds):
    """1º valor não-nulo entre os campos `flds` do doc `d` (None se todos vazios)."""
    for f in flds:
        nota = parse_nota(d.get(f))
        if nota is not None:
            return nota
    return None


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def _resolve_code(raw, code7_set, code6_map):
    """COD_MUN do dump → IBGE 7-díg dos 223. Aceita 7-díg direto ou 6-díg (sem DV)."""
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
# Harvest: lê as séries por município (PB pequeno, agregação no cliente)
# ============================================================================

def harvest_serie(args, serie, code7_set, code6_map):
    """{code7 -> {"municipio": str, "edicoes": {ano(int): nota(float)}}} para a PB, na
    `serie` e na REDE configurada."""
    coll = _coll(args)
    base_q = {CAMPO_UF: UF_PB, CAMPO_REDE: args.rede, CAMPO_SERIE: serie}
    sample = coll.find_one(base_q)
    if not sample:
        # tenta sem o filtro de REDE p/ orientar (talvez o rótulo da rede difira)
        alt = coll.find_one({CAMPO_UF: UF_PB, CAMPO_SERIE: serie})
        if alt:
            sys.exit("0 docs p/ REDE={!r}/SERIE={!r}. REDE disponível no dump (amostra): {!r}. "
                     "Ajuste --rede / IDEB_REDE.".format(args.rede, serie, alt.get(CAMPO_REDE)))
        sys.exit("0 docs p/ UF=PB/SERIE={!r}. Rode --inspect e confira CAMPO_SERIE/valores.".format(serie))
    year_fields = resolve_year_fields(sample)
    if REF_YEAR not in year_fields:
        sys.exit("Campo do IDEB {} ({}{}*) ausente em {!r}. Rode --inspect.".format(
            REF_YEAR, OBSERVADO_PREFIX, REF_YEAR, serie))

    proj = {CAMPO_CODMUN: 1, CAMPO_MUNICIPIO: 1, "_id": 0}
    for flds in year_fields.values():
        for f in flds:
            proj[f] = 1

    out = {}
    fora = set()
    dup = 0
    n = 0
    for d in coll.find(base_q, proj):
        n += 1
        code = _resolve_code(d.get(CAMPO_CODMUN), code7_set, code6_map)
        if not code:
            raw = d.get(CAMPO_CODMUN)
            if raw not in (None, ""):
                fora.add(str(raw))
            continue
        edicoes = {}
        for ano, flds in year_fields.items():
            nota = _nota_de(d, flds)
            if nota is not None:
                edicoes[ano] = round(nota, 2)
        if code in out:
            dup += 1   # mesma rede/série/município repetido — mantém o 1º (não soma notas)
            continue
        out[code] = {"municipio": d.get(CAMPO_MUNICIPIO), "edicoes": edicoes}
    if fora:
        print("[lake/IDEB] aviso: {} COD_MUN não casaram com os 223 da PB (amostra: {}).".format(
            len(fora), ", ".join(sorted(fora)[:10])), file=sys.stderr)
    if dup:
        print("[lake/IDEB] aviso: {} docs duplicados (mesmo município/rede/série) ignorados em {}.".format(
            dup, serie), file=sys.stderr)
    com_ref = sum(1 for a in out.values() if REF_YEAR in a["edicoes"])
    print("[lake/IDEB] {}: {} linhas → {} municípios da PB ({} com IDEB {}).".format(
        serie, n, len(out), com_ref, REF_YEAR), file=sys.stderr)
    if len(out) < 20:
        print("[lake/IDEB] ⚠️ poucos municípios — confira CAMPO_UF/CAMPO_CODMUN/REDE com --inspect.",
              file=sys.stderr)
    return out


# ============================================================================
# build_values + emit + write-mongo
# ============================================================================

def br1(value):
    """6.3 -> '6,3' (IDEB tem 1 casa decimal)."""
    return "{:.1f}".format(value).replace(".", ",")


def build_values(serie_cfg, muni):
    """Lista de docs indicatorValues (1 por município) + resumo PB, para uma etapa."""
    iid = serie_cfg["indicatorId"]
    etapa = serie_cfg["etapa"]
    source = SOURCE.format(ano=REF_YEAR, rede=REDE, etapa=etapa)
    codes = municipios_canonicos()
    valores = []
    soma = 0.0
    n_com = 0
    for code in codes:
        a = muni.get(code)
        edicoes = (a or {}).get("edicoes") or {}
        serie_hist = {str(ano): edicoes[ano] for ano in sorted(edicoes)}
        prev = edicoes.get(PREV_YEAR)
        atual = edicoes.get(REF_YEAR)
        variation = None
        if atual is not None and prev not in (None, 0):
            variation = {
                "deltaPct": round((atual - prev) / prev * 100, 1),
                "previousValue": round(prev, 2),
                "previousYear": str(PREV_YEAR),
                "basis": "edicao-anterior",
            }
        common_bd = {
            "rede": REDE,
            "etapa": etapa,
            "serieHistorica": serie_hist,
            "edicaoAnterior": {"ano": str(PREV_YEAR), "valor": round(prev, 2)} if prev is not None else None,
            "fonte": "lake",
        }
        if atual is None:                 # etapa/rede sem IDEB 2023 → lacuna
            valores.append({
                "municipalityId": code, "indicatorId": iid,
                "rawValue": "—", "numericValue": None, "referenceYear": str(REF_YEAR),
                "source": source, "isFictional": False,
                "variation": variation, "breakdown": common_bd,
            })
            continue
        soma += atual
        n_com += 1
        valores.append({
            "municipalityId": code, "indicatorId": iid,
            "rawValue": br1(atual), "numericValue": round(atual, 1),
            "referenceYear": str(REF_YEAR),
            "source": source, "isFictional": False,
            "variation": variation, "breakdown": common_bd,
        })
    media = round(soma / n_com, 2) if n_com else None
    return valores, {"comValor": n_com, "mediaPB": media}


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_ideb_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(serie_cfg):
    return {
        "_id": serie_cfg["indicatorId"],
        "label": serie_cfg["label"],
        # sem `threshold`: o INEP não publica faixa universal bom/ruim p/ o IDEB observado.
        "referenceYear": str(REF_YEAR),
        "description": DESC(serie_cfg["etapa"]),
        "source": SOURCE.format(ano=REF_YEAR, rede=REDE, etapa=serie_cfg["etapa"]),
        "sourceDataset": SOURCE_DATASET,
        "unit": "índice (0–10)",
        "placements": [{"section": "socialeconomic", "order": serie_cfg["order"]}],
    }


def emit(serie_cfg, values):
    iid = serie_cfg["indicatorId"]
    indicator = build_indicator(serie_cfg)
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: {} (card do Panorama / base econômica) ---".format(iid))
    lines.append("// IDEB {} observado, rede {}, {}. SEM threshold (INEP não publica faixa).".format(
        REF_YEAR, REDE, serie_cfg["etapa"]))
    lines.append("const indicators = [\n  {},\n]".format(js(indicator)))
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators({}) -> ok (${{indicators.length}} docs)`)".format(iid))
    lines.append("")
    lines.append("// --- 2) Valores por município ({} docs), IDEB {} ---".format(len(values), REF_YEAR))
    lines.append("// numericValue = IDEB observado {} (0-10, sem semáforo); null = sem dado na etapa/rede.".format(REF_YEAR))
    lines.append("// variation = variação vs. edição anterior ({} vs {}). breakdown.serieHistorica = série 2005→{}.".format(
        REF_YEAR, PREV_YEAR, REF_YEAR))
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
    lines.append("print(`indicatorValues({}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)".format(iid))
    out = SEED_DIR / "indicador-{}.mongodb.js".format(iid)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


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
    print("[write-mongo] OPP {} -> {} indicatorValues upserted={} modified={}".format(
        args.opp_db, indicator["_id"], res.upserted_count, res.modified_count))


# ============================================================================
# inspect
# ============================================================================

def _inspect(args):
    db = _client(args)[args.mongo_db]
    nomes = [n for n in db.list_collection_names() if not n.startswith("system.")]
    print("\n=== coleções na base {} ({}) ===".format(args.mongo_db, len(nomes)))
    print("  {}".format(", ".join(sorted(nomes)) or "(nenhuma — confira IDEB_MONGO_DB; pode ser 'usr_IDEB')"))
    if not nomes:
        return
    coll = _coll(args)
    s = coll.find_one({CAMPO_UF: UF_PB}) or coll.find_one()
    print("\n=== 1 doc (chaves não-IDEB_OBSERVADO) ===")
    for k, v in (s or {}).items():
        if str(k).startswith(OBSERVADO_PREFIX):
            continue
        print("  {:18s} {:8s} = {!r}".format(str(k)[:18], type(v).__name__, v))
    print("\n=== campos configurados (ajuste IDEB_CAMPO_* se não casar) ===")
    for nome, campo in [("uf", CAMPO_UF), ("codmun", CAMPO_CODMUN), ("municipio", CAMPO_MUNICIPIO),
                        ("rede", CAMPO_REDE), ("serie", CAMPO_SERIE)]:
        ok = bool(s) and campo in s
        print("  {:10s} -> {!r:16s} {}".format(nome, campo,
              "OK = {!r}".format(s.get(campo)) if ok else "NÃO ENCONTRADO"))
    if s:
        yf = resolve_year_fields(s)
        print("\n=== edições IDEB_OBSERVADO resolvidas (edição -> campo[s] = valor[es]) ===")
        for ano in sorted(yf):
            flds = yf[ano]
            print("  {} -> {} = {}  (usado: {!r})".format(
                ano, flds, [s.get(f) for f in flds], _nota_de(s, flds)))
        print("  (ref={} prev={}; sufixos 20211/20212 → 2021; harvest pega o 1º não-nulo)".format(
            REF_YEAR, PREV_YEAR))
    print("\n=== valores distintos de REDE e SERIE na PB ===")
    try:
        print("  REDE : {}".format(coll.distinct(CAMPO_REDE, {CAMPO_UF: UF_PB})))
        print("  SERIE: {}".format(coll.distinct(CAMPO_SERIE, {CAMPO_UF: UF_PB})))
    except Exception as e:  # noqa: BLE001
        print("  (distinct falhou: {})".format(e))
    print("\n  recorte atual: REDE={!r}; séries esperadas: {}".format(
        args.rede, [c["serie"] for c in SERIES]))


# ============================================================================
# main
# ============================================================================

def main():
    global REDE
    load_dotenv()
    ap = argparse.ArgumentParser(description="Seeds do IDEB (anos iniciais + finais) via lake usr_IDEB.")
    ap.add_argument("--inspect", action="store_true", help="coleções + 1 doc + REDE/SERIE + campos de ano")
    ap.add_argument("--offline", action="store_true", help="regenera os seeds do snapshot (não toca no lake)")
    ap.add_argument("--rede", default=REDE, help="rede do IDEB (default: {})".format(REDE))
    ap.add_argument("--collection", default=env("IDEB_COLLECTION", ""), help="coleção dos docs (default: auto)")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    ap.add_argument("--mongo-host", default=env("IDEB_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("IDEB_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("IDEB_MONGO_DB", "IDEB"))
    ap.add_argument("--mongo-user", default=env("IDEB_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("IDEB_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("IDEB_AUTH_DB", "admin"))
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

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        # chaves de edição viram string no JSON — normaliza p/ int
        for serie_key, muni in snapshot.get("series", {}).items():
            for code, a in muni.items():
                a["edicoes"] = {int(k): v for k, v in (a.get("edicoes") or {}).items()}
        print("[offline] snapshot {} — refYear {}, rede {}.".format(
            snapshot.get("fetchedAt"), snapshot.get("refYear"), snapshot.get("rede")), file=sys.stderr)
    else:
        codes = municipios_canonicos()
        code7_set = set(codes)
        code6_map = {c[:6]: c for c in codes}
        series_data = {}
        for cfg in SERIES:
            series_data[cfg["serie"]] = harvest_serie(args, cfg["serie"], code7_set, code6_map)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "refYear": REF_YEAR, "prevYear": PREV_YEAR, "rede": args.rede, "fonte": "lake",
            "series": series_data,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[lake] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    REDE = snapshot.get("rede", args.rede)
    for cfg in SERIES:
        muni = snapshot.get("series", {}).get(cfg["serie"], {})
        values, resumo = build_values(cfg, muni)
        out = emit(cfg, values)
        print("{} (IDEB {}): {}/223 municípios com nota; média PB {}. Seed em {}".format(
            cfg["indicatorId"], REF_YEAR, resumo["comValor"], resumo["mediaPB"], out))
        if args.write_mongo:
            write_mongo(args, build_indicator(cfg), values)


if __name__ == "__main__":
    main()
