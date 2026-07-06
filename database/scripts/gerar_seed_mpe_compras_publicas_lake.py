#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) do indicador **Participação dos pequenos negócios em compras
públicas municipais** (`mpe-compras-publicas`) da agenda "Inclusão produtiva" — VIA ETL
do data lake do Sebrae, NÃO da API pública do PNCP.

Por que existe (≠ gerar_seed_mpe_compras_publicas.py):
  O outro gerador puxa os contratos da API de consulta do PNCP (https://pncp.gov.br/api),
  que em jun/2026 estava cronicamente instável (500/504/timeout do backend). O lake do
  Sebrae já tem a base do PNCP ingerida — então fazemos o MESMO que fizemos com a RAIS
  (escolaridade/trabalhadores): agregamos NA ORIGEM e só o resultado pequeno desce. Sem
  depender da disponibilidade da API. A metodologia da MÉTRICA é idêntica à do outro
  gerador — muda só de onde vêm os contratos e de onde vem o porte.

------------------------------------------------------------------------------
TUDO NO LAKE, UMA RODADA SÓ (≠ versão anterior, que dependia do BigQuery):
  O PNCP não traz o porte do fornecedor → precisamos cruzar com a Receita Federal. A RF
  TAMBÉM está no lake (base `RECEITA_FEDERAL`, coleções `RF_EMPRESAS_<ano>` com PORTE_EMPRESA
  e `RF_SIMPLES_<ano>` com a flag de MEI). Então o porte sai de um segundo `$in` no Mongo —
  sem BigQuery, sem internet. O job roda inteiro na 10.1.141.23 (Python 3.6, pymongo<4).

  Ano-alinhado: contratos de CONTRATOS_2025 cruzam com RF_EMPRESAS_2025 / RF_SIMPLES_2025 —
  porte/MEI contemporâneos ao contrato (uma ME de 2025 que virou média em 2026 conta como
  pequeno NAQUELE contrato).

------------------------------------------------------------------------------
CALIBRAÇÃO (1ª vez — recomendada, igual à RAIS):

    # PNCP: confere campos + esfera + qual VALOR_* usar + distribuição de ANO_CONTRATO
    python3 ..._lake.py --inspect \
      --mongo-host 10.19.4.174 --mongo-user usr_PNCP --mongo-pass usr_PNCP \
      --mongo-db PNCP --collection CONTRATOS_2025

    # Receita Federal: confere RF_EMPRESAS_<ano> (porte) e RF_SIMPLES_<ano> (MEI)
    python3 ..._lake.py --inspect-rfb \
      --mongo-host 10.19.4.174 \
      --rfb-user usr_RECEITA_FEDERAL --rfb-pass usr_RECEITA_FEDERAL \
      --rfb-db RECEITA_FEDERAL --rfb-collection RF_EMPRESAS_2025 \
      --rfb-simples-collection RF_SIMPLES_2025

Campos confirmados no lake (jun/2026): PNCP é UPPERCASE_SNAKE (ORGAO_ENTIDADE.ESFERA_ID,
UNIDADE_ORGAO.CODIGO_IBGE, NI_FORNECEDOR, TIPO_PESSOA, CODIGO_PAIS_FORNECEDOR, VALOR_GLOBAL,
ANO_CONTRATO). RF_EMPRESAS_2025: CNPJ_BASICO (int, perde zeros à esquerda; índice idx_cnpj),
PORTE_EMPRESA ('01'=ME, '03'=EPP, '05'=demais). RF_SIMPLES_2025: OPCAO_MEI ('S'/'N'; índice
idx_cnpj). PNCP CONTRATOS_2025 ~976k docs (sem índice em CODIGO_IBGE → harvest faz COLLSCAN,
ok p/ ~1M); RF_EMPRESAS ~65,7M e RF_SIMPLES ~46,2M (lookup via $in pelo idx_cnpj).

------------------------------------------------------------------------------
RODAR (uma rodada, na 10.1.141.23):

    python3 ..._lake.py --ano 2025 \
      --mongo-host 10.19.4.174 --mongo-user usr_PNCP --mongo-pass usr_PNCP \
      --mongo-db PNCP --collection CONTRATOS_2025 \
      --rfb-user usr_RECEITA_FEDERAL --rfb-pass usr_RECEITA_FEDERAL \
      --rfb-db RECEITA_FEDERAL --rfb-collection RF_EMPRESAS_2025 \
      --rfb-simples-collection RF_SIMPLES_2025 \
      --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

    python3 ..._lake.py --offline   # regenera o seed do snapshot, sem tocar no lake

------------------------------------------------------------------------------
MÉTRICA (idêntica ao gerador de API): numericValue = % do valor de contratos da ESFERA
MUNICIPAL (ESFERA_ID == 'M') firmados com fornecedor de pequeno porte (ME/EPP, porte
normalizado IN ('1','3'); MEI ⊂ ME), no ano. Denominador = contratos a PJ nacionais com
porte resolvível na RF; PF/estrangeiro/porte-desconhecido ficam fora (no breakdown).
SEM threshold (não há faixa oficial — não inventamos cortes).

Cobertura: 223 municípios da PB. Sem contratos municipais (PJ) no ano → numericValue null.

Requer: pip install 'pymongo<4'  (só isso — sem BigQuery).
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple  # 3.6: host do ETL sem `list[...]`/`X | None`

def env(key, default=""):
    """os.environ.get que trata variável presente-porém-VAZIA como ausente.

    O .env modelo deixa chaves em branco; ao dar `source` elas viram '' no
    ambiente, e os.environ.get(k, default) só usa o default quando a chave NÃO
    existe — devolvendo '' quando ela existe vazia. Isso fazia int('') estourar
    nas portas e host/authSource virarem ''. Aqui '' (e None) caem no default.
    """
    v = os.environ.get(key)
    return v if v not in (None, "") else default


def load_dotenv():
    """Carrega database/.env no ambiente (se existir) sem sobrescrever o que já veio
    do shell/CLI — evita ter que `source` o .env em cada terminal novo. Precedência:
    flag de linha de comando > variável exportada no shell > .env > default do script."""
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
SNAPSHOT = DATA_DIR / "mpe_compras_publicas_lake_pb.json"

# Lake do Sebrae: mesmo IP p/ conexão direta (da 10.1.141.23) e p/ remote_bind do túnel.
# Cada base tem credencial usr_<BASE>:usr_<BASE> (authSource admin) — derivadas no main()
# (PNCP -> usr_PNCP, RECEITA_FEDERAL -> usr_RECEITA_FEDERAL).
LAKE_HOST = "10.19.4.174"
SEED_FILE = SEED_DIR / "indicador-mpe-compras-publicas.mongodb.js"

INDICATOR_ID = "mpe-compras-publicas"
ORDER = 6                       # 6ª posição na agenda inclusao (ver catalog.ts)
AGENDA = "inclusao"
LABEL = "Participação dos pequenos negócios em compras públicas municipais (% do valor)"
DESCRIPTION = (
    "Percentual do valor dos contratos públicos da esfera municipal (prefeitura, fundos e "
    "autarquias) firmados com fornecedores de pequeno porte (ME/EPP, incluindo MEI), no ano. "
    "Fonte cruzada: contratos do PNCP × porte do fornecedor na Receita Federal — ambos no data "
    "lake do Sebrae. O PNCP não publica o porte do fornecedor; ele vem da base da RF."
)
SOURCE = (
    "PNCP (Portal Nacional de Contratações Públicas, Lei 14.133/2021) × Receita Federal — ambos "
    "via data lake do Sebrae. Contratos da esfera municipal × porte do CNPJ na RF (RF_EMPRESAS), "
    "ano-alinhado. Pequeno negócio = porte ME/EPP (MEI incluso)"
)
SOURCE_DATASET = "sebrae_pncp_x_rfb_cnpj"

ESFERA_MUNICIPAL = "M"
CONF_BAIXA_VALOR = 100_000.0   # denominador PJ < R$100k → confiabilidade baixa
CONF_BAIXA_N = 5               # ou < 5 contratos PJ

# --- campos da coleção PNCP no lake -------------------------------------------------------
# Calibrados num doc real (jun/2026): UPPERCASE_SNAKE, aninhados ORGAO_ENTIDADE/UNIDADE_ORGAO.
# Caminhos com ponto usam dot-notation (Mongo entende nativamente). Override por env PNCP_CAMPO_*.
CAMPO_IBGE = env("PNCP_CAMPO_IBGE", "UNIDADE_ORGAO.CODIGO_IBGE")        # IBGE 7 díg (string), nacional
CAMPO_ESFERA = env("PNCP_CAMPO_ESFERA", "ORGAO_ENTIDADE.ESFERA_ID")    # 'M' = municipal
CAMPO_NI = env("PNCP_CAMPO_NI", "NI_FORNECEDOR")                        # CNPJ(14)/CPF(11), string
CAMPO_TIPO_PESSOA = env("PNCP_CAMPO_TIPO_PESSOA", "TIPO_PESSOA")        # 'PJ' / 'PF'
CAMPO_PAIS = env("PNCP_CAMPO_PAIS", "CODIGO_PAIS_FORNECEDOR")           # 'BRA' / None = nacional
CAMPO_VALOR = env("PNCP_CAMPO_VALOR", "VALOR_GLOBAL")                   # valor do contrato (R$)
CAMPO_DATA = env("PNCP_CAMPO_DATA", "ANO_CONTRATO")                     # int (ano)
CAMPO_DATA_TIPO = env("PNCP_CAMPO_DATA_TIPO", "ano")  # 'ano' (int) | 'iso' (string YYYY-..)

TIPO_PJ_VALORES = ("PJ", "J", "Pessoa Jurídica", "PESSOA JURIDICA")
PAIS_NACIONAL = ("BRA", "BR", "1058", None, "")  # tratados como Brasil

# --- campos das coleções da Receita Federal no lake ---------------------------------------
# RF_EMPRESAS: CNPJ_BASICO é INT (perde zeros à esquerda → casamos por zfill(8)); PORTE_EMPRESA
# é '00'/'01'/'03'/'05' (string). RF_SIMPLES traz a flag de MEI (campo confirmado no --inspect-rfb).
RFB_CAMPO_CNPJ = env("RFB_CAMPO_CNPJ", "CNPJ_BASICO")
RFB_CAMPO_PORTE = env("RFB_CAMPO_PORTE", "PORTE_EMPRESA")   # '01'=ME '03'=EPP '05'=demais '00'=n/i
RFB_CNPJ_TIPO = env("RFB_CNPJ_TIPO", "int")                 # como CNPJ_BASICO está armazenado
RFB_CAMPO_SIMPLES_CNPJ = env("RFB_CAMPO_SIMPLES_CNPJ", "CNPJ_BASICO")
RFB_CAMPO_MEI = env("RFB_CAMPO_MEI", "OPCAO_MEI")          # 'S'/'N' (confirmado no RF_SIMPLES)
MEI_SIM = ("S", "SIM", "1", "TRUE", "T")


# ============================================================================
# 1) ORIGEM: agrega o PNCP no lake do Sebrae (Mongo, server-side)
# ============================================================================

def _field(path: str) -> str:
    return "$" + path


def _ni_str() -> dict:
    return {"$convert": {"input": _field(CAMPO_NI), "to": "string", "onError": "", "onNull": ""}}


def _valor_num() -> dict:
    return {"$convert": {"input": _field(CAMPO_VALOR), "to": "double", "onError": 0.0, "onNull": 0.0}}


def _is_pj() -> dict:
    return {"$in": [_field(CAMPO_TIPO_PESSOA), list(TIPO_PJ_VALORES)]}


def _is_nacional() -> dict:
    return {"$in": [_field(CAMPO_PAIS), list(PAIS_NACIONAL)]}


def _kind_expr() -> dict:
    """Classifica o contrato: 'PJ' (nacional), 'EST' (estrangeiro), 'PF' (resto)."""
    return {"$cond": [
        {"$not": [_is_pj()]}, "PF",
        {"$cond": [{"$not": [_is_nacional()]}, "EST", "PJ"]},
    ]}


def _ano_match(ano: int) -> dict:
    if CAMPO_DATA_TIPO == "ano":
        return {"$eq": [{"$convert": {"input": _field(CAMPO_DATA), "to": "int", "onError": -1, "onNull": -1}}, ano]}
    pref = {"$substr": [{"$convert": {"input": _field(CAMPO_DATA), "to": "string", "onError": "", "onNull": ""}}, 0, 4]}
    return {"$eq": [pref, str(ano)]}


def _ibge_str_expr() -> dict:
    return {"$convert": {"input": _field(CAMPO_IBGE), "to": "string", "onError": "", "onNull": ""}}


def _build_match(ano: int, com_esfera: bool, com_ano: bool) -> dict:
    """PB (IBGE começa em 25), ano (se com_ano) e esfera 'M' (se com_esfera).
    Match PLANO (não `$expr`) → usa índice em CODIGO_IBGE/ANO_CONTRATO/ESFERA_ID se houver,
    em vez de COLLSCAN. Pressupõe o schema confirmado (CODIGO_IBGE string, ANO_CONTRATO int)."""
    m = {CAMPO_IBGE: {"$regex": "^25"}}  # PB: IBGE 7 díg começa em 25
    if com_ano:
        m[CAMPO_DATA] = ano if CAMPO_DATA_TIPO == "ano" else {"$regex": "^" + str(ano)}
    if com_esfera:
        m[CAMPO_ESFERA] = ESFERA_MUNICIPAL
    return m


def _pipeline(ano: int, com_esfera: bool, com_ano: bool) -> List[dict]:
    """Reduz o PNCP a 1 linha por (município × fornecedor-base × tipo). cnpj8 só p/ PJ;
    PF/EST agregam num balde por município (não precisamos do indivíduo, só do valor)."""
    ibge6 = {"$substr": [_ibge_str_expr(), 0, 6]}
    cnpj8 = {"$substr": [_ni_str(), 0, 8]}
    kind = _kind_expr()
    chave_cnpj = {"$cond": [{"$eq": [kind, "PJ"]}, cnpj8, ""]}
    return [
        {"$match": _build_match(ano, com_esfera, com_ano)},
        {"$group": {
            "_id": {"ibge": ibge6, "kind": kind, "cnpj8": chave_cnpj},
            "valor": {"$sum": _valor_num()},
            "n": {"$sum": 1},
        }},
        {"$project": {"_id": 0, "ibge": "$_id.ibge", "kind": "$_id.kind",
                      "cnpj8": "$_id.cnpj8", "valor": {"$round": ["$valor", 2]}, "n": 1}},
        {"$sort": {"ibge": 1, "kind": 1, "cnpj8": 1}},
    ]


def _connect_pncp(args):
    from pymongo import MongoClient
    client = MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db or args.mongo_db,  # lake: usuários por base ficam no admin
        serverSelectionTimeoutMS=15000,
    )
    return client[args.mongo_db][args.collection]


def _dig(doc, path):
    cur = doc
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return (False, None)
    return (True, cur)


def _has_index_on(coll, field: str) -> bool:
    """True se há índice cujo 1º campo é `field` (prefixo utilizável por $in/$eq)."""
    try:
        for _name, info in coll.index_information().items():
            key = info.get("key") or []
            if key and key[0][0] == field:
                return True
    except Exception:  # noqa: BLE001
        pass
    return False


def _coll_meta(coll, campos_indice) -> None:
    """Imprime tamanho estimado + índices (e se os campos-chave estão indexados)."""
    try:
        print("  ~{:,} documentos (estimado)".format(coll.estimated_document_count()))
    except Exception as e:  # noqa: BLE001
        print("  (não consegui contar: {})".format(e))
    try:
        idx = coll.index_information()
        print("  índices: {}".format(", ".join(sorted(idx.keys())) or "(nenhum)"))
        for campo in campos_indice:
            print("    índice em {!r}? {}".format(campo, "SIM" if _has_index_on(coll, campo)
                  else "NÃO  ← join/scan será lento sem índice"))
    except Exception as e:  # noqa: BLE001
        print("  (não consegui listar índices: {})".format(e))


def _inspect_pncp(coll, ano: int) -> None:
    sample = coll.find_one()
    print("\n=== PNCP: 1 documento de exemplo (chaves de 1º nível) ===")
    if sample:
        for k, v in sample.items():
            vs = repr(v)
            print("  {!r}: {}  ({})".format(k, vs[:77] + "…" if len(vs) > 80 else vs, type(v).__name__))
    else:
        print("  (coleção vazia?)")
    print("\n=== tamanho + índices da coleção ===")
    _coll_meta(coll, [CAMPO_IBGE, CAMPO_DATA])
    print("\n=== campos configurados (CAMPO_*) ===")
    for nome, campo in [("ibge", CAMPO_IBGE), ("esfera", CAMPO_ESFERA), ("niFornecedor", CAMPO_NI),
                        ("tipoPessoa", CAMPO_TIPO_PESSOA), ("pais", CAMPO_PAIS),
                        ("valor", CAMPO_VALOR), ("ano", CAMPO_DATA)]:
        ok, val = _dig(sample or {}, campo)
        print("  {:14s} -> {!r:35s} {}".format(nome, campo,
              "OK = {!r}".format(val) if ok else "NÃO ENCONTRADO — ajuste a constante"))
    try:
        # PB (match plano = usa índice se houver); 1 passada com $facet p/ esfera+ano+valor
        match_pb = {CAMPO_IBGE: {"$regex": "^25"}}
        candidatos = ["VALOR_GLOBAL", "VALOR_INICIAL", "VALOR_ACUMULADO", "VALOR_PARCELA"]
        grp_val = {"_id": None, "n": {"$sum": 1}}
        for c in candidatos:
            num = {"$convert": {"input": _field(c), "to": "double", "onError": 0.0, "onNull": 0.0}}
            grp_val["soma_" + c] = {"$sum": num}
            grp_val["npos_" + c] = {"$sum": {"$cond": [{"$gt": [num, 0]}, 1, 0]}}
        facet = {
            "porEsfera": [{"$group": {"_id": _field(CAMPO_ESFERA), "n": {"$sum": 1}}}, {"$sort": {"n": -1}}],
            "porAno": [{"$group": {"_id": _field(CAMPO_DATA), "n": {"$sum": 1}}}, {"$sort": {"_id": 1}}],
            "valorMunicipal": [{"$match": {CAMPO_ESFERA: ESFERA_MUNICIPAL}}, {"$group": grp_val}],
        }
        print("\n[inspect] agregando contratos da PB (match plano)…", file=sys.stderr)
        res = list(coll.aggregate([{"$match": match_pb}, {"$facet": facet}], allowDiskUse=True))
        f = res[0] if res else {}
        print("\n=== contratos da PB por esfera (esfera 'M' = municipal, nosso escopo) ===")
        for r in f.get("porEsfera", []):
            print("  esfera {!r}: {:,} contratos PB".format(r["_id"], r["n"]))
        print("\n=== distribuição de {} na PB (coleção é do ano fechado?) ===".format(CAMPO_DATA))
        for r in f.get("porAno", []):
            print("  {} = {!r}: {:,}".format(CAMPO_DATA, r["_id"], r["n"]))
        print("\n=== campos de valor candidatos (PB, esfera M) — qual carrega o valor? ===")
        vm = f.get("valorMunicipal") or []
        if vm:
            r = vm[0]
            print("  contratos PB municipais: {:,}".format(r["n"]))
            for c in candidatos:
                print("    {:16s} soma R$ {:>18,.2f}  ({:,} docs > 0)".format(c, r["soma_" + c], r["npos_" + c]))
            print("  -> ajuste CAMPO_VALOR p/ o campo com soma e cobertura plausíveis.")
        else:
            print("  (nenhum contrato PB municipal — confira CAMPO_ESFERA/IBGE)")
    except Exception as e:  # noqa: BLE001
        print("  (erro ao agregar amostras: {})".format(e))


def harvest(args) -> List[dict]:
    """Roda o pipeline no lake e devolve as linhas (município × fornecedor)."""
    coll = _connect_pncp(args)
    com_esfera = not args.sem_esfera
    com_ano = not args.sem_ano
    print("[lake/PNCP] agregando {}.{} (ano={}, esfera={})…".format(
        args.mongo_db, args.collection, args.ano if com_ano else "todos",
        "M" if com_esfera else "todas"), file=sys.stderr)
    rows = []
    for r in coll.aggregate(_pipeline(args.ano, com_esfera, com_ano), allowDiskUse=True):
        rows.append({"ibge": r["ibge"], "kind": r["kind"],
                     "cnpj8": r.get("cnpj8") or "", "valor": float(r["valor"]), "n": int(r["n"])})
    if not rows:
        sys.exit("Agregação retornou 0 linhas — confira os campos com --inspect (ou --sem-esfera/"
                 "--sem-ano se o dump não tiver esses campos).")
    print("[lake/PNCP] {} linhas (município × fornecedor).".format(len(rows)), file=sys.stderr)
    return rows


# ============================================================================
# 2) PORTE: resolve na Receita Federal — TAMBÉM no lake (sem BigQuery)
# ============================================================================

def _norm_porte(v) -> Optional[str]:
    """'01'->'1', '03'->'3', '05'->'5', '00'->'0'. Aceita int/str. None se vazio."""
    if v is None:
        return None
    s = str(v).strip()
    if s == "":
        return None
    s = s.lstrip("0")
    return s if s else "0"


def _cast_cnpj(c: str):
    """cnpj8 (str 8 díg) → tipo como está no lake. int perde zeros (casamos por zfill na volta)."""
    return int(c) if RFB_CNPJ_TIPO == "int" else c


def _connect_rfb(args):
    from pymongo import MongoClient
    client = MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=args.rfb_user or None, password=args.rfb_pass or None,
        authSource=args.rfb_auth_db or args.rfb_db,
        serverSelectionTimeoutMS=15000,
    )
    db = client[args.rfb_db]
    emp = db[args.rfb_collection]
    simples = db[args.rfb_simples_collection] if args.rfb_simples_collection else None
    return emp, simples


def _real_sample(coll, junk_field, junk_values):
    """find_one pulando docs-stub (ex.: o doc com PORTE_EMPRESA='foo'/CNPJ_BASICO=1)."""
    s = coll.find_one({junk_field: {"$nin": list(junk_values)}})
    return s if s else coll.find_one()


def _inspect_rfb(emp, simples) -> None:
    print("\n=== RF_EMPRESAS: tamanho + índices ===")
    _coll_meta(emp, [RFB_CAMPO_CNPJ])
    if _has_index_on(emp, RFB_CAMPO_CNPJ):
        print("  ✓ índice presente em {!r} → o join usa $in (rápido).".format(RFB_CAMPO_CNPJ))
    else:
        print("  ⚠️ SEM índice em {!r} → o join fará UMA varredura completa (use --rfb-scan). "
              "Lento mas funciona.".format(RFB_CAMPO_CNPJ))
    print("\n=== RF_EMPRESAS: 1 documento REAL (pulando stub 'foo') ===")
    s = _real_sample(emp, RFB_CAMPO_PORTE, ["foo", "", None])
    if s:
        for k, v in s.items():
            print("  {!r}: {!r}  ({})".format(k, v, type(v).__name__))
        ok_c, vc = _dig(s, RFB_CAMPO_CNPJ)
        ok_p, vp = _dig(s, RFB_CAMPO_PORTE)
        print("  cnpj_basico -> {!r} = {!r} ({})  | porte -> {!r} = {!r} -> normalizado {!r}".format(
            RFB_CAMPO_CNPJ, vc, type(vc).__name__, RFB_CAMPO_PORTE, vp, _norm_porte(vp)))
        print("  (porte: '01'=ME, '03'=EPP, '05'=demais, '00'=n/i → pequeno = normalizado '1'/'3')")
    else:
        print("  (coleção vazia? — confira se RF_EMPRESAS_2025 foi populada)")
    if simples is not None:
        print("\n=== RF_SIMPLES: tamanho + índices ===")
        _coll_meta(simples, [RFB_CAMPO_SIMPLES_CNPJ])
        print("\n=== RF_SIMPLES: 1 documento REAL (procurando o campo de MEI) ===")
        ss = _real_sample(simples, RFB_CAMPO_SIMPLES_CNPJ, [1, "1", "foo"])
        if ss:
            for k, v in ss.items():
                print("  {!r}: {!r}  ({})".format(k, v, type(v).__name__))
            ok, val = _dig(ss, RFB_CAMPO_MEI)
            print("  campo MEI {!r} -> {}".format(RFB_CAMPO_MEI,
                  "OK = {!r}".format(val) if ok else "NÃO ENCONTRADO — ajuste RFB_CAMPO_MEI p/ a chave certa acima"))
        else:
            print("  (coleção vazia?)")
    else:
        print("\n(sem --rfb-simples-collection → MEI não será separado; porte '01' conta como ME)")


def _lookup_rfb(coll, cnpj_field: str, wanted, projection, force_scan: bool):
    """Devolve um iterável de docs do RF p/ os CNPJs em `wanted` (set de 8-díg str).
    Com índice em `cnpj_field` → `$in` em lotes (transfere só o que casa). Sem índice (ou
    --rfb-scan) → UMA varredura completa filtrando em memória (1 passada, sem índice)."""
    if force_scan or not _has_index_on(coll, cnpj_field):
        print("  [rf] {} sem índice em {!r} → varredura única (pode levar minutos)…".format(
            coll.name, cnpj_field), file=sys.stderr)
        n = 0
        for d in coll.find({}, projection):
            cb = str(d.get(cnpj_field)).zfill(8)
            if cb in wanted:
                yield cb, d
            n += 1
            if n % 5_000_000 == 0:
                print("    [rf] varridos {:,} docs de {}…".format(n, coll.name), file=sys.stderr)
        return
    uniq = sorted(wanted)
    CHUNK = 5000
    for i in range(0, len(uniq), CHUNK):
        lote = uniq[i:i + CHUNK]
        for d in coll.find({cnpj_field: {"$in": [_cast_cnpj(c) for c in lote]}}, projection):
            yield str(d.get(cnpj_field)).zfill(8), d
        print("    [rf] {} {}/{} (via índice)".format(coll.name, min(i + CHUNK, len(uniq)), len(uniq)),
              file=sys.stderr)


def porte_por_cnpj_lake(cnpjs8: List[str], emp, simples, force_scan: bool = False) -> Dict[str, dict]:
    """{cnpj_basico(8 díg str) -> {porte, mei}}. Porte de RF_EMPRESAS; MEI de RF_SIMPLES (se houver).
    Pequeno = porte normalizado '1'/'3'. Usa índice se houver; senão, varredura única."""
    out = {}  # type: Dict[str, dict]
    wanted = set(cnpjs8)
    proj_e = {RFB_CAMPO_CNPJ: 1, RFB_CAMPO_PORTE: 1, "_id": 0}
    for cb, d in _lookup_rfb(emp, RFB_CAMPO_CNPJ, wanted, proj_e, force_scan):
        out[cb] = {"porte": _norm_porte(d.get(RFB_CAMPO_PORTE)), "mei": False}
    print("  [rf] porte resolvido p/ {}/{} CNPJs".format(len(out), len(wanted)), file=sys.stderr)
    if simples is not None:
        proj_s = {RFB_CAMPO_SIMPLES_CNPJ: 1, RFB_CAMPO_MEI: 1, "_id": 0}
        nmei = 0
        for cb, d in _lookup_rfb(simples, RFB_CAMPO_SIMPLES_CNPJ, wanted, proj_s, force_scan):
            if cb in out and str(d.get(RFB_CAMPO_MEI)).strip().upper() in MEI_SIM:
                out[cb]["mei"] = True
                nmei += 1
        print("  [rf] MEI marcado em {} CNPJs".format(nmei), file=sys.stderr)
    return out


# ============================================================================
# 3) DESTINO: cruza com os 223 canônicos e agrega → indicatorValues
# ============================================================================

def br_int(value: int) -> str:
    return "{:,}".format(value).replace(",", ".")


def municipios_canonicos() -> List[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def build_values(snapshot: dict) -> Tuple[List[dict], dict]:
    ano = snapshot["ano"]
    porte = snapshot.get("porte") or {}
    rows = snapshot["rows"]
    codes = municipios_canonicos()
    code6 = {c[:6]: c for c in codes}  # 6-dig (lake) → 7-dig canônico

    agg = {c: {
        "valorPJ": 0.0, "valorMPE": 0.0, "valorMEI": 0.0, "valorME": 0.0, "valorEPP": 0.0,
        "valorDemais": 0.0, "valorPF": 0.0, "valorEstrangeiro": 0.0, "valorDesconhecido": 0.0,
        "nContratos": 0, "nContratosPJ": 0, "fornecedores": set(), "fornecedoresMPE": set(),
    } for c in codes}

    fora = set()
    for r in rows:
        code = code6.get(r["ibge"])
        if not code:
            fora.add(r["ibge"])
            continue
        a = agg[code]
        v = float(r["valor"])
        n = int(r["n"])
        a["nContratos"] += n
        if v <= 0:
            continue
        kind = r["kind"]
        if kind == "PF":
            a["valorPF"] += v
            continue
        if kind == "EST":
            a["valorEstrangeiro"] += v
            continue
        info = porte.get(r["cnpj8"])
        if not info:
            a["valorDesconhecido"] += v
            continue
        a["valorPJ"] += v
        a["nContratosPJ"] += n
        a["fornecedores"].add(r["cnpj8"])
        p = info.get("porte")
        if p in ("1", "3"):  # pequeno negócio (ME/EPP; MEI ⊂ ME)
            a["valorMPE"] += v
            a["fornecedoresMPE"].add(r["cnpj8"])
            if info.get("mei"):
                a["valorMEI"] += v
            elif p == "1":
                a["valorME"] += v
            else:
                a["valorEPP"] += v
        else:
            a["valorDemais"] += v

    if fora:
        sys.exit("Códigos de município (6-dig) fora dos 223 da PB: " + ", ".join(sorted(fora))[:400])

    valores = []
    pb = {"valorPJ": 0.0, "valorMPE": 0.0, "comDados": 0}
    for code in codes:
        a = agg[code]
        base = a["valorPJ"]
        pb["valorPJ"] += base
        pb["valorMPE"] += a["valorMPE"]
        common_bd = {
            "ano": ano,
            "nContratos": a["nContratos"], "nContratosPJ": a["nContratosPJ"],
            "valorPJ": round(base, 2), "valorMPE": round(a["valorMPE"], 2),
            "porPorte": {"MEI": round(a["valorMEI"], 2), "ME": round(a["valorME"], 2),
                         "EPP": round(a["valorEPP"], 2), "demais": round(a["valorDemais"], 2)},
            "valorExcluido": {"pf": round(a["valorPF"], 2), "estrangeiro": round(a["valorEstrangeiro"], 2),
                              "porteDesconhecido": round(a["valorDesconhecido"], 2)},
            "nFornecedoresPJ": len(a["fornecedores"]), "nFornecedoresMPE": len(a["fornecedoresMPE"]),
            "escopo": "esfera municipal (ESFERA_ID='M')",
            "fonte": "lake",
        }
        if base <= 0:
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ano),
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(common_bd, semContratosMunicipais=True),
            })
            continue
        pb["comDados"] += 1
        pct = a["valorMPE"] / base * 100.0
        conf = "baixa" if (base < CONF_BAIXA_VALOR or a["nContratosPJ"] < CONF_BAIXA_N) else "normal"
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": "{:.1f}%".format(pct), "numericValue": round(pct, 1), "referenceYear": str(ano),
            "source": SOURCE, "isFictional": False,
            "breakdown": dict(common_bd, confiabilidade=conf),
        })

    return valores, {"ano": ano, "pb": pb}


# ============================================================================
# 4) GUARDA-CORPOS + emit + escrita direta no OPP
# ============================================================================

def validate(rows: List[dict]) -> None:
    munis = {r["ibge"] for r in rows}
    canon6 = {c[:6] for c in municipios_canonicos()}
    total = sum(r["valor"] for r in rows)
    n_pj = sum(1 for r in rows if r["kind"] == "PJ")

    problemas = []
    if len(munis) < 50:
        problemas.append("só {} municípios com contrato (adesão ao PNCP é irregular, mas <50 "
                         "cheira a filtro/campo errado)".format(len(munis)))
    if total <= 0:
        problemas.append("valor total = 0 — CAMPO_VALOR errado? (rode --inspect)")
    if n_pj == 0:
        problemas.append("nenhuma linha PJ — TIPO_PESSOA/pais errado? (rode --inspect)")
    fora = munis - canon6
    if fora:
        problemas.append("municípios fora da PB (6-dig): " + ", ".join(sorted(fora))[:200])
    if problemas:
        sys.exit("VALIDAÇÃO FALHOU (nada foi escrito):\n  - " + "\n  - ".join(problemas))

    print("[validação] OK — {} municípios com contrato, R$ {:,.0f} total, {} fornecedores PJ.".format(
        len(munis), total, n_pj), file=sys.stderr)


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_mpe_compras_publicas_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(ano: int) -> dict:
    return {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: não há faixa oficial p/ participação MPE em compras (não inventamos cortes).
        "referenceYear": str(ano),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "%",
        "placements": [{"section": "agenda", "agendaId": AGENDA, "order": ORDER}],
    }


def emit(values: List[dict], ano: int) -> Path:
    indicator = build_indicator(ano)
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: o indicador {} (agenda {}) ---".format(INDICATOR_ID, AGENDA))
    lines.append("// Cross-source PNCP × Receita Federal — ambos do data lake do Sebrae.")
    lines.append("// Pequeno negócio = porte ME/EPP (MEI incluso). SEM threshold (sem faixa oficial).")
    lines.append("const indicators = [\n  {},\n]".format(js(indicator)))
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators({}) -> ok (${{indicators.length}} docs)`)".format(INDICATOR_ID))
    lines.append("")
    lines.append("// --- 2) Valores por município ({} docs), ano {} ---".format(len(values), ano))
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
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def write_mongo(args, indicator: dict, values: List[dict]) -> None:
    from datetime import timezone
    from pymongo import MongoClient, UpdateOne
    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db,
                         serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    db.indicators.bulk_write([UpdateOne({"_id": indicator["_id"]}, {"$set": indicator}, upsert=True)],
                             ordered=False)
    now = datetime.now(timezone.utc)
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": dict(v, updatedAt=now)}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP {}:{}/{} -> indicatorValues upserted={} modified={}".format(
        args.opp_host, args.opp_port, args.opp_db, res.upserted_count, res.modified_count))


def main() -> None:
    load_dotenv()  # .env auto: dispensa `source` em cada terminal
    ap = argparse.ArgumentParser(description="Gera o seed de {} via ETL do lake (PNCP × RF).".format(INDICATOR_ID))
    ap.add_argument("--inspect", action="store_true", help="PNCP: mostra 1 doc + campos + esferas + ano + valor; não gera nada")
    ap.add_argument("--inspect-rfb", action="store_true", help="RF: mostra 1 doc de RF_EMPRESAS/RF_SIMPLES + porte; não gera nada")
    ap.add_argument("--offline", action="store_true", help="regenera o seed do snapshot salvo (porte já resolvido), sem tocar no lake")
    ap.add_argument("--ano", type=int, default=datetime.now().year - 1, help="ano civil (referenceYear + filtro; padrão: ano anterior)")
    ap.add_argument("--sem-esfera", action="store_true", help="não filtra ESFERA_ID='M' (se o dump não tiver o campo)")
    ap.add_argument("--sem-ano", action="store_true", help="não filtra ANO_CONTRATO (confia no recorte da coleção)")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    # conexão PNCP (origem dos contratos)
    ap.add_argument("--collection", default=env("PNCP_COLLECTION", "CONTRATOS_2025"), help="coleção do PNCP no lake")
    ap.add_argument("--mongo-host", default=env("PNCP_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("PNCP_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("PNCP_MONGO_DB", "PNCP"))
    ap.add_argument("--mongo-user", default=env("PNCP_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("PNCP_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("PNCP_AUTH_DB", "admin"))
    # conexão Receita Federal (porte) — mesmo servidor, outra base/usuário
    ap.add_argument("--rfb-db", default=env("RFB_MONGO_DB", "RECEITA_FEDERAL"))
    ap.add_argument("--rfb-collection", default=env("RFB_COLLECTION", "RF_EMPRESAS_2025"), help="coleção de empresas (porte)")
    ap.add_argument("--rfb-simples-collection", default=env("RFB_SIMPLES_COLLECTION", "RF_SIMPLES_2025"), help="coleção do Simples (MEI); vazio = sem MEI")
    ap.add_argument("--rfb-scan", action="store_true", help="força varredura única na RF em vez de $in (use se não houver índice em CNPJ_BASICO)")
    ap.add_argument("--rfb-user", default=env("RFB_MONGO_USER", ""))
    ap.add_argument("--rfb-pass", default=env("RFB_MONGO_PASS", ""))
    ap.add_argument("--rfb-auth-db", default=env("RFB_AUTH_DB", "admin"))
    # destino OPP (--write-mongo)
    ap.add_argument("--write-mongo", action="store_true", help="além do seed, faz upsert direto no Mongo OPP")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> — PNCP e RFB são bases distintas.
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)
    args.rfb_user = args.rfb_user or ("usr_" + args.rfb_db)
    args.rfb_pass = args.rfb_pass or ("usr_" + args.rfb_db)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)

    # ---- modos de calibração ----
    if args.inspect:
        _inspect_pncp(_connect_pncp(args), args.ano)
        return
    if args.inspect_rfb:
        emp, simples = _connect_rfb(args)
        _inspect_rfb(emp, simples)
        return

    # ---- carregar/gerar o snapshot ----
    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — ano {}, {} linhas, {} CNPJs com porte.".format(
            snapshot.get("fetchedAt"), snapshot["ano"], len(snapshot["rows"]),
            len(snapshot.get("porte") or {})), file=sys.stderr)
    else:
        rows = harvest(args)
        validate(rows)
        cnpjs8 = sorted({r["cnpj8"] for r in rows if r["kind"] == "PJ" and r["cnpj8"]})
        print("[lake/RF] resolvendo porte de {} CNPJs em {}.{}…".format(
            len(cnpjs8), args.rfb_db, args.rfb_collection), file=sys.stderr)
        emp, simples = _connect_rfb(args)
        porte = porte_por_cnpj_lake(cnpjs8, emp, simples, force_scan=args.rfb_scan) if cnpjs8 else {}
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "ano": args.ano, "fonte": "lake",
            "collectionPncp": args.collection,
            "collectionRfb": args.rfb_collection,
            "collectionSimples": args.rfb_simples_collection or None,
            "esferaFiltrada": (not args.sem_esfera), "anoFiltrado": (not args.sem_ano),
            "rows": rows, "porte": porte,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[lake] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    # ---- emit ----
    values, meta = build_values(snapshot)
    out = emit(values, meta["ano"])

    pb = meta["pb"]
    pct_pb = pb["valorMPE"] / pb["valorPJ"] * 100 if pb["valorPJ"] else 0
    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    print("{}: {}/223 municípios com participação calculável; média (simples) = {:.1f}%.".format(
        INDICATOR_ID, len(com), media))
    print("Cross-check PB (esfera municipal): MPE R$ {:,.0f} de R$ {:,.0f} a PJ = {:.1f}%.".format(
        pb["valorMPE"], pb["valorPJ"], pct_pb))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, build_indicator(meta["ano"]), values)


if __name__ == "__main__":
    main()
