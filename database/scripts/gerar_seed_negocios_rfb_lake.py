#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera os seeds (mongosh) de QUATRO indicadores da OPP, todos da MESMA fonte — a base de
**Estabelecimentos da Receita Federal no data lake do Sebrae** — numa rodada só (molde do
gerar_seed_escolaridade.py / _mpe_compras_publicas_lake.py):

    - negocios-abertos    "Pequenos negócios abertos"      (fluxo de aberturas no ano-ref)      [agenda inclusao]
    - empresas-ativas     "Empresas ativas"                (estoque de estab. ativos — TODOS os portes)  [agenda inclusao]
    - negocios-extintos   "Pequenos negócios extintos"     (fluxo de baixas no ano-ref)         [agenda inclusao]
    - crescimento-mpe      "Crescimento de MPE formalizadas" (var. % a.a. do MESMO fluxo de aberturas) [agenda inovacao]

  + 4 cards da BASE ECONÔMICA (Panorama, section "socialeconomic"), do MESMO estoque ativo:
    - empresas-ativas-total  "Empresas Ativas (ano)"  (estoque ativo — todos os portes)
    - meis / mes / epps      "MEI / ME / EPP (ano)"   (estoque ativo quebrado por porte via join no CNPJ)
  ⚠️ os 3 por porte (meis/mes/epps) só saem no run ONLINE — o join de porte do estoque (~todos os
  CNPJs ativos da PB) não cabe no --offline; o snapshot guarda o split em `ativasPorPorte`.

O crescimento-mpe (`crescimento-mpe`) foi CONSOLIDADO aqui (jul/2026): media exatamente o mesmo
fluxo de aberturas de MPE que o `negocios-abertos` — sua `numericValue` é a variação % a.a. que o
abertos já guarda no breakdown. Antes vinha da API Tesseract do Observatório Sebrae (online);
agora sai do lake, sem dependência de rede, e não pode discordar do `negocios-abertos`. O gerador
antigo `gerar_seed_crescimento_mpe.py` fica no repo como referência/fallback (Observatório).
    ⚠️ o `anoCorrenteParcial` que o Observatório (cubo ao vivo) trazia NÃO existe no lake — a
    coleção RF_ESTABELECIMENTOS_<ano> é o vintage daquele ano, sem ano corrente parcial. A série do
    breakdown roda ANO_MIN_SERIE..ano-ref (completo).

------------------------------------------------------------------------------
FONTE: 100% data lake do Sebrae, AUTOCONTIDO (sem internet, sem BigQuery, sem API).
  base RECEITA_FEDERAL (10.19.4.174:27018), coleções por ano:
    - RF_ESTABELECIMENTOS_<ano>  (driver)  -> município (IBGE), SITUACAO_CADASTRAL,
                                              DATA_DE_INICIO_ATIVIDADE, DATA_SITUACAO_CADASTRAL,
                                              CNPJ_BASICO
    - RF_EMPRESAS_<ano>          (porte)   -> PORTE_EMPRESA  ('01'=ME '03'=EPP '05'=demais)
    - RF_SIMPLES_<ano>           (MEI)     -> OPCAO_MEI ('S'/'N')

  Recorte da PB pelo campo UF=='PB' (string). O campo MUNICIPIO é o CÓDIGO DA RFB (ex.: 2051=
  João Pessoa, 1981=Campina Grande), NÃO o IBGE → traduzido p/ o código IBGE da OPP pelo campo
  `rfCode` da coleção `municipalities` do PRÓPRIO DadosOPP (sem cruzar fonte externa em runtime).
  O ESTABELECIMENTOS não carrega o porte (que é da empresa) → resolvemos
  com um $in em RF_EMPRESAS pelo CNPJ_BASICO (índice idx_cnpj), como o gerador de compras públicas.

------------------------------------------------------------------------------
MÉTRICAS (decisões do projeto, jun/2026):
  * negocios-abertos  = nº de ESTABELECIMENTOS de pequeno porte (ME+EPP, MEI incluso) cuja
                        DATA_DE_INICIO_ATIVIDADE cai no ano-ref. Contagem absoluta. breakdown traz
                        split MEI/ME/EPP, o ano anterior e a variação % a.a.
  * empresas-ativas   = nº de ESTABELECIMENTOS com SITUACAO_CADASTRAL = '02' (ativa) no snapshot
                        — TODOS os portes (decisão: este indicador não é só pequeno negócio).
  * negocios-extintos = nº de ESTABELECIMENTOS de pequeno porte BAIXADOS (SITUACAO_CADASTRAL='08')
                        cuja DATA_SITUACAO_CADASTRAL cai no ano-ref. Contagem absoluta + var.%.
  * crescimento-mpe    = variação % a.a. do fluxo de aberturas de MPE = (fluxo[ref] − fluxo[prev]) /
                        fluxo[prev] × 100 — o MESMO fluxo do negocios-abertos. breakdown traz a série
                        anual (ANO_MIN_SERIE..ref), o split MEI/ME/EPP do ref e a confiabilidade.
                        Proxy municipal do "MPE nos ELI" (recorte ELI é interno do Sebrae, sem fonte aberta).

  "Pequeno negócio" = porte normalizado IN ('1','3') (ME/EPP; MEI ⊂ ME, separado no breakdown).

SEM threshold (semáforo): contagem bruta, sem faixa oficial bom/atenção/alerta (mesma regra de
trabalhadores-*/mpe-compras — não inventamos cortes). Os três entram SEM `threshold`.

Cobertura: 223 municípios da PB (lista canônica vem do seed de municípios). Município sem
estabelecimento na fatia entra com 0 (ativas) ou numericValue null (abertos/extintos sem base).

------------------------------------------------------------------------------
GOTCHAS (≠ basedosdados, que já harmoniza). NÃO adivinhe nomes de campo — rode --inspect:

  1. MUNICÍPIO é o CÓDIGO DA RFB (id_municipio_rf), NÃO o IBGE (≠ RAIS!). Recortamos a PB por
     UF=='PB' e traduzimos o código p/ IBGE pelo campo `rfCode` de `municipalities` no DadosOPP.
     223 códigos distintos = 223 municípios da PB.

  2. SITUACAO_CADASTRAL: '01' nula · '02' ATIVA · '03' suspensa · '04' inapta · '08' BAIXADA.
     No lake é int → toString dá '2'/'8' (não '02'/'08'); SIT_* cobre as duas formas.

  3. DATA_DE_INICIO_ATIVIDADE (com "DE"!) / DATA_SITUACAO_CADASTRAL: layout RFB = AAAAMMDD. O ano =
     4 primeiros dígitos do toString (robusto a int 20240115, string "20240115" e ISO "2024-01-15").
     ⚠️ Os dois campos de data têm convenções de nome diferentes no lake — confirmado via --inspect.

  4. CNPJ_BASICO é o mesmo nas 3 coleções (int no lake → perde zeros à esquerda; casamos por
     zfill(8)). O porte vem de RF_EMPRESAS, o MEI de RF_SIMPLES.

  5. RF_ESTABELECIMENTOS_<ano> confirmada no lake (jun/2026): ~37,6M docs, índice idx_cnpj,
     sem índice em UF/MUNICIPIO (filtro PB = COLLSCAN, minutos). Calibrado via --inspect.

------------------------------------------------------------------------------
CALIBRAÇÃO (1ª vez — na 10.1.141.23):
  As credenciais do lake (usr_RECEITA_FEDERAL:usr_RECEITA_FEDERAL) são DERIVADAS de --rfb-db no
  próprio script → NÃO precisa passar --rfb-user/--rfb-pass. As do OPP (usrdadosopp) vêm do .env
  (OPP_MONGO_USER/PASS) ou de --opp-user/--opp-pass.

    # ESTABELECIMENTOS: confirma a coleção, o campo de IBGE, situação e datas
    python3 ..._negocios_rfb_lake.py --inspect --ano 2025 --mongo-host 10.19.4.174

    # EMPRESAS (porte) + SIMPLES (MEI)
    python3 ..._negocios_rfb_lake.py --inspect-rfb --ano 2025 --mongo-host 10.19.4.174

RODAR (uma rodada) + ESCREVER no OPP:

    python3 ..._negocios_rfb_lake.py --ano 2025 --mongo-host 10.19.4.174 \
      --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

    python3 ..._negocios_rfb_lake.py --offline   # regenera os seeds do snapshot, sem tocar no lake

Requer: pip install 'pymongo<4'  (host só tem Python 3.6 — script é 3.6-safe).
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple  # 3.6: sem `list[...]`/`X | None`

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
SNAPSHOT = DATA_DIR / "negocios_rfb_lake_pb.json"

# Lake do Sebrae: mesmo IP p/ conexão direta (da 10.1.141.23) e p/ remote_bind do túnel.
# Cada base tem credencial usr_<BASE>:usr_<BASE> (authSource admin) — derivada no main().
LAKE_HOST = "10.19.4.174"

AGENDA = "inclusao"  # agenda default dos indicadores deste gerador; crescimento é "inovacao"
SOURCE = (
    "Receita Federal — base de Estabelecimentos do CNPJ (situação cadastral, data de início "
    "de atividade, porte), via data lake do Sebrae (acesso direto, sem cruzar fonte externa)"
)
SOURCE_DATASET = "sebrae_rfb_estabelecimentos"

ANO_MIN_SERIE = 2016  # série anual de aberturas guardada no breakdown do crescimento-mpe a partir daqui

# --- definição dos indicadores (ordem casa com catalog.ts por agenda) ----------------------
# `agendaId`/`source`/`sourceDataset` opcionais por indicador (default = AGENDA/SOURCE/SOURCE_DATASET).
IND_ABERTOS = {
    "id": "negocios-abertos", "order": 1, "agendaId": "inclusao",
    "unit": "empresas",
    "label": "Pequenos negócios abertos",
    "description": (
        "Número de estabelecimentos de pequeno porte (ME e EPP, incluindo MEI) abertos no "
        "município no ano de referência, pela data de início de atividade na Receita Federal. "
        "Contagem absoluta; o breakdown traz o split MEI/ME/EPP, o ano anterior e a variação."
    ),
}
IND_ATIVAS = {
    "id": "empresas-ativas", "order": 2, "agendaId": "inclusao",
    "unit": "empresas",
    "label": "Empresas ativas",
    "description": (
        "Número de estabelecimentos com situação cadastral ativa no município (Receita Federal). "
        "Considera empresas de todos os portes (estoque ativo no snapshot da base)."
    ),
}
IND_EXTINTOS = {
    "id": "negocios-extintos", "order": 3, "agendaId": "inclusao",
    "unit": "empresas",
    "label": "Pequenos negócios extintos",
    "description": (
        "Número de estabelecimentos de pequeno porte (ME e EPP, incluindo MEI) baixados no "
        "município no ano de referência, pela data da situação cadastral 'baixada' na Receita "
        "Federal. Contagem absoluta; o breakdown traz o ano anterior e a variação."
    ),
}
IND_CRESCIMENTO = {
    "id": "crescimento-mpe", "order": 3, "agendaId": "inovacao",
    "unit": "% a.a.",
    "label": "Crescimento de MPE formalizadas no município",
    "description": (
        "Variação percentual anual no número de micro e pequenas empresas (MEI+ME+EPP) "
        "formalizadas no município, por ano de abertura na Receita Federal. Proxy municipal "
        "aberto para o indicador de MPE nos ELI (o recorte por Ecossistemas Locais de Inovação "
        "é dado interno do Sebrae e não está em fonte aberta)."
    ),
    "source": (
        "Receita Federal — base de Estabelecimentos do CNPJ (data de início de atividade, porte), "
        "via data lake do Sebrae — fluxo de aberturas de MPE (MEI+ME+EPP) por ano de abertura, "
        "todas as situações cadastrais; proxy municipal do indicador de MPE nos ELI"
    ),
    "sourceDataset": "sebrae_rfb_estabelecimentos",
}

# --- cards da BASE ECONÔMICA (Panorama): estoque ativo por porte -----------------------------
# section "socialeconomic"; `order` = índice no array economicBase de src/data/indicators/catalog.ts.
# Todos saem do MESMO estoque ativo (situação '02') do RF Estabelecimentos, quebrado por porte via
# join no CNPJ (RF_EMPRESAS/RF_SIMPLES) — a mesma máquina dos fluxos. `{ano}` no label vira o ano-ref.
SOURCE_ESTOQUE = (
    "Receita Federal — base de Estabelecimentos do CNPJ (situação cadastral, porte), via data lake "
    "do Sebrae — estoque de estabelecimentos ativos (situação '02'); porte de RF_EMPRESAS/RF_SIMPLES"
)
IND_ATIVAS_TOTAL = {
    "id": "empresas-ativas-total", "label": "Empresas Ativas ({ano})",
    "unit": "empresas",
    "placement": {"section": "socialeconomic", "order": 7},
    "description": (
        "Número de estabelecimentos com situação cadastral ativa no município (Receita Federal), "
        "todos os portes — card da base econômica. Mesmo estoque do indicador `empresas-ativas` da "
        "agenda Inclusão produtiva."
    ),
    "source": SOURCE_ESTOQUE, "sourceDataset": SOURCE_DATASET,
}
IND_MEI = {
    "id": "meis", "label": "MEI ({ano})", "porteKey": "mei", "porteLabel": "MEI",
    "unit": "empresas",
    "placement": {"section": "socialeconomic", "order": 9},
    "description": (
        "Número de estabelecimentos ativos de Microempreendedores Individuais (MEI) no município "
        "(Receita Federal — estoque ativo, opção MEI no Simples Nacional)."
    ),
    "source": SOURCE_ESTOQUE, "sourceDataset": SOURCE_DATASET,
}
IND_ME = {
    "id": "mes", "label": "ME ({ano})", "porteKey": "me", "porteLabel": "ME",
    "unit": "empresas",
    "placement": {"section": "socialeconomic", "order": 10},
    "description": (
        "Número de estabelecimentos ativos de Microempresas (ME, exclui MEI) no município "
        "(Receita Federal — estoque ativo, porte '01' no CNPJ)."
    ),
    "source": SOURCE_ESTOQUE, "sourceDataset": SOURCE_DATASET,
}
IND_EPP = {
    "id": "epps", "label": "EPP ({ano})", "porteKey": "epp", "porteLabel": "EPP",
    "unit": "empresas",
    "placement": {"section": "socialeconomic", "order": 11},
    "description": (
        "Número de estabelecimentos ativos de Empresas de Pequeno Porte (EPP) no município "
        "(Receita Federal — estoque ativo, porte '03' no CNPJ)."
    ),
    "source": SOURCE_ESTOQUE, "sourceDataset": SOURCE_DATASET,
}
IND_PORTES = [IND_MEI, IND_ME, IND_EPP]  # estoque ativo por porte

# --- nomes dos campos no lake (confirme com --inspect; override por env RFB_CAMPO_*) --------
# ⚠️ Nesta coleção MUNICIPIO é o CÓDIGO DA RFB (id_municipio_rf), NÃO o IBGE (≠ RAIS, que tem IBGE).
# Recorte da PB por UF=='PB' (string); o código é traduzido p/ IBGE pelo campo `rfCode` da
# coleção `municipalities` no DadosOPP — sem cruzar fonte externa em runtime.
CAMPO_MUNICIPIO = env("ESTAB_CAMPO_MUNICIPIO", "MUNICIPIO")               # código RFB
CAMPO_UF = env("ESTAB_CAMPO_UF", "UF")                                    # 'PB' (string)
PB_UF = env("ESTAB_PB_UF", "PB")
CAMPO_SITUACAO = env("ESTAB_CAMPO_SITUACAO", "SITUACAO_CADASTRAL")        # '02' ativa, '08' baixada
CAMPO_DATA_INICIO = env("ESTAB_CAMPO_DATA_INICIO", "DATA_DE_INICIO_ATIVIDADE")  # RFB no lake usa "DE"
CAMPO_DATA_SITUACAO = env("ESTAB_CAMPO_DATA_SITUACAO", "DATA_SITUACAO_CADASTRAL")
CAMPO_CNPJ = env("ESTAB_CAMPO_CNPJ", "CNPJ_BASICO")
SIT_ATIVA = ("02", "2")
SIT_BAIXADA = ("08", "8")

# --- campos das coleções de empresas/simples (idênticos ao gerador de compras) -------------
RFB_CAMPO_CNPJ = env("RFB_CAMPO_CNPJ", "CNPJ_BASICO")
RFB_CAMPO_PORTE = env("RFB_CAMPO_PORTE", "PORTE_EMPRESA")   # '01'=ME '03'=EPP '05'=demais
RFB_CNPJ_TIPO = env("RFB_CNPJ_TIPO", "int")                 # como CNPJ_BASICO está armazenado
RFB_CAMPO_SIMPLES_CNPJ = env("RFB_CAMPO_SIMPLES_CNPJ", "CNPJ_BASICO")
RFB_CAMPO_MEI = env("RFB_CAMPO_MEI", "OPCAO_MEI")           # 'S'/'N'
MEI_SIM = ("S", "SIM", "1", "TRUE", "T")

CONF_BAIXA_N = 30  # fluxo-base (ano anterior) < 30 → confiabilidade baixa na variação


# ============================================================================
# Expressões de agregação (server-side, robustas a tipo int/string)
# ============================================================================

def _field(path):
    return "$" + path


def _str_of(path):
    return {"$toString": {"$ifNull": [_field(path), ""]}}


def _muni_code():
    """Código de município da RFB (campo MUNICIPIO) como string — traduzido p/ IBGE no Python
    pelo campo `rfCode` de `municipalities` no DadosOPP."""
    return _str_of(CAMPO_MUNICIPIO)


def _ano_expr(path):
    """Ano (int) dos 4 primeiros dígitos do toString — cobre AAAAMMDD e ISO. -1 se inválido."""
    pref = {"$substr": [_str_of(path), 0, 4]}
    return {"$convert": {"input": pref, "to": "int", "onError": -1, "onNull": -1}}


def _sit_str():
    return {"$toString": {"$ifNull": [_field(CAMPO_SITUACAO), ""]}}


def _cnpj_str():
    return {"$toString": {"$ifNull": [_field(CAMPO_CNPJ), ""]}}


def _pb():
    # Recorte por UF (string 'PB') — confiável. NÃO usar prefixo do MUNICIPIO: aqui ele é o
    # código da RFB (TOM), cujo prefixo não corresponde ao IBGE/UF.
    return {"$eq": [{"$toString": {"$ifNull": [_field(CAMPO_UF), ""]}}, PB_UF]}


def pipeline_ativas_cnpj():
    """Estoque de estabelecimentos ATIVOS (situação '02') -> 1 linha por (município, cnpj), com
    n = nº de estabelecimentos ativos daquele CNPJ no município. Serve para (a) o total por
    município (soma de n = todos os portes, = `empresas-ativas`/`empresas-ativas-total`) e (b) o
    split MEI/ME/EPP do estoque (porte resolvido depois no Python via RF_EMPRESAS/RF_SIMPLES).
    ⚠️ É a maior fatia da rodada: ~todos os CNPJs ativos da PB entram no join de porte."""
    return [
        {"$match": {"$expr": {"$and": [_pb(), {"$in": [_sit_str(), list(SIT_ATIVA)]}]}}},
        {"$group": {"_id": {"m": _muni_code(), "c": _cnpj_str()}, "n": {"$sum": 1}}},
        {"$project": {"_id": 0, "muni6": "$_id.m", "cnpj": "$_id.c", "n": 1}},
    ]


def pipeline_aberturas(ano_min, ano_max):
    """Estabelecimentos abertos (DATA_INICIO no ano) -> 1 linha por (município, cnpj, ano),
    para o INTERVALO [ano_min, ano_max]. Porte resolvido depois, no Python (precisa de
    RF_EMPRESAS). Janela larga (2016..ref) alimenta a série anual do crescimento-mpe; o
    negocios-abertos usa só ref/prev desse mesmo agregado. O COLLSCAN é o mesmo — só muda
    quantos docs casam o filtro de ano (e, logo, o tamanho do join de porte)."""
    ano = _ano_expr(CAMPO_DATA_INICIO)
    return [
        {"$match": {"$expr": {"$and": [_pb(), {"$gte": [ano, ano_min]}, {"$lte": [ano, ano_max]}]}}},
        {"$group": {"_id": {"m": _muni_code(), "c": _cnpj_str(), "a": ano}, "n": {"$sum": 1}}},
        {"$project": {"_id": 0, "muni6": "$_id.m", "cnpj": "$_id.c", "ano": "$_id.a", "n": 1}},
    ]


def pipeline_baixas(anos):
    """Estabelecimentos baixados (situação '08') com DATA_SITUACAO no ano -> 1 linha por
    (município, cnpj, ano). Porte resolvido depois no Python. `anos` = [ref, prev]."""
    ano = _ano_expr(CAMPO_DATA_SITUACAO)
    return [
        {"$match": {"$expr": {"$and": [_pb(), {"$in": [_sit_str(), list(SIT_BAIXADA)]},
                                       {"$in": [ano, list(anos)]}]}}},
        {"$group": {"_id": {"m": _muni_code(), "c": _cnpj_str(), "a": ano}, "n": {"$sum": 1}}},
        {"$project": {"_id": 0, "muni6": "$_id.m", "cnpj": "$_id.c", "ano": "$_id.a", "n": 1}},
    ]


# ============================================================================
# Conexão + inspeção
# ============================================================================

def _connect_rfb(args):
    from pymongo import MongoClient
    client = MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=args.rfb_user or None, password=args.rfb_pass or None,
        authSource=args.rfb_auth_db or args.rfb_db,
        serverSelectionTimeoutMS=15000,
    )
    return client[args.rfb_db]


def _connect_opp(args):
    """Mongo OPP (DadosOPP) — de onde lemos o rfCode de `municipalities` e onde escrevemos os indicadores."""
    from pymongo import MongoClient
    client = MongoClient(
        host=args.opp_host, port=args.opp_port,
        username=args.opp_user or None, password=args.opp_pass or None,
        authSource=args.opp_auth_db or args.opp_db,
        serverSelectionTimeoutMS=15000,
    )
    return client[args.opp_db]


def carregar_depara(args):
    """Lê a de-para código RFB -> IBGE da coleção `municipalities` do DadosOPP (campo `rfCode`
    de cada município). Devolve {codigo_rfb(str) -> ibge6(str)}. Sem ela não dá pra casar o
    estabelecimento (que traz o código da RFB) ao municipalityId (IBGE) da OPP."""
    db = _connect_opp(args)
    depara = {}
    for d in db.municipalities.find({"rfCode": {"$ne": None}}, {"_id": 1, "rfCode": 1}):
        rf = str(d.get("rfCode") or "")
        ibge = str(d.get("_id") or "")
        if rf and ibge:
            depara[rf] = ibge[:6]  # muni6 (casa com os 223 canônicos por id[:6])
    if len(depara) < 200:
        sys.exit("Só {} municípios com `rfCode` em municipalities (esperava 223). Carregue o seed "
                 "database/seed/municipios.mongodb.js (atualizado com rfCode) primeiro.".format(len(depara)))
    return depara


def traduzir_rfb_para_ibge(rows, depara):
    """Troca, in place, o código RFB (campo 'muni6') de cada linha pelo IBGE6 da de-para.
    Aborta listando os códigos RFB sem tradução (não deveria acontecer com os 223 da PB)."""
    faltando = set()
    for r in rows:
        ibge6 = depara.get(str(r["muni6"]))
        if ibge6 is None:
            faltando.add(str(r["muni6"]))
        else:
            r["muni6"] = ibge6
    if faltando:
        sys.exit("Códigos RFB sem tradução (campo rfCode em municipalities): {}".format(
            ", ".join(sorted(faltando))[:300]))
    return rows


def _dig(doc, path):
    cur = doc
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return (False, None)
    return (True, cur)


def _has_index_on(coll, field):
    try:
        for _name, info in coll.index_information().items():
            key = info.get("key") or []
            if key and key[0][0] == field:
                return True
    except Exception:
        pass
    return False


def _coll_meta(coll, campos_indice):
    try:
        print("  ~{:,} documentos (estimado)".format(coll.estimated_document_count()))
    except Exception as e:
        print("  (não consegui contar: {})".format(e))
    try:
        idx = coll.index_information()
        print("  índices: {}".format(", ".join(sorted(idx.keys())) or "(nenhum)"))
        for campo in campos_indice:
            print("    índice em {!r}? {}".format(campo, "SIM" if _has_index_on(coll, campo)
                  else "NÃO  ← filtro por município fará COLLSCAN (lento, mas roda uma vez)"))
    except Exception as e:
        print("  (não consegui listar índices: {})".format(e))


def _inspect_estab(db, collection, ano):
    coll = db[collection]
    print("\n=== RF_ESTABELECIMENTOS ({}): 1 documento de exemplo ===".format(collection))
    sample = coll.find_one()
    if sample:
        for k, v in sample.items():
            vs = repr(v)
            print("  {!r}: {}  ({})".format(k, vs[:77] + "…" if len(vs) > 80 else vs, type(v).__name__))
    else:
        print("  (coleção vazia ou inexistente? — confira o nome {!r})".format(collection))
        return
    print("\n=== checagem dos campos configurados (CAMPO_*) ===")
    for nome, campo in [("municipio/IBGE", CAMPO_MUNICIPIO), ("situacao", CAMPO_SITUACAO),
                        ("data inicio", CAMPO_DATA_INICIO), ("data situacao", CAMPO_DATA_SITUACAO),
                        ("cnpj_basico", CAMPO_CNPJ)]:
        ok, val = _dig(sample, campo)
        print("  {:14s} -> {!r:28s} {}".format(nome, campo,
              "OK = {!r}".format(val) if ok else "NÃO ENCONTRADO — ajuste a constante/env"))
    print("\n=== tamanho + índices ===")
    _coll_meta(coll, [CAMPO_MUNICIPIO, CAMPO_CNPJ])
    try:
        print("\n[inspect] agregando amostras da PB (pode levar minutos — COLLSCAN)…", file=sys.stderr)
        facet = {
            "porSituacao": [{"$group": {"_id": _sit_str(), "n": {"$sum": 1}}}, {"$sort": {"n": -1}}],
            "aberturasPorAno": [{"$match": {"$expr": {"$gte": [_ano_expr(CAMPO_DATA_INICIO), ano - 6]}}},
                                {"$group": {"_id": _ano_expr(CAMPO_DATA_INICIO), "n": {"$sum": 1}}},
                                {"$sort": {"_id": 1}}],
            "baixasPorAno": [{"$match": {"$expr": {"$and": [{"$in": [_sit_str(), list(SIT_BAIXADA)]},
                                                            {"$gte": [_ano_expr(CAMPO_DATA_SITUACAO), ano - 6]}]}}},
                             {"$group": {"_id": _ano_expr(CAMPO_DATA_SITUACAO), "n": {"$sum": 1}}},
                             {"$sort": {"_id": 1}}],
        }
        res = list(coll.aggregate([{"$match": {"$expr": _pb()}}, {"$facet": facet}], allowDiskUse=True))
        f = res[0] if res else {}
        print("\n=== situação cadastral na PB ('02'=ativa, '08'=baixada são os que usamos) ===")
        for r in f.get("porSituacao", []):
            print("  situacao {!r}: {:,}".format(r["_id"], r["n"]))
        print("\n=== aberturas por ano na PB (últimos anos — o ano-ref deve estar completo) ===")
        for r in f.get("aberturasPorAno", []):
            print("  {}: {:,}".format(r["_id"], r["n"]))
        print("\n=== baixas (situação 08) por ano na PB ===")
        for r in f.get("baixasPorAno", []):
            print("  {}: {:,}".format(r["_id"], r["n"]))
        print("\nSe situação não tiver '02'/'08' ou os anos não baterem, ajuste os CAMPO_*/SIT_*.")
    except Exception as e:
        print("  (erro ao agregar amostras: {})".format(e))


def _inspect_muni(args):
    """Diagnóstico do município: MUNICIPIO aqui é o código da RFB (não IBGE). Mostra os códigos
    RFB reais da PB (distintos ~223, top por contagem) e confere se o campo `rfCode` de
    `municipalities` (DadosOPP) já cobre todos — a tradução código RFB -> IBGE sai dele."""
    db = _connect_rfb(args)
    coll = db[args.estab_collection]
    print("\n=== MUNICIPIO (código RFB) na PB via UF=='PB' — distintos + top 25 ===")
    print("[inspect-muni] COLLSCAN PB — pode levar minutos…", file=sys.stderr)
    pipe = [{"$match": {"$expr": _pb()}},
            {"$group": {"_id": _field(CAMPO_MUNICIPIO), "n": {"$sum": 1}}},
            {"$sort": {"n": -1}}]
    rows = list(coll.aggregate(pipe, allowDiskUse=True))
    codigos = {str(r["_id"]) for r in rows}
    print("  códigos distintos: {} (PB tem 223 municípios)".format(len(rows)))
    print("  (o top 1 deve ser João Pessoa — código RFB 2051 -> IBGE 2507507)")
    for r in rows[:25]:
        print("  MUNICIPIO {!r}: {:,}".format(r["_id"], r["n"]))
    # confere a de-para do DadosOPP, se as credenciais do OPP foram passadas
    if args.opp_user or args.opp_pass:
        try:
            depara = carregar_depara(args)
            faltando = codigos - set(depara)
            print("\n=== rfCode em municipalities (DadosOPP): {} municípios; cobre os códigos da PB? {} ===".format(
                len(depara), "SIM" if not faltando else "NÃO"))
            if faltando:
                print("  sem tradução: " + ", ".join(sorted(faltando))[:200])
        except SystemExit as e:
            print("\n[de-para] {}".format(e))
    else:
        print("\n(passe --opp-user/--opp-pass p/ conferir o rfCode de municipalities no DadosOPP)")


def _real_sample(coll, junk_field, junk_values):
    s = coll.find_one({junk_field: {"$nin": list(junk_values)}})
    return s if s else coll.find_one()


def _inspect_rfb(db, empresas_coll, simples_coll):
    emp = db[empresas_coll]
    print("\n=== RF_EMPRESAS ({}): tamanho + índices ===".format(empresas_coll))
    _coll_meta(emp, [RFB_CAMPO_CNPJ])
    if _has_index_on(emp, RFB_CAMPO_CNPJ):
        print("  ✓ índice em {!r} → o join de porte usa $in (rápido).".format(RFB_CAMPO_CNPJ))
    else:
        print("  ⚠️ SEM índice em {!r} → join fará varredura única (--rfb-scan).".format(RFB_CAMPO_CNPJ))
    print("\n=== RF_EMPRESAS: 1 documento REAL (pulando stub 'foo') ===")
    s = _real_sample(emp, RFB_CAMPO_PORTE, ["foo", "", None])
    if s:
        for k, v in s.items():
            print("  {!r}: {!r}  ({})".format(k, v, type(v).__name__))
        ok_p, vp = _dig(s, RFB_CAMPO_PORTE)
        print("  porte -> {!r} = {!r} -> normalizado {!r}  ('01'=ME '03'=EPP '05'=demais → pequeno='1'/'3')".format(
            RFB_CAMPO_PORTE, vp, _norm_porte(vp)))
    if simples_coll:
        simples = db[simples_coll]
        print("\n=== RF_SIMPLES ({}): tamanho + índices ===".format(simples_coll))
        _coll_meta(simples, [RFB_CAMPO_SIMPLES_CNPJ])
        print("\n=== RF_SIMPLES: 1 documento REAL (procurando o campo de MEI) ===")
        ss = _real_sample(simples, RFB_CAMPO_SIMPLES_CNPJ, [1, "1", "foo"])
        if ss:
            for k, v in ss.items():
                print("  {!r}: {!r}  ({})".format(k, v, type(v).__name__))
            ok, val = _dig(ss, RFB_CAMPO_MEI)
            print("  campo MEI {!r} -> {}".format(RFB_CAMPO_MEI,
                  "OK = {!r}".format(val) if ok else "NÃO ENCONTRADO — ajuste RFB_CAMPO_MEI"))
    else:
        print("\n(sem --simples-collection → MEI não separado; porte '01' conta como ME no split)")


# ============================================================================
# Harvest (lake) — 3 fatias do RF_ESTABELECIMENTOS
# ============================================================================

def harvest(db, args, ano, prev):
    """Roda as 3 agregações no estabelecimentos e devolve listas cruas (pré-porte).
    ATIVAS vêm por (município, cnpj) p/ o split de porte do estoque; ABERTURAS da janela
    [ANO_MIN_SERIE, ano] (série do crescimento-mpe); BAIXAS só [ref, prev]."""
    coll = db[args.estab_collection]
    anos = [ano, prev]
    print("[lake] agregando ATIVAS por (município, cnpj) em {} (COLLSCAN PB — pode levar minutos)…".format(
        args.estab_collection), file=sys.stderr)
    ativas = [{"muni6": r["muni6"], "cnpj": r["cnpj"], "n": int(r["n"])}
              for r in coll.aggregate(pipeline_ativas_cnpj(), allowDiskUse=True)]
    print("[lake] ATIVAS: {} linhas (município×cnpj).".format(len(ativas)), file=sys.stderr)

    ano_min_abert = min(ANO_MIN_SERIE, prev)
    print("[lake] agregando ABERTURAS ({}..{})…".format(ano_min_abert, ano), file=sys.stderr)
    abert = [{"muni6": r["muni6"], "cnpj": r["cnpj"], "ano": int(r["ano"]), "n": int(r["n"])}
             for r in coll.aggregate(pipeline_aberturas(ano_min_abert, ano), allowDiskUse=True)]
    print("[lake] ABERTURAS: {} linhas (município×cnpj×ano).".format(len(abert)), file=sys.stderr)

    print("[lake] agregando BAIXAS ({}/{})…".format(ano, prev), file=sys.stderr)
    baixa = [{"muni6": r["muni6"], "cnpj": r["cnpj"], "ano": int(r["ano"]), "n": int(r["n"])}
             for r in coll.aggregate(pipeline_baixas(anos), allowDiskUse=True)]
    print("[lake] BAIXAS: {} linhas.".format(len(baixa)), file=sys.stderr)
    return ativas, abert, baixa


# ============================================================================
# Porte na Receita Federal (mesmo padrão do gerador de compras públicas)
# ============================================================================

def _norm_porte(v):
    if v is None:
        return None
    s = str(v).strip()
    if s == "":
        return None
    s = s.lstrip("0")
    return s if s else "0"


def _cast_cnpj(c):
    return int(c) if RFB_CNPJ_TIPO == "int" else c


def _lookup_rfb(coll, cnpj_field, wanted, projection, force_scan):
    if force_scan or not _has_index_on(coll, cnpj_field):
        print("  [rf] {} sem índice em {!r} → varredura única…".format(coll.name, cnpj_field), file=sys.stderr)
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


def porte_por_cnpj_lake(cnpjs8, db, args):
    """{cnpj_basico(8) -> {porte, mei}}. Porte de RF_EMPRESAS; MEI de RF_SIMPLES (se houver)."""
    out = {}  # type: Dict[str, dict]
    wanted = set(cnpjs8)
    if not wanted:
        return out
    emp = db[args.empresas_collection]
    proj_e = {RFB_CAMPO_CNPJ: 1, RFB_CAMPO_PORTE: 1, "_id": 0}
    for cb, d in _lookup_rfb(emp, RFB_CAMPO_CNPJ, wanted, proj_e, args.rfb_scan):
        out[cb] = {"porte": _norm_porte(d.get(RFB_CAMPO_PORTE)), "mei": False}
    print("  [rf] porte resolvido p/ {}/{} CNPJs".format(len(out), len(wanted)), file=sys.stderr)
    if args.simples_collection:
        simples = db[args.simples_collection]
        proj_s = {RFB_CAMPO_SIMPLES_CNPJ: 1, RFB_CAMPO_MEI: 1, "_id": 0}
        nmei = 0
        for cb, d in _lookup_rfb(simples, RFB_CAMPO_SIMPLES_CNPJ, wanted, proj_s, args.rfb_scan):
            if cb in out and str(d.get(RFB_CAMPO_MEI)).strip().upper() in MEI_SIM:
                out[cb]["mei"] = True
                nmei += 1
        print("  [rf] MEI marcado em {} CNPJs".format(nmei), file=sys.stderr)
    return out


def _aplica_porte(rows, porte):
    """Agrega linhas (município×cnpj×ano) -> {muni6 -> {ano(str) -> {mpe,mei,me,epp,total,
    naoPequeno,porteDesconhecido}}}, filtrando pequeno porte. Conta ESTABELECIMENTOS (n)."""
    out = {}  # type: Dict[str, Dict[str, dict]]
    for r in rows:
        cb = str(r["cnpj"]).zfill(8)
        ano = str(r["ano"])
        n = int(r["n"])
        slot = out.setdefault(r["muni6"], {}).setdefault(ano, {
            "mpe": 0, "mei": 0, "me": 0, "epp": 0, "naoPequeno": 0, "porteDesconhecido": 0})
        info = porte.get(cb)
        if not info:
            slot["porteDesconhecido"] += n
            continue
        p = info.get("porte")
        if p in ("1", "3"):
            slot["mpe"] += n
            if info.get("mei"):
                slot["mei"] += n
            elif p == "1":
                slot["me"] += n
            else:
                slot["epp"] += n
        else:
            slot["naoPequeno"] += n
    return out


def _aplica_porte_estoque(rows, porte):
    """Estoque ativo por porte: agrega linhas (município×cnpj, n=estab.) -> {muni6 -> {mei,me,epp,
    naoPequeno,porteDesconhecido,total}}. Mesma classificação do fluxo (_aplica_porte), sem ano.
    MEI/ME/EPP mutuamente exclusivos; `total` = todos os portes (bate com a contagem do
    `empresas-ativas`)."""
    out = {}  # type: Dict[str, dict]
    for r in rows:
        cb = str(r["cnpj"]).zfill(8)
        n = int(r["n"])
        slot = out.setdefault(r["muni6"], {
            "mei": 0, "me": 0, "epp": 0, "naoPequeno": 0, "porteDesconhecido": 0, "total": 0})
        slot["total"] += n
        info = porte.get(cb)
        if not info:
            slot["porteDesconhecido"] += n
            continue
        p = info.get("porte")
        if p in ("1", "3"):
            if info.get("mei"):
                slot["mei"] += n
            elif p == "1":
                slot["me"] += n
            else:
                slot["epp"] += n
        else:
            slot["naoPequeno"] += n
    return out


# ============================================================================
# Build values + emit
# ============================================================================

def br_int(value):
    return "{:,}".format(value).replace(",", ".")


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def _fora_da_pb(keys6, canon6, rotulo):
    fora = set(keys6) - canon6
    if fora:
        sys.exit("[{}] códigos de município (6-dig) fora da PB: ".format(rotulo) + ", ".join(sorted(fora))[:300])


def _valores_fluxo(indicador, agg, ano, prev, codes):
    """Monta os 223 valores de um indicador de FLUXO (abertos/extintos), métrica = contagem
    absoluta de estabelecimentos pequenos no ano-ref; breakdown traz ano anterior e variação."""
    values = []
    pb = {"ref": 0, "prev": 0, "com": 0}
    for code in codes:
        m6 = code[:6]
        por_ano = agg.get(m6, {})
        ref = por_ano.get(str(ano), {})
        ant = por_ano.get(str(prev), {})
        ref_total = int(ref.get("mpe", 0))
        prev_total = int(ant.get("mpe", 0))
        pb["ref"] += ref_total
        pb["prev"] += prev_total
        variacao = round((ref_total - prev_total) / prev_total * 100.0, 1) if prev_total else None
        breakdown = {
            "ano": ano,
            "total": ref_total,
            "porPorte": {"MEI": int(ref.get("mei", 0)), "ME": int(ref.get("me", 0)),
                         "EPP": int(ref.get("epp", 0))},
            "anoAnterior": prev, "totalAnterior": prev_total,
            "variacaoPctAA": variacao,
            "excluidos": {"naoPequeno": int(ref.get("naoPequeno", 0)),
                          "porteDesconhecido": int(ref.get("porteDesconhecido", 0))},
            "confiabilidade": "baixa" if (prev_total < CONF_BAIXA_N) else "normal",
            "metrica": "contagem de estabelecimentos de pequeno porte (ME/EPP, MEI incluso) no ano",
            "fonte": "lake",
        }
        if ref_total == 0 and prev_total == 0 and not por_ano:
            values.append({
                "municipalityId": code, "indicatorId": indicador["id"],
                "rawValue": "—", "numericValue": None, "referenceYear": str(ano),
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(breakdown, semDados=True),
            })
            continue
        pb["com"] += 1
        values.append({
            "municipalityId": code, "indicatorId": indicador["id"],
            "rawValue": br_int(ref_total), "numericValue": ref_total, "referenceYear": str(ano),
            "source": SOURCE, "isFictional": False, "breakdown": breakdown,
        })
    return values, pb


def _valores_ativas(indicador, agg, ano, codes):
    """Estoque de ativos (todos os portes). Município sem ativo entra com 0. Serve tanto o
    indicador de agenda `empresas-ativas` quanto o card `empresas-ativas-total` da base econômica."""
    values = []
    pb = {"total": 0, "com": 0}
    for code in codes:
        n = int(agg.get(code[:6], 0))
        pb["total"] += n
        if n > 0:
            pb["com"] += 1
        values.append({
            "municipalityId": code, "indicatorId": indicador["id"],
            "rawValue": br_int(n), "numericValue": n, "referenceYear": str(ano),
            "source": indicador.get("source", SOURCE), "isFictional": False,
            "breakdown": {"situacao": "ativa (02)", "todosOsPortes": True,
                          "snapshotAno": ano, "fonte": "lake"},
        })
    return values, pb


def _valores_porte(indicador, agg, ano, codes):
    """Estoque ativo de UM porte (meis/mes/epps). `agg` = saída de _aplica_porte_estoque;
    `indicador["porteKey"]` ∈ {mei,me,epp}. Município sem ativo daquele porte entra com 0."""
    key = indicador["porteKey"]
    values = []
    pb = {"total": 0, "com": 0}
    for code in codes:
        slot = agg.get(code[:6], {})
        n = int(slot.get(key, 0))
        pb["total"] += n
        if n > 0:
            pb["com"] += 1
        values.append({
            "municipalityId": code, "indicatorId": indicador["id"],
            "rawValue": br_int(n), "numericValue": n, "referenceYear": str(ano),
            "source": indicador.get("source", SOURCE), "isFictional": False,
            "breakdown": {"situacao": "ativa (02)", "porte": indicador["porteLabel"],
                          "totalAtivosMunicipio": int(slot.get("total", 0)),
                          "snapshotAno": ano, "fonte": "lake"},
        })
    return values, pb


def _valores_crescimento(agg, ano, prev, codes):
    """Crescimento de MPE (`crescimento-mpe`): variação % a.a. do MESMO fluxo de aberturas de
    pequeno porte que o negocios-abertos usa. `numericValue` = (fluxo[ref]−fluxo[prev]) /
    fluxo[prev] × 100. breakdown traz a série anual (ANO_MIN_SERIE..ref) e o split MEI/ME/EPP do
    ref. Município sem base no ano anterior entra com `numericValue: null` (não há variação)."""
    cresc_source = IND_CRESCIMENTO["source"] + " (ano-ref {} vs {})".format(ano, prev)
    values = []
    pb = {"ref": 0, "prev": 0, "com": 0}
    for code in codes:
        por_ano = agg.get(code[:6], {})
        ref = por_ano.get(str(ano), {})
        ant = por_ano.get(str(prev), {})
        fluxo_ref = int(ref.get("mpe", 0))
        fluxo_prev = int(ant.get("mpe", 0))
        pb["ref"] += fluxo_ref
        pb["prev"] += fluxo_prev
        serie_anual = {a: int(por_ano[a].get("mpe", 0))
                       for a in sorted(por_ano) if ANO_MIN_SERIE <= int(a) <= ano}
        por_porte = {"MEI": int(ref.get("mei", 0)), "ME": int(ref.get("me", 0)),
                     "EPP": int(ref.get("epp", 0))}
        breakdown = {
            "aberturasRef": fluxo_ref, "aberturasAnoBase": fluxo_prev,
            "anoRef": ano, "anoBase": prev,
            "porPorteRef": por_porte, "serieAnual": serie_anual,
            "confiabilidade": "baixa" if fluxo_prev < CONF_BAIXA_N else "normal",
            "metrica": "fluxo de novas aberturas de MPE por ano (todas as situações cadastrais)",
            "fonte": "lake",
        }
        if not fluxo_prev:  # sem base no ano anterior → não dá pra calcular variação
            values.append({
                "municipalityId": code, "indicatorId": IND_CRESCIMENTO["id"],
                "rawValue": "—", "numericValue": None, "referenceYear": str(ano),
                "source": cresc_source, "isFictional": False,
                "breakdown": dict(breakdown, semBase=True),
            })
            continue
        pb["com"] += 1
        cresc = (fluxo_ref - fluxo_prev) / fluxo_prev * 100.0
        values.append({
            "municipalityId": code, "indicatorId": IND_CRESCIMENTO["id"],
            "rawValue": "{:+.0f}%".format(cresc), "numericValue": round(cresc, 1),
            "referenceYear": str(ano), "source": cresc_source, "isFictional": False,
            "breakdown": breakdown,
        })
    return values, pb


def build_values(snapshot):
    ano = snapshot["ano"]
    prev = snapshot["prevYear"]
    codes = municipios_canonicos()
    canon6 = {c[:6] for c in codes}

    ativas_map = snapshot["ativas"]
    abertos_map = snapshot["abertos"]
    extintos_map = snapshot["extintos"]
    _fora_da_pb(ativas_map.keys(), canon6, "ativas")
    _fora_da_pb(abertos_map.keys(), canon6, "abertos")
    _fora_da_pb(extintos_map.keys(), canon6, "extintos")

    v_abertos, pb_ab = _valores_fluxo(IND_ABERTOS, abertos_map, ano, prev, codes)
    v_ativas, pb_at = _valores_ativas(IND_ATIVAS, ativas_map, ano, codes)
    v_extintos, pb_ex = _valores_fluxo(IND_EXTINTOS, extintos_map, ano, prev, codes)
    v_cresc, pb_cr = _valores_crescimento(abertos_map, ano, prev, codes)  # deriva do MESMO agregado de aberturas
    grupos = [(IND_ABERTOS, v_abertos), (IND_ATIVAS, v_ativas), (IND_EXTINTOS, v_extintos),
              (IND_CRESCIMENTO, v_cresc)]
    meta = {"ano": ano, "prev": prev,
            "pb": {"abertos": pb_ab, "ativas": pb_at, "extintos": pb_ex, "crescimento": pb_cr}}

    # --- base econômica (Panorama) ---------------------------------------------------------
    # `empresas-ativas-total` (total, todos os portes) sempre; MEI/ME/EPP só se o snapshot trouxer
    # o `ativasPorPorte` (só é gerado no run ONLINE — o join de porte do estoque não cabe no --offline).
    v_at_total, _ = _valores_ativas(IND_ATIVAS_TOTAL, ativas_map, ano, codes)
    grupos.append((IND_ATIVAS_TOTAL, v_at_total))
    app = snapshot.get("ativasPorPorte")
    if app:
        _fora_da_pb(app.keys(), canon6, "ativasPorPorte")
        pb_porte = {}
        for ind in IND_PORTES:
            v, pb_p = _valores_porte(ind, app, ano, codes)
            grupos.append((ind, v))
            pb_porte[ind["porteKey"]] = pb_p
        meta["pb"]["porte"] = pb_porte
    else:
        meta["semPorte"] = True
    return grupos, meta


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_negocios_rfb_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def _placement_of(indicador):
    return indicador.get("placement") or {
        "section": "agenda", "agendaId": indicador.get("agendaId", AGENDA), "order": indicador["order"]}


def build_indicator(indicador, ano):
    return {
        "_id": indicador["id"],
        "label": indicador["label"].replace("{ano}", str(ano)),
        # sem `threshold`: contagem bruta / variação sem faixa oficial -> sem semáforo.
        "referenceYear": str(ano),
        "unit": indicador["unit"],
        "description": indicador["description"],
        "source": indicador.get("source", SOURCE),
        "sourceDataset": indicador.get("sourceDataset", SOURCE_DATASET),
        "placements": [_placement_of(indicador)],
    }


def emit(indicador, values, ano):
    indicator = build_indicator(indicador, ano)
    iid = indicador["id"]
    pl = _placement_of(indicador)
    onde = ("agenda " + pl["agendaId"]) if pl.get("section") == "agenda" else ("base econômica / " + pl.get("section", ""))
    lines = [HEADER, "", "// --- 1) Catálogo: {} ({}) ---".format(
        indicador["label"].replace("{ano}", str(ano)), onde)]
    lines.append("// Receita Federal (Estabelecimentos) via data lake do Sebrae. SEM threshold.")
    lines.append("const indicators = [\n  {},\n]".format(js(indicator)))
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators({}) -> ok (${{indicators.length}} docs)`)".format(iid))
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
    lines.append("print(`indicatorValues({}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)".format(iid))
    out = SEED_DIR / "indicador-{}.mongodb.js".format(iid)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


# ============================================================================
# Guarda-corpos + escrita no OPP
# ============================================================================

def validate(ativas, abert, baixa):
    munis = {r["muni6"] for r in ativas}
    canon6 = {c[:6] for c in municipios_canonicos()}
    total_ativas = sum(r["n"] for r in ativas)
    problemas = []
    if len(munis) < 150:
        problemas.append("só {} municípios com estabelecimento ativo — filtro/campo de IBGE errado?".format(len(munis)))
    if total_ativas < 50_000:
        problemas.append("total de ativos {} implausivelmente baixo (PB tem centenas de milhares) — campo de situação errado?".format(br_int(total_ativas)))
    if not abert:
        problemas.append("0 aberturas no ano-ref/anterior — DATA_INICIO_ATIVIDADE/ano errado? (rode --inspect)")
    fora = munis - canon6
    if fora:
        problemas.append("municípios fora da PB (6-dig): " + ", ".join(sorted(fora))[:200])
    if problemas:
        sys.exit("VALIDAÇÃO FALHOU (nada foi escrito):\n  - " + "\n  - ".join(problemas))
    print("[validação] OK — {} municípios ativos, {} estab. ativos, {} linhas de abertura, {} de baixa.".format(
        len(munis), br_int(total_ativas), len(abert), len(baixa)), file=sys.stderr)


def write_mongo(args, indicadores, values):
    from datetime import timezone
    from pymongo import MongoClient, UpdateOne
    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db,
                         serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    db.indicators.bulk_write([UpdateOne({"_id": i["_id"]}, {"$set": i}, upsert=True) for i in indicadores],
                             ordered=False)
    now = datetime.now(timezone.utc)
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": dict(v, updatedAt=now)}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP {}:{}/{} -> indicators={}, indicatorValues upserted={} modified={}".format(
        args.opp_host, args.opp_port, args.opp_db, len(indicadores), res.upserted_count, res.modified_count))


def _default_collection(prefix, ano, explicit):
    return explicit or "{}_{}".format(prefix, ano)


def main():
    load_dotenv()  # .env auto: dispensa `source` em cada terminal
    ano_default = datetime.now().year - 1
    ap = argparse.ArgumentParser(description="Gera até 8 seeds via ETL do lake (RF Estabelecimentos): 4 de agenda (abertos/ativas/extintos/crescimento-mpe) + 4 da base econômica (empresas-ativas-total/meis/mes/epps; estes só no run online).")
    ap.add_argument("--inspect", action="store_true", help="ESTABELECIMENTOS: mostra 1 doc + situação + anos; não gera nada")
    ap.add_argument("--inspect-rfb", action="store_true", help="EMPRESAS/SIMPLES: mostra 1 doc + porte/MEI; não gera nada")
    ap.add_argument("--inspect-muni", action="store_true", help="MUNICÍPIO: códigos RFB da PB + confere o rfCode em municipalities (DadosOPP); não gera nada")
    ap.add_argument("--offline", action="store_true", help="regenera os seeds do snapshot salvo, sem tocar no lake")
    ap.add_argument("--ano", type=int, default=ano_default, help="ano-ref (fluxo) + ano do snapshot (padrão: ano anterior)")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    # conexão lake (base RECEITA_FEDERAL — estab/empresas/simples, mesmo usuário)
    ap.add_argument("--mongo-host", default=env("RFB_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("RFB_MONGO_PORT", "27018")))
    ap.add_argument("--rfb-db", default=env("RFB_MONGO_DB", "RECEITA_FEDERAL"))
    ap.add_argument("--estab-collection", default=env("RFB_ESTAB_COLLECTION", ""), help="default: RF_ESTABELECIMENTOS_<ano>")
    ap.add_argument("--empresas-collection", default=env("RFB_EMPRESAS_COLLECTION", ""), help="default: RF_EMPRESAS_<ano>")
    ap.add_argument("--simples-collection", default=env("RFB_SIMPLES_COLLECTION", ""), help="default: RF_SIMPLES_<ano>; '-' = sem MEI")
    ap.add_argument("--rfb-user", default=env("RFB_MONGO_USER", ""))
    ap.add_argument("--rfb-pass", default=env("RFB_MONGO_PASS", ""))
    ap.add_argument("--rfb-auth-db", default=env("RFB_AUTH_DB", "admin"))
    ap.add_argument("--rfb-scan", action="store_true", help="força varredura única na RF (sem índice em CNPJ_BASICO)")
    # OPP (DadosOPP): lê o rfCode de `municipalities` (sempre, no online) e escreve os indicadores (--write-mongo)
    ap.add_argument("--write-mongo", action="store_true", help="além dos seeds, faz upsert direto no Mongo OPP")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> (aqui a base é a RFB = RECEITA_FEDERAL).
    args.rfb_user = args.rfb_user or ("usr_" + args.rfb_db)
    args.rfb_pass = args.rfb_pass or ("usr_" + args.rfb_db)

    ano = args.ano
    prev = ano - 1
    args.estab_collection = _default_collection("RF_ESTABELECIMENTOS", ano, args.estab_collection)
    args.empresas_collection = _default_collection("RF_EMPRESAS", ano, args.empresas_collection)
    if args.simples_collection == "-":
        args.simples_collection = ""
    else:
        args.simples_collection = _default_collection("RF_SIMPLES", ano, args.simples_collection)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)

    if args.inspect:
        _inspect_estab(_connect_rfb(args), args.estab_collection, ano)
        return
    if args.inspect_rfb:
        db = _connect_rfb(args)
        _inspect_rfb(db, args.empresas_collection, args.simples_collection)
        return
    if args.inspect_muni:
        _inspect_muni(args)
        return

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — ano {}, {} mun. ativas, {}/{} mun. abertos/extintos.".format(
            snapshot.get("fetchedAt"), snapshot["ano"], len(snapshot["ativas"]),
            len(snapshot["abertos"]), len(snapshot["extintos"])), file=sys.stderr)
    else:
        db = _connect_rfb(args)
        depara = carregar_depara(args)  # de-para RFB->IBGE do DadosOPP (precisa de --opp-user/--opp-pass)
        print("[opp] de-para rfCode->IBGE (municipalities) carregada ({} municípios).".format(len(depara)), file=sys.stderr)
        ativas, abert, baixa = harvest(db, args, ano, prev)
        traduzir_rfb_para_ibge(ativas, depara)
        traduzir_rfb_para_ibge(abert, depara)
        traduzir_rfb_para_ibge(baixa, depara)
        validate(ativas, abert, baixa)
        cnpjs8 = sorted({str(r["cnpj"]).zfill(8) for r in abert}
                        | {str(r["cnpj"]).zfill(8) for r in baixa}
                        | {str(r["cnpj"]).zfill(8) for r in ativas})  # estoque ativo entra no join de porte
        print("[lake/RF] resolvendo porte de {} CNPJs (inclui estoque ativo)…".format(len(cnpjs8)), file=sys.stderr)
        porte = porte_por_cnpj_lake(cnpjs8, db, args)
        ativas_tot = {}  # total de ativos por município (todos os portes)
        for r in ativas:
            ativas_tot[r["muni6"]] = ativas_tot.get(r["muni6"], 0) + int(r["n"])
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "ano": ano, "prevYear": prev, "fonte": "lake",
            "collections": {"estab": args.estab_collection, "empresas": args.empresas_collection,
                            "simples": args.simples_collection or None},
            "ativas": ativas_tot,
            "ativasPorPorte": _aplica_porte_estoque(ativas, porte),
            "abertos": _aplica_porte(abert, porte),
            "extintos": _aplica_porte(baixa, porte),
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[lake] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    grupos, meta = build_values(snapshot)
    indicadores, todos_values = [], []
    for indicador, values in grupos:
        out = emit(indicador, values, meta["ano"])
        com = [v for v in values if v["numericValue"] is not None]
        if indicador["id"] == IND_CRESCIMENTO["id"]:  # variação % → média, não soma
            media = sum(v["numericValue"] for v in com) / len(com) if com else 0.0
            print("OK — {}: {}/223 municípios, média {:+.1f}% a.a. -> {}".format(
                indicador["id"], len(com), media, out.name))
        else:
            soma = sum(v["numericValue"] for v in com)
            print("OK — {}: {}/223 municípios, soma {} -> {}".format(
                indicador["id"], len(com), br_int(soma), out.name))
        indicadores.append(build_indicator(indicador, meta["ano"]))
        todos_values.extend(values)

    pb = meta["pb"]
    cr = pb["crescimento"]
    cresc_pb = (cr["ref"] - cr["prev"]) / cr["prev"] * 100.0 if cr["prev"] else None
    print("Cross-check PB ({}): abertos pequenos={}, ativos(todos)={}, extintos pequenos={}, "
          "crescimento MPE PB={}.".format(
        meta["ano"], br_int(pb["abertos"]["ref"]), br_int(pb["ativas"]["total"]),
        br_int(pb["extintos"]["ref"]),
        "{:+.1f}%".format(cresc_pb) if cresc_pb is not None else "n/d"))
    if pb.get("porte"):
        p = pb["porte"]
        print("  base econômica — estoque ativo por porte PB: MEI={}, ME={}, EPP={} (total todos {}).".format(
            br_int(p["mei"]["total"]), br_int(p["me"]["total"]), br_int(p["epp"]["total"]),
            br_int(pb["ativas"]["total"])))
    else:
        print("  (base econômica: snapshot sem `ativasPorPorte` — MEI/ME/EPP não emitidos; rode ONLINE para gerá-los)")

    if args.write_mongo:
        write_mongo(args, indicadores, todos_values)


if __name__ == "__main__":
    main()
