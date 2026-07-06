#!/usr/bin/env python3
"""
Gera os seeds (mongosh) de DOIS indicadores da agenda "Simplificação e digitalização"
da OPP — `tempo-viabilidade` e `tempo-abertura` — direto do **data lake do Sebrae**
(base `REDESIM`), e NÃO da API pública `estatistica.redesim.gov.br`.

É a versão "lake" dos geradores gerar_seed_tempo_viabilidade.py / _abertura.py: mesma
metodologia (marco de 75% em horas úteis, faixas oficiais), mesma forma de seed, só
muda a ORIGEM. Caminho autocontido (fluxo lake->OPP, igual à escolaridade): a agregação
roda na origem e NÃO cruza fonte externa em runtime (sem cross-check via API).

------------------------------------------------------------------------------
FONTE: Mongo do lake do Sebrae (10.19.4.174:27018, usuário `usr_REDESIM`, authSource
`admin`), base `REDESIM`, uma coleção por ano: `BRASIL_<ano>` (1 doc = 1 solicitação
de abertura — o MESMO microdado que vira o XLSX da API). Confirmado via
inspecionar_redesim_lake.py (jun/2026):

    QTDE_HH_VIABILIDADE_TOTAL  (float, horas úteis)  -> etapa de viabilidade
    QTDE_HH_LIBERACAO_DBE      (float, horas úteis)  -> validação cadastral
    QTDE_HORAS_DEFERIMENTO     (float, horas úteis)  -> registro/inscrição no CNPJ
    MUNICIPIO                  (str, NOME maiúsculo sem acento, ex. 'CAMPINA GRANDE')
    UF                         (str, 'PB')           ANO (int)   MES (int)

  tempo-viabilidade = P75( VIABILIDADE_TOTAL )                       por município
  tempo-abertura    = P75( VIABILIDADE_TOTAL + LIBERACAO_DBE + DEFERIMENTO )

MUNICIPIO é NOME (não IBGE) -> casa por slug com o seed de municípios (3 aliases de
municípios renomeados, idênticos aos geradores da API).

------------------------------------------------------------------------------
METODOLOGIA (idêntica à dos geradores da API, validada lá contra os agregados oficiais):
  - numericValue = marco de 75% = P75 do tempo (horas úteis) do município.
  - Faixas oficiais (1 dia = 24h úteis): 🟢 ≤72h · 🟡 72–120h · 🟠 120–168h · 🔴 >168h.
  - threshold (4 faixas -> semáforo de 3 da OPP): lower-better, success=72, warning=168.
  - n<30 => confiabilidade "baixa"; sem solicitação no ano => numericValue null.

> P75 reimplementado à mão (host do ETL é Python 3.6 — sem statistics.quantiles, que é
> 3.8+). Usa a MESMA fórmula 'inclusive' do CPython p/ casar com os seeds da API.

------------------------------------------------------------------------------
Uso (na 10.1.141.23, que enxerga o lake — ou via --ssh-host):

  # host do lake (10.19.4.174), base REDESIM, user/pass usr_REDESIM e coleção BRASIL_2025
  # são os DEFAULTS — não precisa passar nada. Para --write-mongo, preencha OPP_* no .env.

  # calibrar (1 doc + cobertura)
  python3 database/scripts/gerar_seed_tempo_abertura_lake.py --inspect

  # rodar: agrega na origem, salva snapshot, emite os 2 seeds (e grava no OPP)
  python3 database/scripts/gerar_seed_tempo_abertura_lake.py --write-mongo

  # offline: regenera os 2 seeds do snapshot salvo, sem reconsultar o lake
  python3 database/scripts/gerar_seed_tempo_abertura_lake.py --offline

  # sobrescrever algo pontual (outra base/credencial/coleção):
  #   --mongo-user … --mongo-pass … --collection BRASIL_2024 --ssh-host …

Requer:  pip install 'pymongo<4'   (e sshtunnel, se o script for abrir o túnel)
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Tuple  # 3.6-safe: sem PEP585/604

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "redesim_tempos_lake_pb.json"

# Lake do Sebrae: mesmo IP para conexão direta (da 10.1.141.23) e para o remote_bind
# do túnel SSH. Cada base tem credencial no padrão usr_<BASE>:usr_<BASE> (authSource admin).
LAKE_HOST = "10.19.4.174"


def env(key, default=""):
    """os.environ.get que trata variável presente-porém-VAZIA como ausente.

    O .env modelo (database/.env.example) deixa chaves em branco; ao dar `source`
    elas viram '' no ambiente — e os.environ.get('X', default) só usa o default
    quando a chave NÃO existe, devolvendo '' quando ela existe vazia. Isso fazia
    int('') estourar nas portas e host/authSource virarem '' (conexão quebrada).
    Aqui, '' (e None) caem no default.
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


# --- campos na coleção crua do lake (confirmados via inspecionar_redesim_lake.py) ---
CAMPO_MUNICIPIO = env("REDESIM_CAMPO_MUNICIPIO", "MUNICIPIO")
CAMPO_UF = env("REDESIM_CAMPO_UF", "UF")
CAMPO_VIABILIDADE = env("REDESIM_CAMPO_VIABILIDADE", "QTDE_HH_VIABILIDADE_TOTAL")
CAMPO_LIBERACAO_DBE = env("REDESIM_CAMPO_DBE", "QTDE_HH_LIBERACAO_DBE")
CAMPO_DEFERIMENTO = env("REDESIM_CAMPO_DEFERIMENTO", "QTDE_HORAS_DEFERIMENTO")

UF = "PB"
SOURCE_BASE = "Redesim — microdados de solicitações de abertura (data lake do Sebrae, base REDESIM)"
SOURCE_DATASET = "sebrae_redesim"

# Municípios da PB renomeados (nome na base -> slug do seed). Idêntico aos geradores da API.
ALIAS_SLUG = {
    "joca-claudino": "santarem",            # 2513653
    "sao-vicente-do-serido": "serido",      # 2515401
    "tacima": "campo-de-santana",           # 2516409
}

# Faixas oficiais em horas úteis (1 dia = 24h úteis).
BANDA_VERDE = 72     # ≤ 3 dias
BANDA_AMARELO = 120  # 3–5 dias
BANDA_LARANJA = 168  # 5–7 dias  (>168h => 🔴 mais de 7 dias)
FAIXA_LABEL = {
    0: "Bom (até 3 dias)",
    1: "Atenção (3 a 5 dias)",
    2: "Atenção (5 a 7 dias)",
    3: "Crítico (mais de 7 dias)",
}
N_CONFIAVEL = 30

# --- identidade dos dois indicadores (espelha os geradores da API + catalog.ts) ------
IND_VIAB = {
    "id": "tempo-viabilidade",
    "order": 1,
    "label": "Tempo de viabilidade da empresa — marco 75% (h)",
    "metric": "viab",
    "description": (
        "Tempo da etapa de viabilidade (pesquisa prévia de nome e endereço), em horas úteis, "
        "no marco de 75% dos processos (metodologia oficial da Redesim)."
    ),
}
IND_ABERTURA = {
    "id": "tempo-abertura",
    "order": 2,
    "label": "Tempo de abertura da empresa — marco 75% (h)",
    "metric": "abertura",
    "description": (
        "Tempo total de abertura da empresa (viabilidade + validação cadastral + "
        "registro/inscrição no CNPJ), em horas úteis, no marco de 75% dos processos "
        "(metodologia oficial da Redesim). Não inclui licenças nem alvará de funcionamento."
    ),
}
INDICADORES = (IND_VIAB, IND_ABERTURA)
AGENDA_ID = "simplificacao"


# ---------- util ----------

def slugify(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()


def br_num(value, casas=1):
    return ("%.*f" % (casas, value)).replace(".", ",")


def num(v):
    """Lê uma grandeza de horas como float; ausente/não-numérico vira 0.0 (igual à API)."""
    return float(v) if isinstance(v, (int, float)) else 0.0


def p75(xs):
    """Percentil 75 (marco de 75%) — quartil superior, método 'inclusive' do CPython.
    Reimplementado à mão p/ rodar no Python 3.6 do host (sem statistics.quantiles) e
    casar bit-a-bit com statistics.quantiles(sorted(xs), n=4, method='inclusive')[2]."""
    s = sorted(xs)
    ld = len(s)
    if ld == 1:
        return float(s[0])
    m = 4               # n=4 (quartis)
    i = 3               # 3º ponto de corte = P75
    j, delta = divmod(i * (ld - 1), m)
    if j + 1 < ld:
        return (s[j] * (m - delta) + s[j + 1] * delta) / m
    return float(s[j])  # j == ld-1 => delta == 0


def faixa_de(horas):
    if horas <= BANDA_VERDE:
        return 0
    if horas <= BANDA_AMARELO:
        return 1
    if horas <= BANDA_LARANJA:
        return 2
    return 3


# ---------- cobertura: os 223 municípios da PB (slug -> IBGE) ----------

def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    # robusto a campos extras após o slug (ex.: rfCode): casa _id e slug no mesmo
    # objeto sem depender da chave de fechamento ([^}] não cruza a borda do doc).
    pares = re.findall(r'"_id":\s*"(\d{7})"[^}]*?"slug":\s*"([^"]*)"', text)
    if not pares:
        sys.exit("Não consegui ler os municípios de %s." % MUNICIPIOS_SEED)
    codes = sorted({c for c, _ in pares})
    slug2ibge = {s: c for c, s in pares}
    return codes, slug2ibge


# ---------- ORIGEM: lê o lake e agrega por município ----------

def conectar(args):
    from pymongo import MongoClient
    tunnel = None
    host, port = args.mongo_host, args.mongo_port
    if args.ssh_host:
        from sshtunnel import SSHTunnelForwarder
        tunnel = SSHTunnelForwarder(
            (args.ssh_host, args.ssh_port),
            ssh_username=args.ssh_user, ssh_pkey=args.ssh_key or None,
            ssh_password=args.ssh_password or None,
            remote_bind_address=(args.mongo_host, args.mongo_port),
        )
        tunnel.start()
        host, port = "127.0.0.1", tunnel.local_bind_port
        print("[ssh] tunel aberto -> %s, mongo em 127.0.0.1:%s" % (args.ssh_host, port))
    print("[origem] lake %s:%s db=%s user=%s" % (args.mongo_host, args.mongo_port, args.mongo_db, args.mongo_user))
    client = MongoClient(
        host=host, port=port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db, serverSelectionTimeoutMS=15000,
    )
    return client, tunnel


def _inspect(coll):
    sample = coll.find_one({CAMPO_UF: UF}) or coll.find_one()
    print("\n=== 1 documento de exemplo (UF=%s) ===" % UF)
    if sample:
        for k in sample:
            print("  %-32s = %r" % (k, sample[k]))
    print("\n=== campos exigidos ===")
    for nome, campo in [("município", CAMPO_MUNICIPIO), ("viabilidade", CAMPO_VIABILIDADE),
                        ("liberação DBE", CAMPO_LIBERACAO_DBE), ("deferimento", CAMPO_DEFERIMENTO)]:
        ok = sample and campo in sample
        print("  %-14s -> %r  %s" % (nome, campo, "OK" if ok else "NÃO ENCONTRADO — ajuste a constante"))
    pb = coll.count_documents({CAMPO_UF: UF})
    munis = coll.distinct(CAMPO_MUNICIPIO, {CAMPO_UF: UF})
    print("\n=== cobertura PB ===\n  %s solicitações ; %d municípios distintos (de 223)"
          % (format(pb, ",d"), len(munis)))


def fetch(args):
    """Lê as solicitações da PB do lake e agrega por município. Retorna o snapshot
    (aggregates por IBGE, com viab e abertura). PB é pequena (~8k docs/ano) -> puxa só
    os campos necessários e calcula o P75 client-side (idêntico à metodologia da API)."""
    client, tunnel = conectar(args)
    try:
        coll = client[args.mongo_db][args.collection]
        if args.inspect:
            _inspect(coll)
            sys.exit(0)

        _codes, slug2ibge = municipios_canonicos()
        proj = {"_id": 0, CAMPO_MUNICIPIO: 1, CAMPO_VIABILIDADE: 1,
                CAMPO_LIBERACAO_DBE: 1, CAMPO_DEFERIMENTO: 1}
        print("[origem] lendo %s.%s (UF=%s)…" % (args.mongo_db, args.collection, UF))

        viab_por = defaultdict(list)   # ibge -> [horas de viabilidade]
        abert_por = defaultdict(list)  # ibge -> [horas totais de abertura]
        unmatched = defaultdict(int)
        n_total = 0
        for d in coll.find({CAMPO_UF: UF}, proj):
            n_total += 1
            sl = slugify(d.get(CAMPO_MUNICIPIO))
            sl = ALIAS_SLUG.get(sl, sl)
            ibge = slug2ibge.get(sl)
            if not ibge:
                unmatched[str(d.get(CAMPO_MUNICIPIO))] += 1
                continue
            viab = num(d.get(CAMPO_VIABILIDADE))
            total = viab + num(d.get(CAMPO_LIBERACAO_DBE)) + num(d.get(CAMPO_DEFERIMENTO))
            viab_por[ibge].append(viab)
            abert_por[ibge].append(total)

        if unmatched:
            print("[aviso] municípios não casados (fora dos 223): %s" % dict(unmatched))
        if n_total == 0:
            sys.exit("0 solicitações na PB — confira --collection e os nomes dos campos (--inspect).")

        aggregates = {}
        for ibge in viab_por:
            v, a = viab_por[ibge], abert_por[ibge]
            aggregates[ibge] = {
                "n": len(v),
                "viab": _agg(v),
                "abertura": _agg(a),
            }
        ref_year = _ref_year(args.collection)
        return {
            "indicatorSource": "lake",
            "collection": args.collection,
            "uf": UF,
            "referenceYear": ref_year,
            "totalRegistros": n_total,
            "naoCasados": dict(unmatched),
            "aggregates": aggregates,
        }
    finally:
        if tunnel:
            tunnel.stop()


def _agg(xs):
    import statistics as st  # média/mediana existem no 3.6; só quantiles que não
    marco = p75(xs)
    return {
        "marco75Horas": round(marco, 2),
        "mediaHoras": round(st.mean(xs), 2),
        "medianaHoras": round(st.median(xs), 2),
        "faixa": faixa_de(marco),
    }


def _ref_year(collection):
    m = re.search(r"(\d{4})", collection or "")
    return m.group(1) if m else "2025"


# ---------- DESTINO: cruza com os 223 e emite os seeds ----------

def build_values(snapshot, indicador):
    codes, _ = municipios_canonicos()
    aggr = snapshot["aggregates"]
    ref_year = snapshot["referenceYear"]
    metric = indicador["metric"]
    desc0 = indicador["description"].split(".")[0]
    source = "%s — %s (ano %s)" % (SOURCE_BASE, desc0, ref_year)
    valores = []
    for code in codes:
        a = aggr.get(code)
        if not a:  # sem nenhuma solicitação no ano
            valores.append({
                "municipalityId": code, "indicatorId": indicador["id"],
                "rawValue": "—", "numericValue": None, "referenceYear": ref_year,
                "source": source, "isFictional": False,
                "breakdown": {"n": 0, "confiabilidade": "sem-dados", "anoRef": ref_year},
            })
            continue
        n = a["n"]
        mt = a[metric]
        marco = mt["marco75Horas"]
        valores.append({
            "municipalityId": code, "indicatorId": indicador["id"],
            "rawValue": "%sh" % br_num(marco), "numericValue": marco,
            "referenceYear": ref_year, "source": source, "isFictional": False,
            "breakdown": {
                "n": n,
                "confiabilidade": "alta" if n >= N_CONFIAVEL else "baixa",
                "marco75Horas": marco,
                "marco75Dias": round(marco / 24, 2),
                "mediaHoras": mt["mediaHoras"],
                "medianaHoras": mt["medianaHoras"],
                "faixaOficial": mt["faixa"],
                "faixaLabel": FAIXA_LABEL[mt["faixa"]],
                "anoRef": ref_year,
            },
        })
    return valores


def build_indicator(indicador, ref_year):
    return {
        "_id": indicador["id"],
        "label": indicador["label"],
        "threshold": {"kind": "lower-better", "success": BANDA_VERDE, "warning": BANDA_LARANJA},
        "referenceYear": ref_year,
        "description": indicador["description"],
        "source": SOURCE_BASE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "agenda", "agendaId": AGENDA_ID, "order": indicador["order"]}],
    }


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_tempo_abertura_lake.py — NÃO editar à mão.
// Fonte: data lake do Sebrae (base REDESIM), não a API pública. Idempotente (upsert).
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def emit(indicador, values, ref_year):
    indicator = build_indicator(indicador, ref_year)
    iid = indicador["id"]
    lines = [HEADER, "", "// --- 1) Catálogo: %s (agenda %s) ---" % (indicador["label"], AGENDA_ID)]
    lines.append("// threshold = faixas OFICIAIS da Redesim (🟢≤72h · 🟡🟠 72–168h · 🔴>168h)")
    lines.append("// no semáforo de 3 níveis da OPP. numericValue = marco de 75% (horas úteis).")
    lines.append("const indicators = [\n  %s,\n]" % js(indicator))
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(%s) -> ok (${indicators.length} docs)`)" % iid)
    lines.append("")
    lines.append("// --- 2) Valores por município (%d docs), ano %s ---" % (len(values), ref_year))
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
    lines.append("print(`indicatorValues(%s) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)" % iid)
    out = SEED_DIR / ("indicador-%s.mongodb.js" % iid)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


# ---------- guarda-corpos + escrita direta no OPP ----------

def validate(snapshot):
    aggr = snapshot["aggregates"]
    munis = len(aggr)
    total = snapshot["totalRegistros"]
    problemas = []
    if munis < 150:
        problemas.append("só %d municípios com dados (esperado ~196 em 2025) — coleção/filtro errado?" % munis)
    if total < 2000:
        problemas.append("só %s solicitações na PB (implausivelmente baixo) — truncado?" % format(total, ",d"))
    # se TODOS os marcos forem 0, o campo de tempo provavelmente está errado
    if aggr and all(a["abertura"]["marco75Horas"] == 0 for a in aggr.values()):
        problemas.append("todos os marcos de abertura = 0 — campo de horas errado?")
    if problemas:
        sys.exit("VALIDAÇÃO FALHOU (nada escrito):\n  - " + "\n  - ".join(problemas))
    print("[validação] OK — %d municípios, %s solicitações PB (ano %s)."
          % (munis, format(total, ",d"), snapshot["referenceYear"]))


def write_mongo(args, indicadores, values):
    from datetime import datetime
    try:
        from datetime import timezone
        now = datetime.now(timezone.utc)
    except ImportError:
        now = datetime.utcnow()
    from pymongo import MongoClient, UpdateOne
    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db,
                         serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    db.indicators.bulk_write(
        [UpdateOne({"_id": i["_id"]}, {"$set": i}, upsert=True) for i in indicadores], ordered=False)
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": dict(v, updatedAt=now)}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP %s:%s/%s -> indicators=%d, indicatorValues upserted=%d modified=%d"
          % (args.opp_host, args.opp_port, args.opp_db, len(indicadores), res.upserted_count, res.modified_count))


def main():
    load_dotenv()  # .env auto: dispensa `source` em cada terminal
    ap = argparse.ArgumentParser(description="Gera os seeds tempo-viabilidade/tempo-abertura do lake REDESIM.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar o lake")
    ap.add_argument("--inspect", action="store_true", help="conecta e mostra 1 doc + cobertura; não gera seed")
    ap.add_argument("--collection", default="BRASIL_2025", help="coleção do ano (default: BRASIL_2025)")
    # ORIGEM = lake REDESIM (10.19.4.174:27018, usr_REDESIM:usr_REDESIM, authSource admin).
    # user/pass derivam de usr_<BASE> abaixo (após o parse) — não precisa passar nada.
    ap.add_argument("--mongo-host", default=env("REDESIM_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("REDESIM_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("REDESIM_MONGO_DB", "REDESIM"))
    ap.add_argument("--mongo-user", default=env("REDESIM_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("REDESIM_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("REDESIM_AUTH_DB", "admin"))
    # DESTINO OPP (--write-mongo)
    ap.add_argument("--write-mongo", action="store_true", help="upsert direto no Mongo OPP (indicators + indicatorValues)")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    # túnel SSH (opcional)
    ap.add_argument("--ssh-host", default=env("REDESIM_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("REDESIM_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("REDESIM_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("REDESIM_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("REDESIM_SSH_PASSWORD", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> (cada base tem a sua). Só passe
    # --mongo-user/--mongo-pass (ou REDESIM_MONGO_USER/PASS no .env) para sobrescrever.
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit("Snapshot não encontrado: %s. Rode online uma vez primeiro." % SNAPSHOT)
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print("[offline] snapshot %s — %s solicitações." % (snapshot["collection"], format(snapshot["totalRegistros"], ",d")))
    else:
        snapshot = fetch(args)  # --inspect sai aqui dentro
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[online] %s solicitações; snapshot salvo em %s" % (format(snapshot["totalRegistros"], ",d"), SNAPSHOT))

    validate(snapshot)

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    todos_ind, todos_val = [], []
    ref_year = snapshot["referenceYear"]
    for indicador in INDICADORES:
        values = build_values(snapshot, indicador)
        out = emit(indicador, values, ref_year)
        com = [v for v in values if v["numericValue"] is not None]
        faixas = defaultdict(int)
        for v in com:
            faixas[v["breakdown"]["faixaOficial"]] += 1
        print("OK — %s: %d/223 com dado; faixas %s -> %s"
              % (indicador["id"], len(com), dict(sorted(faixas.items())), out.name))
        todos_ind.append(build_indicator(indicador, ref_year))
        todos_val.extend(values)

    if args.write_mongo:
        write_mongo(args, todos_ind, todos_val)


if __name__ == "__main__":
    main()
