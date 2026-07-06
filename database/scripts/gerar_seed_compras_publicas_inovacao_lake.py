#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) do indicador **Valor das compras públicas de inovação nos pequenos
negócios (R$/ano)** (`compras-publicas-inovacao`, agenda "Ecossistemas de Inovação") —
VIA ETL do data lake do Sebrae (PNCP × Receita Federal), NÃO da API pública.

== Métrica: NÍVEL (R$), não crescimento ==
`numericValue` = `valorInovPeq[refYear]` = valor (R$) dos contratos da esfera MUNICIPAL
firmados, no ano, com fornecedor de **pequeno porte** (ME/EPP, MEI incluso) cujo contrato é
de **inovação**.

  - refYear = último ano civil completo (padrão: ano corrente − 1). UM ano só.
  - Município SEM contrato municipal a PJ no PNCP → numericValue = null (lacuna de cobertura,
    não "comprou 0"). COM contrato mas sem inovação → 0 (valor real).
  - SEM threshold: valor absoluto, sem faixa oficial.
  - Por que NÍVEL e não crescimento: a variação a.a. é dominada pela ADESÃO crescente ao PNCP
    (ex.: jun/2026 — total municipal PJ cresceu +303% de 2024 p/ 2025; a *share* de inovação
    caiu 3,96%→2,86%). O valor do ano evita esse confundidor. O ano anterior entra só como
    RESERVA de CNAE (estab do ano costuma vir parcial; CNAE é atributo estável).

== "Inovação" = união de DOIS sinais, ambos no lake (sem fonte externa) ==
  (A) CNAE do fornecedor ∈ {TIC 26/61/62/63 · criativa 58/59/60/73/74/90/91 · P&D 72}
      — mesma cesta de `trabalhadores-tic`. Vem de RF_ESTABELECIMENTOS (CNAE do estab.).
  (B) OBJETO do contrato bate no classificador textual calibrado
      (database/scripts/calibrar_compras_inovacao.py — fonte única da semente).
  inovacao = A ∨ B ; confiança 'alta' quando A ∧ B. Conteúdo didático é vetado em (B).

== Tudo no lake, por ano (≠ BigQuery) ==
  O PNCP não traz porte nem CNAE do fornecedor → cruza com a RF (no mesmo servidor):
  porte em RF_EMPRESAS_<ano> (PORTE_EMPRESA), MEI em RF_SIMPLES_<ano> (OPCAO_MEI), CNAE em
  RF_ESTABELECIMENTOS_<ano>. Ano-alinhado: contratos de CONTRATOS_<Y> cruzam com a RF_<Y>.
  Roda inteiro na 10.1.141.23 (Python 3.6, pymongo<4).

== CALIBRAÇÃO (1ª vez) ==

    # PNCP: confere campos/esfera/valor (igual ao mpe-compras)
    python3 ..._inovacao_lake.py --inspect --ano 2025
    # RF empresas/simples (porte/MEI)
    python3 ..._inovacao_lake.py --inspect-rfb --ano 2025
    # RF estabelecimentos: confirma o NOME DO CAMPO de CNAE e de matriz/filial
    python3 ..._inovacao_lake.py --inspect-estab --ano 2025

== RODAR ==

    python3 ..._inovacao_lake.py --ano 2025 \
      --mongo-host 10.19.4.174 \
      --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

    python3 ..._inovacao_lake.py --offline   # regenera o seed do snapshot (sem tocar no lake)

Requer: pip install 'pymongo<4'. Credenciais do lake: padrão usr_<BASE>:usr_<BASE>.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple  # 3.6: sem list[...] / X | None

# Classificador de OBJETO (sinal B) — fonte única da semente, no mesmo diretório.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from calibrar_compras_inovacao import classify_objeto  # noqa: E402


def env(key, default=""):
    v = os.environ.get(key)
    return v if v not in (None, "") else default


def load_dotenv():
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
SNAPSHOT = DATA_DIR / "compras_publicas_inovacao_lake_pb.json"
SEED_FILE = SEED_DIR / "indicador-compras-publicas-inovacao.mongodb.js"
LAKE_HOST = "10.19.4.174"

INDICATOR_ID = "compras-publicas-inovacao"
AGENDA = "inovacao"
ORDER = 4                       # 4ª posição na agenda inovacao (ver catalog.ts)
LABEL = "Valor das compras públicas de inovação nos pequenos negócios (R$/ano)"
DESCRIPTION = (
    "Valor (R$) dos contratos da esfera municipal firmados, no ano, com pequenos negócios "
    "(ME/EPP, MEI incluso) em compras de inovação. 'Inovação' = união de dois sinais no data "
    "lake do Sebrae: CNAE do fornecedor em setores intensivos em conhecimento (TIC/criativa/"
    "P&D, cesta de trabalhadores-tic) OU objeto do contrato classificado como inovação "
    "(software, P&D, plataforma, IoT…). Porte e CNAE vêm da Receita Federal; os contratos, do "
    "PNCP. É um NÍVEL (não crescimento): a variação a.a. ainda reflete a adesão crescente dos "
    "municípios ao PNCP, não a política de inovação — por isso reportamos o valor do ano."
)
SOURCE = (
    "PNCP (Lei 14.133/2021) × Receita Federal (RF_EMPRESAS/RF_SIMPLES/RF_ESTABELECIMENTOS) — "
    "ambos via data lake do Sebrae. Contrato municipal × porte e CNAE do fornecedor. "
    "Inovação = CNAE TIC/criativa/P&D ∪ objeto classificado. Pequeno = ME/EPP/MEI"
)
SOURCE_DATASET = "sebrae_pncp_x_rfb_inovacao"

ESFERA_MUNICIPAL = "M"
CONF_BAIXA_VALOR = 100_000.0    # total de contratos municipais (PJ) < R$100k → cobertura fraca

# --- CNAE de inovação (divisões 2.0; 2 primeiros dígitos do CNAE_FISCAL) -------------------
# Mesma cesta de trabalhadores-tic: TIC + economia criativa + P&D. NÃO inclui div 71.
INOV_DIVS = {"26", "61", "62", "63",          # TIC
             "58", "59", "60", "73", "74", "90", "91",  # criativa
             "72"}                             # P&D

# --- campos da coleção PNCP CONTRATOS (calibrados no mpe-compras, jun/2026) ----------------
CAMPO_IBGE = env("PNCP_CAMPO_IBGE", "UNIDADE_ORGAO.CODIGO_IBGE")
CAMPO_ESFERA = env("PNCP_CAMPO_ESFERA", "ORGAO_ENTIDADE.ESFERA_ID")
CAMPO_NI = env("PNCP_CAMPO_NI", "NI_FORNECEDOR")
CAMPO_TIPO_PESSOA = env("PNCP_CAMPO_TIPO_PESSOA", "TIPO_PESSOA")
CAMPO_PAIS = env("PNCP_CAMPO_PAIS", "CODIGO_PAIS_FORNECEDOR")
CAMPO_VALOR = env("PNCP_CAMPO_VALOR", "VALOR_GLOBAL")
CAMPO_DATA = env("PNCP_CAMPO_DATA", "ANO_CONTRATO")
CAMPO_OBJETO = env("PNCP_CAMPO_OBJETO", "OBJETO_CONTRATO")
TIPO_PJ_VALORES = ("PJ", "J", "Pessoa Jurídica", "PESSOA JURIDICA")
PAIS_NACIONAL = ("BRA", "BR", "1058", None, "")

# --- campos da Receita Federal no lake -----------------------------------------------------
RFB_CAMPO_CNPJ = env("RFB_CAMPO_CNPJ", "CNPJ_BASICO")
RFB_CAMPO_PORTE = env("RFB_CAMPO_PORTE", "PORTE_EMPRESA")
RFB_CNPJ_TIPO = env("RFB_CNPJ_TIPO", "int")
RFB_CAMPO_MEI = env("RFB_CAMPO_MEI", "OPCAO_MEI")
MEI_SIM = ("S", "SIM", "1", "TRUE", "T")
# RF_ESTABELECIMENTOS: CNAE + matriz/filial. NOMES A CONFIRMAR via --inspect-estab.
ESTAB_CAMPO_CNPJ = env("ESTAB_CAMPO_CNPJ", "CNPJ_BASICO")
ESTAB_CAMPO_CNAE = env("ESTAB_CAMPO_CNAE", "CNAE_FISCAL_PRINCIPAL")
ESTAB_CAMPO_MATRIZ = env("ESTAB_CAMPO_MATRIZ", "IDENTIFICADOR_MATRIZ_FILIAL")  # '1'=matriz


# ============================================================================
# 1) ORIGEM: agrega o PNCP no lake (grão: município × fornecedor × objeto)
# ============================================================================

def _field(path):
    return "$" + path


def _ni_str():
    return {"$convert": {"input": _field(CAMPO_NI), "to": "string", "onError": "", "onNull": ""}}


def _valor_num():
    return {"$convert": {"input": _field(CAMPO_VALOR), "to": "double", "onError": 0.0, "onNull": 0.0}}


def _ibge_str():
    return {"$convert": {"input": _field(CAMPO_IBGE), "to": "string", "onError": "", "onNull": ""}}


def _build_match(ano, com_esfera, com_ano):
    """PB (IBGE ^25) + ano + esfera M + só PJ nacional. Match PLANO (usa índice se houver)."""
    m = {CAMPO_IBGE: {"$regex": "^25"},
         CAMPO_TIPO_PESSOA: {"$in": list(TIPO_PJ_VALORES)},
         CAMPO_PAIS: {"$in": list(PAIS_NACIONAL)}}
    if com_ano:
        m[CAMPO_DATA] = ano
    if com_esfera:
        m[CAMPO_ESFERA] = ESFERA_MUNICIPAL
    return m


def _pipeline(ano, com_esfera, com_ano):
    """Reduz a 1 linha por (município × fornecedor-base × objeto). Objeto entra na chave
    porque a classificação de inovação (sinal B) é por contrato; renovações idênticas
    (mesmo fornecedor + mesmo objeto) colapsam e somam valor."""
    ibge6 = {"$substr": [_ibge_str(), 0, 6]}
    cnpj8 = {"$substr": [_ni_str(), 0, 8]}
    objeto = {"$convert": {"input": _field(CAMPO_OBJETO), "to": "string", "onError": "", "onNull": ""}}
    return [
        {"$match": _build_match(ano, com_esfera, com_ano)},
        {"$group": {
            "_id": {"ibge": ibge6, "cnpj8": cnpj8, "objeto": objeto},
            "valor": {"$sum": _valor_num()},
            "n": {"$sum": 1},
        }},
        {"$project": {"_id": 0, "ibge": "$_id.ibge", "cnpj8": "$_id.cnpj8",
                      "objeto": "$_id.objeto", "valor": {"$round": ["$valor", 2]}, "n": 1}},
    ]


def _connect(args, db_name, user, pwd, coll_name):
    from pymongo import MongoClient
    client = MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=user or None, password=pwd or None,
        authSource=args.auth_db or db_name, serverSelectionTimeoutMS=15000,
    )
    return client[db_name][coll_name]


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
    except Exception:  # noqa: BLE001
        pass
    return False


def harvest_pncp(args, ano):
    """Linhas (município × fornecedor × objeto) dos contratos municipais PJ da PB, no ano."""
    coll = _connect(args, args.mongo_db, args.mongo_user, args.mongo_pass,
                    "CONTRATOS_" + str(ano))
    com_esfera = not args.sem_esfera
    com_ano = not args.sem_ano
    print("[lake/PNCP] agregando CONTRATOS_{} (esfera={}, PJ nacional)…".format(
        ano, "M" if com_esfera else "todas"), file=sys.stderr)
    rows = []
    for r in coll.aggregate(_pipeline(ano, com_esfera, com_ano), allowDiskUse=True):
        rows.append({"ibge": r["ibge"], "cnpj8": r.get("cnpj8") or "",
                     "objeto": r.get("objeto") or "", "valor": float(r["valor"]), "n": int(r["n"])})
    print("[lake/PNCP] {}: {} linhas (município × fornecedor × objeto).".format(ano, len(rows)),
          file=sys.stderr)
    return rows


# ============================================================================
# 2) PORTE + CNAE: resolve na Receita Federal (mesmo lake)
# ============================================================================

def _norm_porte(v):
    if v is None:
        return None
    s = str(v).strip().lstrip("0")
    return s if s else "0"


def _cast_cnpj(c):
    return int(c) if RFB_CNPJ_TIPO == "int" else c


def _lookup_rfb(coll, cnpj_field, wanted, projection, force_scan):
    """Itera (cnpj8, doc) do RF p/ os CNPJs em `wanted`. Índice → $in em lotes; senão varredura."""
    if force_scan or not _has_index_on(coll, cnpj_field):
        print("  [rf] {} sem índice em {!r} → varredura única…".format(coll.name, cnpj_field),
              file=sys.stderr)
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


def porte_por_cnpj(cnpjs8, emp, simples, force_scan):
    """{cnpj8 -> {porte, mei}}. Porte de RF_EMPRESAS; MEI de RF_SIMPLES."""
    out = {}
    wanted = set(cnpjs8)
    for cb, d in _lookup_rfb(emp, RFB_CAMPO_CNPJ, wanted,
                             {RFB_CAMPO_CNPJ: 1, RFB_CAMPO_PORTE: 1, "_id": 0}, force_scan):
        out[cb] = {"porte": _norm_porte(d.get(RFB_CAMPO_PORTE)), "mei": False}
    print("  [rf] porte resolvido p/ {}/{} CNPJs".format(len(out), len(wanted)), file=sys.stderr)
    if simples is not None:
        nmei = 0
        for cb, d in _lookup_rfb(simples, RFB_CAMPO_CNPJ, wanted,
                                 {RFB_CAMPO_CNPJ: 1, RFB_CAMPO_MEI: 1, "_id": 0}, force_scan):
            if cb in out and str(d.get(RFB_CAMPO_MEI)).strip().upper() in MEI_SIM:
                out[cb]["mei"] = True
                nmei += 1
        print("  [rf] MEI marcado em {} CNPJs".format(nmei), file=sys.stderr)
    return out


def cnae_por_cnpj(cnpjs8, estab_sources, force_scan):
    """{cnpj8 -> divisão CNAE (2 díg)} + {cnpj8 -> label da fonte}. `estab_sources` é uma
    lista ORDENADA de (label, coleção): resolve do 1º (o ano do contrato) e os CNPJs que
    sobrarem caem para o próximo (RF_ESTABELECIMENTOS de ano adjacente — CNAE é atributo
    estável, então o ano vizinho serve quando a carga do ano está incompleta). Prefere o
    estabelecimento MATRIZ; senão o 1º com CNAE."""
    out = {}   # cnpj8 -> div
    via = {}   # cnpj8 -> label
    wanted = set(cnpjs8)
    proj = {ESTAB_CAMPO_CNPJ: 1, ESTAB_CAMPO_CNAE: 1, ESTAB_CAMPO_MATRIZ: 1, "_id": 0}
    for label, coll in estab_sources:
        falta = wanted - set(out)
        if not falta:
            break
        chosen = {}  # cnpj8 -> (is_matriz_bool, div)
        for cb, d in _lookup_rfb(coll, ESTAB_CAMPO_CNPJ, falta, proj, force_scan):
            cnae = d.get(ESTAB_CAMPO_CNAE)
            if cnae in (None, ""):
                continue
            div = str(cnae).zfill(7)[:2]
            is_matriz = str(d.get(ESTAB_CAMPO_MATRIZ)).strip() == "1"
            prev = chosen.get(cb)
            if prev is None or (is_matriz and not prev[0]):
                chosen[cb] = (is_matriz, div)
        for cb, v in chosen.items():
            out[cb] = v[1]
            via[cb] = label
        print("  [rf] CNAE via {}: +{} (acumulado {}/{})".format(
            label, len(chosen), len(out), len(wanted)), file=sys.stderr)
    return out, via


# ============================================================================
# 3) Classificação + agregação por município (por ano) + crescimento
# ============================================================================

def classify_row(row, porte_map, cnae_map):
    """Retorna (pequeno, inovacao, via) p/ uma linha. via in {ambos, cnae, objeto, nenhum}."""
    info = porte_map.get(row["cnpj8"])
    pequeno = bool(info) and (info.get("porte") in ("1", "3"))
    cnae_div = cnae_map.get(row["cnpj8"])
    sinal_a = cnae_div in INOV_DIVS
    sinal_b = classify_objeto(row["objeto"]).get("inovacao", False)
    if sinal_a and sinal_b:
        via = "ambos"
    elif sinal_a:
        via = "cnae"
    elif sinal_b:
        via = "objeto"
    else:
        via = "nenhum"
    return pequeno, (sinal_a or sinal_b), via


def aggregate_year(rows, porte_map, cnae_map, code6):
    """{code7 -> {valorInovPeq, valorPeq, valorPJ, nInov, nInovAmbos, nInovCnae, nInovObjeto,
    fornecedoresInov(set)}}. Só PJ com porte resolvido entram em valorPJ (denominador)."""
    agg = {}
    fora = set()
    for r in rows:
        code = code6.get(r["ibge"])
        if not code:
            fora.add(r["ibge"])
            continue
        v = float(r["valor"])
        if v <= 0:
            continue
        a = agg.setdefault(code, {"valorInovPeq": 0.0, "valorPeq": 0.0, "valorPJ": 0.0,
                                  "nInov": 0, "nInovAmbos": 0, "nInovCnae": 0, "nInovObjeto": 0,
                                  "valorAmbos": 0.0, "valorCnae": 0.0, "valorObjeto": 0.0,
                                  "fornecedoresInov": set()})
        info = porte_map.get(r["cnpj8"])
        if not info:
            continue  # porte não resolvido → fora do denominador (como no mpe-compras)
        a["valorPJ"] += v
        pequeno, inov, via = classify_row(r, porte_map, cnae_map)
        if pequeno:
            a["valorPeq"] += v
            if inov:
                a["valorInovPeq"] += v
                a["nInov"] += r["n"]
                a["fornecedoresInov"].add(r["cnpj8"])
                if via == "ambos":
                    a["nInovAmbos"] += r["n"]
                    a["valorAmbos"] += v
                elif via == "cnae":
                    a["nInovCnae"] += r["n"]
                    a["valorCnae"] += v
                else:
                    a["nInovObjeto"] += r["n"]
                    a["valorObjeto"] += v
    return agg, fora


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(codes)))
    return codes


def fmt_reais(v):
    """Formata R$ compacto p/ rawValue (numericValue carrega o número preciso)."""
    if v >= 1e6:
        return ("R$ {:.2f} mi".format(v / 1e6)).replace(".", ",")
    if v >= 1e3:
        return "R$ {:.0f} mil".format(v / 1e3)
    return "R$ {:.0f}".format(v)


def build_values(snapshot):
    """Métrica de NÍVEL: valorInovPeq (R$) por município no ano-ref. numericValue = R$;
    null só onde o município não tem contrato municipal no PNCP (cobertura), 0 onde tem
    contrato mas nenhuma compra de inovação. snapshot['municipios'] = agg-por-município."""
    ref = snapshot["refYear"]
    codes = municipios_canonicos()
    muni = snapshot["municipios"]

    valores = []
    pb = {"valorInov": 0.0, "valorPJ": 0.0, "vAmbos": 0.0, "vCnae": 0.0, "vObjeto": 0.0,
          "comInov": 0, "comContratos": 0}
    for code in codes:
        a = muni.get(code) or {}
        v = float(a.get("valorInovPeq") or 0.0)
        pj = float(a.get("valorPJ") or 0.0)
        pb["valorInov"] += v
        pb["valorPJ"] += pj
        pb["vAmbos"] += float(a.get("valorAmbos") or 0.0)
        pb["vCnae"] += float(a.get("valorCnae") or 0.0)
        pb["vObjeto"] += float(a.get("valorObjeto") or 0.0)
        common_bd = {
            "refYear": ref,
            "valorInovPeq": round(v, 2), "valorPeq": round(float(a.get("valorPeq") or 0.0), 2),
            "valorPJ": round(pj, 2),
            "shareInovPct": round(v / pj * 100.0, 2) if pj else None,
            "nContratosInov": int(a.get("nInov") or 0),
            "porSinal": {"ambos": int(a.get("nInovAmbos") or 0),
                         "cnae": int(a.get("nInovCnae") or 0),
                         "objeto": int(a.get("nInovObjeto") or 0)},
            "valorPorSinal": {"ambos": round(float(a.get("valorAmbos") or 0.0), 2),
                              "cnae": round(float(a.get("valorCnae") or 0.0), 2),
                              "objeto": round(float(a.get("valorObjeto") or 0.0), 2)},
            "nFornecedoresInov": int(a.get("nFornecedoresInov") or 0),
            "escopo": "esfera municipal (ESFERA_ID='M'), pequeno negócio (ME/EPP/MEI)",
            "fonte": "lake",
        }
        if pj <= 0:  # município sem contrato municipal a PJ no PNCP → cobertura, não 0 real
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ref),
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(common_bd, semContratosMunicipais=True),
            })
            continue
        pb["comContratos"] += 1
        if v > 0:
            pb["comInov"] += 1
        conf = "baixa" if pj < CONF_BAIXA_VALOR else "normal"
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": fmt_reais(v), "numericValue": round(v, 2), "referenceYear": str(ref),
            "source": SOURCE, "isFictional": False,
            "breakdown": dict(common_bd, confiabilidade=conf),
        })
    return valores, {"refYear": ref, "pb": pb}


# ============================================================================
# 4) inspect / emit / write-mongo
# ============================================================================

def _coll_meta(coll, campos):
    try:
        print("  ~{:,} documentos (estimado)".format(coll.estimated_document_count()))
    except Exception as e:  # noqa: BLE001
        print("  (não consegui contar: {})".format(e))
    for campo in campos:
        print("    índice em {!r}? {}".format(campo, "SIM" if _has_index_on(coll, campo)
              else "NÃO ← join/scan lento sem índice"))


def _inspect_pncp(args, ano):
    coll = _connect(args, args.mongo_db, args.mongo_user, args.mongo_pass, "CONTRATOS_" + str(ano))
    s = coll.find_one()
    print("\n=== PNCP CONTRATOS_{}: 1 doc (chaves de 1º nível) ===".format(ano))
    for k, v in (s or {}).items():
        vs = repr(v)
        print("  {!r}: {}".format(k, vs[:77] + "…" if len(vs) > 80 else vs))
    print("\n=== campos configurados ===")
    for nome, campo in [("ibge", CAMPO_IBGE), ("esfera", CAMPO_ESFERA), ("ni", CAMPO_NI),
                        ("tipoPessoa", CAMPO_TIPO_PESSOA), ("pais", CAMPO_PAIS),
                        ("valor", CAMPO_VALOR), ("ano", CAMPO_DATA), ("objeto", CAMPO_OBJETO)]:
        ok, val = _dig(s or {}, campo)
        print("  {:12s} -> {!r:32s} {}".format(nome, campo,
              "OK = {}".format(repr(val)[:50]) if ok else "NÃO ENCONTRADO"))
    _coll_meta(coll, [CAMPO_IBGE, CAMPO_DATA])


def _inspect_rfb(args, ano):
    emp = _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass, "RF_EMPRESAS_" + str(ano))
    simples = _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass, "RF_SIMPLES_" + str(ano))
    print("\n=== RF_EMPRESAS_{} ===".format(ano))
    _coll_meta(emp, [RFB_CAMPO_CNPJ])
    s = emp.find_one({RFB_CAMPO_PORTE: {"$nin": ["foo", "", None]}}) or emp.find_one()
    print("  doc real: {}".format({k: s.get(k) for k in (RFB_CAMPO_CNPJ, RFB_CAMPO_PORTE)} if s else None))
    print("\n=== RF_SIMPLES_{} (campo MEI) ===".format(ano))
    _coll_meta(simples, [RFB_CAMPO_CNPJ])
    ss = simples.find_one() or {}
    print("  chaves: {}".format(list(ss.keys())))
    print("  campo MEI {!r}: {!r}".format(RFB_CAMPO_MEI, ss.get(RFB_CAMPO_MEI)))


def _inspect_estab(args, ano):
    estab = _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass, "RF_ESTABELECIMENTOS_" + str(ano))
    print("\n=== RF_ESTABELECIMENTOS_{}: tamanho + índices ===".format(ano))
    _coll_meta(estab, [ESTAB_CAMPO_CNPJ])
    # pula o doc-stub ('foo'/CNPJ_BASICO=1) p/ ver um CNAE REAL e seu tipo (int? string 7-díg?)
    s = estab.find_one({ESTAB_CAMPO_CNAE: {"$nin": ["foo", "", None]}}) or estab.find_one() or {}
    print("\n=== 1 doc REAL — procure a chave de CNAE e a de matriz/filial ===")
    for k, v in s.items():
        print("  {!r}: {!r}".format(k, v))
    print("\n=== campos configurados (ajuste ESTAB_CAMPO_* se não casar) ===")
    for nome, campo in [("cnpj", ESTAB_CAMPO_CNPJ), ("cnae", ESTAB_CAMPO_CNAE),
                        ("matriz", ESTAB_CAMPO_MATRIZ)]:
        ok, val = _dig(s, campo)
        print("  {:8s} -> {!r:28s} {}".format(nome, campo,
              "OK = {!r}".format(val) if ok else "NÃO ENCONTRADO"))


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_compras_publicas_inovacao_lake.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(ref):
    return {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: valor absoluto (R$), sem faixa oficial (não inventamos cortes).
        "referenceYear": str(ref),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "agenda", "agendaId": AGENDA, "order": ORDER}],
    }


def emit(values, ref):
    indicator = build_indicator(ref)
    lines = [HEADER, ""]
    lines.append("// --- 1) Catálogo: {} (agenda {}) ---".format(INDICATOR_ID, AGENDA))
    lines.append("// Valor (R$/ano) das compras de inovação a pequenos negócios — NÍVEL, não crescimento.")
    lines.append("// PNCP × Receita Federal (porte + CNAE) — data lake do Sebrae. SEM threshold.")
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


def process_year(args, ano, code6, fallback_anos):
    """Harvest + resolve porte/CNAE + agrega por município. Devolve {code7: agg-serializável}.
    fallback_anos: anos cujo RF_ESTABELECIMENTOS serve de reserva p/ CNAE não resolvido no ano
    (carga parcial do estab → cai para o ano adjacente; CNAE é estável)."""
    rows = harvest_pncp(args, ano)
    cnpjs8 = sorted({r["cnpj8"] for r in rows if r["cnpj8"]})
    print("[lake/RF {}] resolvendo porte e CNAE de {} CNPJs…".format(ano, len(cnpjs8)), file=sys.stderr)
    emp = _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass, "RF_EMPRESAS_" + str(ano))
    simples = _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass, "RF_SIMPLES_" + str(ano))
    estab_sources = [("RF_ESTABELECIMENTOS_" + str(ano),
                      _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass,
                               "RF_ESTABELECIMENTOS_" + str(ano)))]
    for fy in fallback_anos:
        estab_sources.append(("RF_ESTABELECIMENTOS_" + str(fy) + " (fallback)",
                              _connect(args, args.rfb_db, args.rfb_user, args.rfb_pass,
                                       "RF_ESTABELECIMENTOS_" + str(fy))))
    porte_map = porte_por_cnpj(cnpjs8, emp, simples, args.rfb_scan) if cnpjs8 else {}
    cnae_map, cnae_via = cnae_por_cnpj(cnpjs8, estab_sources, args.rfb_scan) if cnpjs8 else ({}, {})
    n_fb = sum(1 for cb in cnae_via if "fallback" in cnae_via[cb])
    if n_fb:
        print("[{}] CNAE de {} CNPJs veio de ano adjacente (carga parcial do estab {}).".format(
            ano, n_fb, ano), file=sys.stderr)
    agg, fora = aggregate_year(rows, porte_map, cnae_map, code6)
    if fora:
        sys.exit("Códigos de município (6-dig) fora dos 223 da PB: " + ", ".join(sorted(fora))[:300])
    # set -> contagem (serializável no snapshot)
    out = {}
    for code, a in agg.items():
        out[code] = dict(a, nFornecedoresInov=len(a["fornecedoresInov"]))
        out[code].pop("fornecedoresInov", None)
    n_inov = sum(1 for a in out.values() if a["valorInovPeq"] > 0)
    print("[{}] {} municípios com compra de inovação a pequeno negócio.".format(ano, n_inov),
          file=sys.stderr)
    return out


def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Seed de {} via lake (PNCP × RF, valor R$/ano).".format(INDICATOR_ID))
    ap.add_argument("--inspect", action="store_true")
    ap.add_argument("--inspect-rfb", action="store_true")
    ap.add_argument("--inspect-estab", action="store_true")
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--ano", type=int, default=datetime.now().year - 1, help="refYear (último ano completo); compara com refYear-1")
    ap.add_argument("--sem-esfera", action="store_true")
    ap.add_argument("--sem-ano", action="store_true")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    ap.add_argument("--mongo-host", default=env("PNCP_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("PNCP_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("PNCP_MONGO_DB", "PNCP"))
    ap.add_argument("--mongo-user", default=env("PNCP_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("PNCP_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("PNCP_AUTH_DB", "admin"))
    ap.add_argument("--rfb-db", default=env("RFB_MONGO_DB", "RECEITA_FEDERAL"))
    ap.add_argument("--rfb-user", default=env("RFB_MONGO_USER", ""))
    ap.add_argument("--rfb-pass", default=env("RFB_MONGO_PASS", ""))
    ap.add_argument("--rfb-scan", action="store_true")
    ap.add_argument("--cnae-fallback-anos", default=env("CNAE_FALLBACK_ANOS", ""),
                    help="anos extras (CSV) de RF_ESTABELECIMENTOS p/ reserva de CNAE, além do "
                         "outro ano da rodada. Ex.: '2023' se 2024 e 2025 vierem parciais.")
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
    args.rfb_user = args.rfb_user or ("usr_" + args.rfb_db)
    args.rfb_pass = args.rfb_pass or ("usr_" + args.rfb_db)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)

    if args.inspect:
        return _inspect_pncp(args, args.ano)
    if args.inspect_rfb:
        return _inspect_rfb(args, args.ano)
    if args.inspect_estab:
        return _inspect_estab(args, args.ano)

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — refYear {}, {} municípios.".format(
            snapshot.get("fetchedAt"), snapshot["refYear"], len(snapshot.get("municipios") or {})),
            file=sys.stderr)
    else:
        ref = args.ano
        codes = municipios_canonicos()
        code6 = {c[:6]: c for c in codes}
        extra_fb = [int(x) for x in args.cnae_fallback_anos.split(",") if x.strip()]
        # Métrica de NÍVEL → harvest só do ano-ref. O ano anterior entra apenas como
        # RESERVA de CNAE (o estab do ano costuma vir parcial; CNAE é atributo estável).
        fallback = [ref - 1] + [y for y in extra_fb if y != ref]
        municipios = process_year(args, ref, code6, fallback)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "refYear": ref, "fonte": "lake",
            "inovDivs": sorted(INOV_DIVS),
            "municipios": municipios,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print("[lake] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    values, meta = build_values(snapshot)
    out = emit(values, meta["refYear"])
    pb = meta["pb"]
    ref = meta["refYear"]
    com = [v for v in values if v["numericValue"] is not None]
    com_inov = [v for v in com if v["numericValue"] > 0]
    vinov = pb["valorInov"] or 1.0
    share = 100 * pb["valorInov"] / (pb["valorPJ"] or 1)
    print("{} (NÍVEL R$, ano {}): {}/223 municípios com contrato municipal no PNCP; "
          "{} com compra de inovação a pequeno negócio.".format(
              INDICATOR_ID, ref, len(com), len(com_inov)))
    print("Total PB: inovação a pequeno negócio R$ {:,.0f} de R$ {:,.0f} a PJ (share {:.2f}%).".format(
        pb["valorInov"], pb["valorPJ"], share))
    print("Split do valor de inovação por sinal: ambos {:.0f}% · só CNAE {:.0f}% · só objeto {:.0f}%.".format(
        100 * pb["vAmbos"] / vinov, 100 * pb["vCnae"] / vinov, 100 * pb["vObjeto"] / vinov))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, build_indicator(meta["refYear"]), values)


if __name__ == "__main__":
    main()
