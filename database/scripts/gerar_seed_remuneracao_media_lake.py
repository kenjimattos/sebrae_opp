#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) do indicador **Remuneração média** (base econômica) do banco
da OPP, DIRETO da base RAIS do data lake do Sebrae (Mongo 10.19.4.174:27018).

    - remuneracao-media  "Remuneração média (2024)"

------------------------------------------------------------------------------
FONTE: RAIS do Sebrae (mesma base do gerar_seed_escolaridade.py). É o caminho do
data lake — autocontido, sem BigQuery/API externa em runtime. A agregação
(87,7M vínculos -> 223 linhas) roda NA ORIGEM (aggregation pipeline server-side)
e só o resultado pequeno desce. Nunca replicamos os microdados crus.

  base origem:  Mongo do Sebrae, db `RAIS`, uma coleção por ano: `2024_VINC`
                (VINC = vínculos). Cada doc = 1 vínculo empregatício.
  métrica:      remuneração média = média de VL_REMUN_MEDIA_NOM (remuneração
                média mensal nominal do vínculo, em R$) sobre os vínculos ativos
                em 31/12 com remuneração > 0. mean = soma / nº de vínculos.
  variação:     como os demais cards da base econômica, carrega `variation`
                (deltaPct/previousValue/previousYear/basis). Série anual da RAIS
                -> variação **2024 vs 2023** (basis `yoy`), via --collection-prev.
  destino:      database/seed/indicador-remuneracao-media.mongodb.js

------------------------------------------------------------------------------
GOTCHAS da RAIS crua (≠ basedosdados, que já harmoniza):

  1. MUNICÍPIO em 6 dígitos = código IBGE SEM o dígito verificador (int). Os 223
     códigos canônicos da OPP têm 7 dígitos; casamos pelos 6 primeiros
     (id_7dig[:6] == rais_6dig). PB (UF 25) => range numérico [250000, 260000),
     que é index-friendly (ver _build_match) em vez de $substr sobre 87M docs.

  2. VL_REMUN_MEDIA_NOM pode vir como número (double) OU como string. Em alguns
     dumps a RAIS grava decimal com VÍRGULA ("1234,56", às vezes "1.234,56").
     Por padrão o pipeline faz $convert direto para double (funciona p/ número e
     p/ string "1234.56"). Se o --inspect mostrar vírgula, ligue --decimal-comma
     (ou env RAIS_REMUN_DECIMAL_COMMA=1): aí o pipeline remove o ponto de milhar
     e troca a vírgula por ponto ANTES de converter.

  3. NOMES DOS CAMPOS variam conforme como o Sebrae carregou o dump. NÃO dá pra
     adivinhar — rode `--inspect` UMA vez, confira o doc de exemplo + a média/nº
     de vínculos da PB, e ajuste as constantes CAMPO_* (ou via env RAIS_CAMPO_*).

SEM CLASSIFICAÇÃO (semáforo): valor absoluto (R$/mês) não tem faixa oficial
bom/atenção/alerta (mesma decisão de pib-per-capita/gini). Entra SEM `threshold`.

Cobertura: 223 municípios da PB (lista canônica vem do seed de municípios).
Municípios sem vínculo formal com remuneração entram `null` (cobertura, não zero).

------------------------------------------------------------------------------
Uso (roda na 10.1.141.23, única máquina que alcança o lake):

  # 1) CALIBRE: veja um doc + a média/nº de vínculos da PB
  python3 database/scripts/gerar_seed_remuneracao_media_lake.py --inspect \
      --collection 2024_VINC

  # 2) ajuste CAMPO_* / --decimal-comma se o --inspect mostrar nomes/formato diferentes

  # 3) RODE: agrega na origem (ref + ano anterior p/ variação), salva snapshot e emite o seed
  python3 database/scripts/gerar_seed_remuneracao_media_lake.py \
      --collection 2024_VINC --collection-prev 2023_VINC

  # 4) offline: regenera o seed a partir do snapshot, sem reconsultar
  python3 database/scripts/gerar_seed_remuneracao_media_lake.py --offline

  # (opcional) --write-mongo: além do seed, faz upsert direto no Mongo OPP
Requer:  pip install 'pymongo<4'   (host do ETL tem Python 3.6)
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import List, Optional  # 3.6: host do ETL só tem Python 3.6, sem `list[...]`


def env(key, default=""):
    """os.environ.get que trata variável presente-porém-VAZIA como ausente
    (o .env modelo deixa chaves em branco; `source` as torna '' no ambiente)."""
    v = os.environ.get(key)
    return v if v not in (None, "") else default


def load_dotenv():
    """Carrega database/.env sem sobrescrever o que já veio do shell/CLI.
    Precedência: flag CLI > variável exportada > .env > default do script."""
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
            key, val = line.split("=", 1)
            key = key.strip()
            if key and not os.environ.get(key):  # vazio/ausente -> preenche do .env
                os.environ[key] = val.strip().strip('"').strip("'")


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "remuneracao_media_pb_2024.json"

# Lake do Sebrae: mesmo IP p/ conexão direta (da 10.1.141.23) e p/ remote_bind do túnel.
LAKE_HOST = "10.19.4.174"

ANO = "2024"       # última RAIS consolidada; muda junto com --collection (ex.: 2024_VINC)
ANO_PREV = "2023"  # ano anterior p/ variação yoy; muda junto com --collection-prev
SOURCE = (
    "RAIS — remuneração média mensal dos vínculos formais ativos em 31/12/{ano} "
    "(VL_REMUN_MEDIA_NOM, R$) — base RAIS do Sebrae (acesso direto ao data lake)"
)
SOURCE_DATASET = "sebrae_rais"

INDICATOR_ID = "remuneracao-media"
INDICATOR_LABEL = "Remuneração média (2024)"
INDICATOR_DESC = (
    "Remuneração média mensal dos vínculos formais ativos em 31/12 — média nominal "
    "em reais (VL_REMUN_MEDIA_NOM da RAIS), sobre os vínculos com remuneração positiva. "
    "Fonte: RAIS (data lake do Sebrae)."
)
# ordem 6 = posição na base econômica do catalog.ts (entre gini=5 e pib-per-capita).
PLACEMENT = [{"section": "socialeconomic", "order": 6}]

# --- nomes dos campos na coleção crua do Sebrae --------------------------------
# Confirme com --inspect. Padrão RAIS.*_VINC: MAIÚSCULAS, sem acento.
CAMPO_MUNICIPIO = env("RAIS_CAMPO_MUNICIPIO", "MUNICIPIO")                 # int, 6 díg (IBGE s/ DV)
CAMPO_REMUN = env("RAIS_CAMPO_REMUN", "VL_REMUN_MEDIA_NOM")               # R$/mês (double ou string)
CAMPO_VINCULO_ATIVO = env("RAIS_CAMPO_VINCULO_ATIVO", "VINCULO_ATIVO_31_12")  # 1 = ativo
VINCULO_ATIVO_VALOR = 1  # deixe None p/ não filtrar por vínculo ativo


# ============================================================================
# 1) ORIGEM: agrega na base RAIS do Sebrae
# ============================================================================

def _build_match():
    """Filtro server-side: só PB e, se configurado, vínculo ativo em 31/12.
    Roda na origem antes do $group.

    PB pelo RANGE numérico [250000, 260000): MUNICIPIO é o IBGE 6-díg int (UF 25),
    então todo código de PB cai nesse intervalo e nenhum de fora. É **index-friendly**
    (usa índice em MUNICIPIO se houver) — muito mais rápido que `$expr`/`$substr`, que
    força COLLSCAN sobre as dezenas de milhões de vínculos. Confirmado p/ RAIS.*_VINC
    (--inspect: MUNICIPIO int). Se um dump gravar MUNICIPIO como string, troque por
    `{"$expr": {"$eq": [{"$substr": [{"$toString": "$"+CAMPO}, 0, 2]}, "25"]}}`."""
    match = {CAMPO_MUNICIPIO: {"$gte": 250000, "$lt": 260000}}
    if VINCULO_ATIVO_VALOR is not None:
        match[CAMPO_VINCULO_ATIVO] = {"$in": [VINCULO_ATIVO_VALOR, str(VINCULO_ATIVO_VALOR)]}
    return match


def _remun_double(decimal_comma):
    """Expressão que lê a remuneração como double (robusta a tipo/ausência).
    Se decimal_comma, trata strings "1.234,56" (remove ponto de milhar, vírgula->ponto)."""
    field = "$" + CAMPO_REMUN
    if decimal_comma:
        limpa = {"$replaceAll": {
            "input": {"$replaceAll": {"input": {"$toString": field}, "find": ".", "replacement": ""}},
            "find": ",", "replacement": ".",
        }}
        entrada = {"$cond": [{"$eq": [{"$type": field}, "string"]}, limpa, field]}
    else:
        entrada = field
    return {"$convert": {"input": entrada, "to": "double", "onError": None, "onNull": None}}


def _pipeline(decimal_comma):
    """UMA linha por município (6-dig): total de vínculos, nº com remuneração > 0,
    e soma das remunerações. mean = soma / comRemun (calculado no destino)."""
    muni6 = {"$substr": [{"$toString": "$" + CAMPO_MUNICIPIO}, 0, 6]}
    valido = {"$and": [{"$ne": ["$_r", None]}, {"$gt": ["$_r", 0]}]}
    return [
        {"$match": _build_match()},
        {"$addFields": {"_r": _remun_double(decimal_comma)}},
        {"$group": {
            "_id": muni6,
            "total": {"$sum": 1},
            "comRemun": {"$sum": {"$cond": [valido, 1, 0]}},
            "somaRemun": {"$sum": {"$cond": [valido, "$_r", 0]}},
        }},
        {"$project": {"_id": 0, "muni6": "$_id", "total": 1, "comRemun": 1, "somaRemun": 1}},
        {"$sort": {"muni6": 1}},
    ]


def _connect(args):
    """Abre conexão no lake (direto ou via túnel SSH). Devolve (client, tunnel)."""
    from pymongo import MongoClient

    tunnel = None
    host, port = args.mongo_host, args.mongo_port
    if args.ssh_host:
        from sshtunnel import SSHTunnelForwarder

        tunnel = SSHTunnelForwarder(
            (args.ssh_host, args.ssh_port),
            ssh_username=args.ssh_user,
            ssh_pkey=args.ssh_key or None,
            ssh_password=args.ssh_password or None,
            remote_bind_address=(args.mongo_host, args.mongo_port),
        )
        tunnel.start()
        host, port = "127.0.0.1", tunnel.local_bind_port
        print("[ssh] túnel aberto -> {}, mongo em 127.0.0.1:{}".format(args.ssh_host, port))

    client = MongoClient(
        host=host, port=port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db or args.mongo_db,  # lake usa usuários por base (no admin)
        serverSelectionTimeoutMS=15000,
    )
    return client, tunnel


def fetch_collection(coll, decimal_comma, rotulo):
    """Roda o pipeline numa coleção e devolve 1 linha por município.
    A redução 87M->~223 acontece no servidor."""
    print("[origem] agregando {} (pode levar minutos)…".format(rotulo))
    rows = [
        {"muni6": r["muni6"],
         "total": int(r["total"]),
         "comRemun": int(r["comRemun"]),
         "somaRemun": float(r["somaRemun"])}
        for r in coll.aggregate(_pipeline(decimal_comma), allowDiskUse=True)
    ]
    if not rows:
        sys.exit("Agregação em {} retornou 0 linhas — confira os campos com --inspect.".format(rotulo))
    return rows


def fetch(args):
    """Conecta no lake, agrega o ano-ref (e o ano anterior, se pedido) e devolve
    o snapshot {ano, anoPrev, ref, prev}. --inspect sai aqui dentro."""
    client, tunnel = _connect(args)
    try:
        db = client[args.mongo_db]
        if args.inspect:
            _inspect(db[args.collection], args.decimal_comma)
            sys.exit(0)
        ref = fetch_collection(db[args.collection], args.decimal_comma,
                               "{}.{}".format(args.mongo_db, args.collection))
        prev = None
        if args.collection_prev:
            prev = fetch_collection(db[args.collection_prev], args.decimal_comma,
                                    "{}.{}".format(args.mongo_db, args.collection_prev))
        return {"ano": ANO, "anoPrev": ANO_PREV if prev else None, "ref": ref, "prev": prev}
    finally:
        if tunnel:
            tunnel.stop()


def _inspect(coll, decimal_comma):
    """Modo calibração: 1 doc de exemplo + média/nº de vínculos da PB.
    Use a saída pra conferir/ajustar as constantes CAMPO_* e o --decimal-comma."""
    sample = coll.find_one()
    print("\n=== 1 documento de exemplo (chaves disponíveis) ===")
    if sample:
        for k, v in sample.items():
            print("  {!r}: {!r}  ({})".format(k, v, type(v).__name__))
    print("\n=== checagem dos campos configurados ===")
    for nome, campo in [("município", CAMPO_MUNICIPIO), ("remuneração", CAMPO_REMUN),
                        ("vínculo ativo", CAMPO_VINCULO_ATIVO)]:
        existe = sample and campo in sample
        tipo = type(sample[campo]).__name__ if existe else "?"
        print("  {:14s} -> {!r}  {} ({})".format(
            nome, campo, "OK" if existe else "NÃO ENCONTRADO — ajuste a constante", tipo))
    if sample and CAMPO_REMUN in sample and isinstance(sample[CAMPO_REMUN], str):
        print("  ⚠️  remuneração veio como STRING -> confira vírgula e considere --decimal-comma")
    print("\n=== média da remuneração na PB (amostra do pipeline{}) ===".format(
        " com --decimal-comma" if decimal_comma else ""))
    agg = list(coll.aggregate([
        {"$match": _build_match()},
        {"$addFields": {"_r": _remun_double(decimal_comma)}},
        {"$group": {"_id": None,
                    "total": {"$sum": 1},
                    "comRemun": {"$sum": {"$cond": [{"$and": [{"$ne": ["$_r", None]}, {"$gt": ["$_r", 0]}]}, 1, 0]}},
                    "soma": {"$sum": {"$cond": [{"$and": [{"$ne": ["$_r", None]}, {"$gt": ["$_r", 0]}]}, "$_r", 0]}}}},
    ], allowDiskUse=True))
    if agg:
        a = agg[0]
        media = (a["soma"] / a["comRemun"]) if a["comRemun"] else 0.0
        print("  vínculos PB: {:,}  | com remuneração>0: {:,}  | remuneração média: {}".format(
            int(a["total"]), int(a["comRemun"]), br_reais(media)))
        print("  Se a média sair absurda (ex.: R$ 2,00 ou R$ 2.000.000), o campo/parse está errado.")
    else:
        print("  0 linhas — filtro/campo de município provavelmente errado.")


# ============================================================================
# 2) DESTINO: cruza com os 223 canônicos e emite o seed
# ============================================================================

def br_reais(value):
    """Formata reais em padrão brasileiro: 2345.67 -> 'R$ 2.345,67'."""
    inteiro = "{:,.2f}".format(value)                       # 2,345.67
    inteiro = inteiro.replace(",", "@").replace(".", ",").replace("@", ".")  # 2.345,67
    return "R$ " + inteiro


def canonical_municipios():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit("Não consegui ler os códigos IBGE de {}.".format(MUNICIPIOS_SEED))
    return codes


def _mean(row):
    """Remuneração média do município (soma / nº com remuneração), ou None se vazio."""
    if not row or not row.get("comRemun"):
        return None
    return row["somaRemun"] / row["comRemun"]


def build_values(snap):
    """Monta os 223 docs de indicatorValues. Município sem vínculo com remuneração
    entra numericValue=null (cobertura, não zero)."""
    by6 = {r["muni6"]: r for r in snap["ref"]}
    prev6 = {r["muni6"]: r for r in (snap.get("prev") or [])}
    codes = canonical_municipios()

    extra = set(by6) - {c[:6] for c in codes}
    if extra:
        sys.exit("Códigos de município (6-dig) fora dos 223 da PB: " + ", ".join(sorted(extra))[:400])

    source = SOURCE.format(ano=ANO)
    ano_prev = snap.get("anoPrev")
    values = []
    for code in codes:
        row = by6.get(code[:6])
        mean = _mean(row)
        variation = None
        if mean is not None and ano_prev:
            prev_mean = _mean(prev6.get(code[:6]))
            if prev_mean:  # não-None e != 0
                variation = {
                    "deltaPct": round((mean - prev_mean) / prev_mean * 100, 1),
                    "previousValue": round(prev_mean, 2),
                    "previousYear": ano_prev,
                    "basis": "yoy",
                }
        values.append({
            "municipalityId": code,
            "indicatorId": INDICATOR_ID,
            "rawValue": br_reais(mean) if mean is not None else "N/D",
            "numericValue": round(mean, 2) if mean is not None else None,
            "referenceYear": ANO,
            "source": source,
            "isFictional": False,
            "variation": variation,
            "breakdown": {
                "vinculosComRemuneracao": row["comRemun"] if row else 0,
                "totalVinculosAtivos": row["total"] if row else 0,
                "massaSalarialMensal": round(row["somaRemun"], 2) if row else 0,
            },
        })
    return values


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_remuneracao_media_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def build_indicator():
    """Documento do catálogo (coleção `indicators`). Fonte única do doc de catálogo."""
    return {
        "_id": INDICATOR_ID,
        "label": INDICATOR_LABEL,
        # sem `threshold`: valor absoluto (R$/mês) não tem faixa oficial de semáforo.
        "referenceYear": ANO,
        "description": INDICATOR_DESC,
        "source": SOURCE.format(ano=ANO),
        "sourceDataset": SOURCE_DATASET,
        "unit": "R$/mês",
        "placements": PLACEMENT,
    }


def emit(values):
    indicator = build_indicator()
    lines = [HEADER, "", "// --- 1) Catálogo: {} (base econômica) ---".format(INDICATOR_LABEL)]
    lines.append("// Sem threshold: valor absoluto (R$/mês) não tem faixa oficial de semáforo.")
    lines.append("const indicators = [\n  {},\n]".format(js(indicator)))
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators({}) -> ok (${{indicators.length}} docs)`)".format(INDICATOR_ID))
    lines.append("")
    lines.append("// --- 2) Valores por município ({} docs), RAIS {} (R$/mês) ---".format(len(values), ANO))
    lines.append("// variation = variação anual vs. {} (basis 'yoy'), ou null se faltar.".format(ANO_PREV))
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
    lines.append("print(`indicatorValues({}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)".format(INDICATOR_ID))
    out = SEED_DIR / "indicador-{}.mongodb.js".format(INDICATOR_ID)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


# ============================================================================
# 3) GUARDA-CORPOS + escrita direta no Mongo OPP
# ============================================================================

def validate(snap):
    """Falha ALTO se o resultado cheira a erro — antes de gerar/escrever lixo."""
    rows = snap["ref"]
    munis = {r["muni6"] for r in rows}
    canon6 = {c[:6] for c in canonical_municipios()}
    total = sum(r["total"] for r in rows)
    com = sum(r["comRemun"] for r in rows)
    soma = sum(r["somaRemun"] for r in rows)
    media = (soma / com) if com else 0.0

    problemas = []
    if len(munis) < 200:
        problemas.append("só {} municípios com dados (esperado ~223) — export truncado/filtro errado?".format(len(munis)))
    if total < 100000:
        problemas.append("total {:,} vínculos implausivelmente baixo (PB tem centenas de milhares) — truncado?".format(total))
    if com == 0:
        problemas.append("nenhum vínculo com remuneração>0 — campo de remuneração errado?")
    elif not (500.0 <= media <= 20000.0):
        problemas.append("remuneração média {} fora da faixa plausível (R$500–R$20.000) — campo/parse errado (vírgula? --decimal-comma?)".format(br_reais(media)))
    fora = munis - canon6
    if fora:
        problemas.append("municípios fora da PB (6-dig): " + ", ".join(sorted(fora))[:200])
    if problemas:
        sys.exit("VALIDAÇÃO FALHOU (nada foi escrito):\n  - " + "\n  - ".join(problemas))

    ausentes = canon6 - munis
    print("[validação] OK — {} municípios, {:,} vínculos (com remuneração: {:,}); "
          "remuneração média PB = {}".format(len(munis), total, com, br_reais(media))
          + ("; {} municípios sem vínculo entram null".format(len(ausentes)) if ausentes else ""))


def write_mongo(args, indicators, values):
    """Upsert direto no Mongo OPP (indicators + indicatorValues). Mesma chave dos seeds."""
    from datetime import datetime
    from pymongo import MongoClient, UpdateOne

    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db,
                         serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    db.indicators.bulk_write(
        [UpdateOne({"_id": i["_id"]}, {"$set": i}, upsert=True) for i in indicators], ordered=False)
    now = datetime.utcnow()
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": dict(v, updatedAt=now)}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP {}:{}/{} -> indicators={}, indicatorValues upserted={} modified={}".format(
        args.opp_host, args.opp_port, args.opp_db, len(indicators), res.upserted_count, res.modified_count))


def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Gera o seed de Remuneração média (base econômica) da RAIS do Sebrae.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar o Mongo do Sebrae")
    ap.add_argument("--inspect", action="store_true", help="conecta e mostra 1 doc + média da PB; não gera seed")
    ap.add_argument("--query-only", action="store_true", help="só consulta o Sebrae e salva o snapshot; NÃO gera seed")
    ap.add_argument("--snapshot", default=str(SNAPSHOT), help="caminho do snapshot JSON")
    ap.add_argument("--collection", default="2024_VINC", help="coleção de vínculos do ano-ref (ex.: 2024_VINC)")
    ap.add_argument("--collection-prev", default="", help="coleção do ano anterior p/ variação yoy (ex.: 2023_VINC); vazio = sem variação")
    ap.add_argument("--decimal-comma", action="store_true",
                    default=bool(env("RAIS_REMUN_DECIMAL_COMMA", "")),
                    help="remuneração vem como string com vírgula decimal ('1.234,56')")
    # conexão Mongo ORIGEM = lake Sebrae (cada base é um usuário, ex. usr_RAIS:usr_RAIS)
    ap.add_argument("--mongo-host", default=env("RAIS_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("RAIS_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("RAIS_MONGO_DB", "RAIS"))
    ap.add_argument("--mongo-user", default=env("RAIS_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("RAIS_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("RAIS_AUTH_DB", "admin"), help="authSource do lake (usuários por base ficam no admin)")
    # destino OPP (--write-mongo): Mongo OPP, local na 10.1.141.23
    ap.add_argument("--write-mongo", action="store_true", help="além do seed, faz upsert direto no Mongo OPP")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""), help="authSource do OPP; vazio = usa --opp-db")
    # túnel SSH (opcional)
    ap.add_argument("--ssh-host", default=env("RAIS_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("RAIS_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("RAIS_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("RAIS_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("RAIS_SSH_PASSWORD", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> (cada base tem a sua).
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)

    snapshot = Path(args.snapshot)

    if args.offline:
        if not snapshot.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online (ou --query-only) uma vez primeiro.".format(snapshot))
        snap = json.loads(snapshot.read_text(encoding="utf-8"))
        print("[offline] snapshot {} (ref={} munis, prev={}).".format(
            snapshot, len(snap["ref"]), len(snap["prev"]) if snap.get("prev") else "—"))
    else:
        snap = fetch(args)  # --inspect sai aqui dentro
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps(snap, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[online] snapshot salvo em {} (ref={} munis, prev={}).".format(
            snapshot, len(snap["ref"]), len(snap["prev"]) if snap.get("prev") else "—"))

    if args.query_only:
        print("[query-only] pronto. Leve {} pro repo e rode: "
              "python3 database/scripts/gerar_seed_remuneracao_media_lake.py --offline".format(snapshot))
        return

    validate(snap)

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    values = build_values(snap)
    out = emit(values)
    com_var = sum(1 for v in values if v["variation"])
    com_valor = sum(1 for v in values if v["numericValue"] is not None)
    print("OK — {}: {} municípios ({} com valor, {} com variação). -> {}".format(
        INDICATOR_ID, len(values), com_valor, com_var, out.name))

    if args.write_mongo:
        write_mongo(args, [build_indicator()], values)


if __name__ == "__main__":
    main()
