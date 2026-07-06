#!/usr/bin/env python3
"""
Explora a base **BCB** do data lake do Sebrae (Mongo `10.19.4.174:27018`,
usuário `usr_BCB`, authSource `admin`) para descobrir QUAIS dados dá pra extrair
dali — SEM saber de antemão o schema das coleções (diferente do IBGE/SIDRA, aqui
cada coleção pode ter um formato próprio: séries SGS, ESTBAN, PIX, crédito, etc.).

Estratégia (schema-agnóstica, barata):
  1. lista as coleções (listCollections; se negado, sonda os GUESS_COLLECTIONS);
  2. p/ CADA coleção: estimated_document_count + amostra 1 doc e expõe as CHAVES
     de topo com tipo e um preview de valor (achata 1 nível de subdocumento);
  3. detecta HEURISTICAMENTE cobertura municipal e recorte PB, testando os nomes
     de campo mais comuns (município, UF, código IBGE) — sem assumir nenhum;
  4. detecta HEURISTICAMENTE a dimensão temporal (data/ano/competência).

Saídas:
  - inventário compacto (1 linha/coleção) em TSV (--out);
  - detalhe de schema (chaves+tipos+preview de cada coleção) em txt (--deep-out);
  - no stdout: resumo + as coleções com pista de recorte municipal/PB.
NÃO escreve no lake (somente leitura).

Uso (na 10.1.141.23, que enxerga o lake — ou via túnel SSH com --ssh-host):
  python3 database/scripts/inspecionar_bcb_lake.py
  python3 database/scripts/inspecionar_bcb_lake.py --out database/data/bcb_inv.tsv
  python3 database/scripts/inspecionar_bcb_lake.py --collection ESTBAN_202312   # só uma, detalhada
  python3 database/scripts/inspecionar_bcb_lake.py --sample 3                    # amostra 3 docs/coleção

Variáveis de ambiente equivalentes: BCB_MONGO_HOST/PORT/USER/PASS, BCB_AUTH_DB,
BCB_MONGO_DB, e BCB_SSH_* (host/port/user/key/password). Defaults do lake
(host/porta/authSource + credencial usr_BCB) são derivados no script.

Requer:  pip install 'pymongo<4'   (host do ETL é Python 3.6 — sem `list[...]`)
"""
import argparse
import datetime
import os
import re
import sys
from typing import List  # 3.6-safe: nada de PEP585/604

LAKE_HOST = "10.19.4.174"

# Nomes de campo candidatos p/ recorte municipal (case-insensitive, match exato do
# nome da chave). Ordem = prioridade. Cobre convenções BCB/IBGE mais comuns.
CAMPOS_MUNICIPIO = [
    "CD_MUNICIPIO", "COD_MUNICIPIO", "CODMUN", "COD_MUN", "MUNICIPIO_IBGE",
    "MUNICIPIO", "NOME_MUNICIPIO", "MUNIC", "CIDADE",
]
CAMPOS_UF = ["UF", "SIGLA_UF", "SG_UF", "ESTADO", "COD_UF", "CD_UF"]
# Campos de tempo candidatos (série temporal — o que o BCB tipicamente tem).
CAMPOS_TEMPO = [
    "DATA", "DT", "DT_BASE", "DATA_BASE", "COMPETENCIA", "MES_ANO", "ANO_MES",
    "ANOMES", "PERIODO", "REF", "REFERENCIA", "ANO", "CD_ANO", "MES", "DATE",
]

# Fallback se listCollections for negado: nomes plausíveis p/ uma base BCB.
# Passe --collections a,b p/ estender a sondagem.
GUESS_COLLECTIONS = [
    "ESTBAN", "SGS", "SERIES", "PIX", "CREDITO", "CAMBIO", "SELIC", "IPCA",
    "SFN", "MUNICIPIOS", "TAXAS", "INDICADORES",
]

MAX_PREVIEW = 80  # corte do preview de valor por campo


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
            key, val = line.split("=", 1)
            key = key.strip()
            if key and not os.environ.get(key):
                os.environ[key] = val.strip().strip('"').strip("'")


def conectar(args):
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
        print("[ssh] tunel aberto -> %s, mongo em 127.0.0.1:%s" % (args.ssh_host, port))

    client = MongoClient(
        host=host, port=port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db,
        serverSelectionTimeoutMS=15000,
    )
    return client, tunnel


def listar_colecoes(db, args):
    """Nomes de coleção da base. Tenta listCollections; se negado, sonda os guesses."""
    try:
        nomes = sorted(db.list_collection_names())
        nomes = [n for n in nomes if not n.startswith("system.")]
        if nomes:
            return nomes, "listCollections"
    except Exception as e:  # noqa: BLE001
        print("  (list_collection_names negado: %s — sondando guesses)" % e)
    extra = [c.strip() for c in args.collections.split(",") if c.strip()]
    achadas = []
    for name in GUESS_COLLECTIONS + extra:
        if name in achadas:
            continue
        try:
            if db[name].find_one() is not None:
                achadas.append(name)
        except Exception:  # noqa: BLE001
            pass
    return achadas, "sondagem"


def tipo_curto(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, int):
        return "int"
    if isinstance(v, float):
        return "float"
    if isinstance(v, str):
        return "str"
    if isinstance(v, (datetime.datetime, datetime.date)):
        return "date"
    if isinstance(v, dict):
        return "obj"
    if isinstance(v, list):
        return "arr[%d]" % len(v)
    return type(v).__name__


def preview_valor(v):
    s = "" if v is None else str(v)
    s = s.replace("\t", " ").replace("\n", " ")
    return s[:MAX_PREVIEW] + ("…" if len(s) > MAX_PREVIEW else "")


def achatar_chaves(doc):
    """Chaves de topo (+1 nível de subdocumento) como [(caminho, tipo, preview)]."""
    linhas = []
    for k, v in doc.items():
        if k == "_id":
            continue
        linhas.append((k, tipo_curto(v), preview_valor(v)))
        if isinstance(v, dict):
            for k2, v2 in list(v.items())[:12]:
                linhas.append(("%s.%s" % (k, k2), tipo_curto(v2), preview_valor(v2)))
    return linhas


def achar_campo(chaves, candidatos):
    """Primeiro campo de `candidatos` presente em `chaves` (match case-insensitive)."""
    lower = dict((c.lower(), c) for c in chaves)
    for cand in candidatos:
        if cand.lower() in lower:
            return lower[cand.lower()]
    return None


def cobertura_pb(coll, campo_muni, campo_uf):
    """Tenta contar docs/municípios da PB. Testa UF=PB e nome/código com marca PB."""
    info = {}
    try:
        if campo_uf:
            for val in ("PB", "Paraíba", "PARAIBA", "25"):
                n = coll.count_documents({campo_uf: val})
                if n:
                    info["por_uf"] = "%s=%s -> %d docs" % (campo_uf, val, n)
                    break
        if campo_muni:
            # nome terminando em (PB) OU código IBGE começando com 25
            f_nome = {campo_muni: {"$regex": r"\(PB\)\s*$"}}
            n_nome = coll.count_documents(f_nome)
            if n_nome:
                info["por_nome"] = "%s ~ /(PB)$/ -> %d docs ; %d distintos" % (
                    campo_muni, n_nome, len(coll.distinct(campo_muni, f_nome)))
            f_cod = {campo_muni: {"$regex": r"^25\d{5}$"}}
            n_cod = coll.count_documents(f_cod)
            if n_cod:
                info["por_cod25"] = "%s ~ /^25XXXXX/ -> %d docs ; %d distintos" % (
                    campo_muni, n_cod, len(coll.distinct(campo_muni, f_cod)))
    except Exception as e:  # noqa: BLE001
        info["erro"] = str(e)
    return info


def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Explora a base BCB do data lake do Sebrae (schema-agnóstica).")
    ap.add_argument("--out", default="database/data/bcb_lake_inventario.tsv",
                    help="TSV do inventário (default: database/data/bcb_lake_inventario.tsv)")
    ap.add_argument("--deep-out", default="database/data/bcb_lake_detalhe.txt",
                    help="txt do detalhe de schema (chaves+tipos+preview) por coleção")
    ap.add_argument("--collection", default="",
                    help="detalhar SÓ esta(s) coleção(ões) — lista separada por vírgula")
    ap.add_argument("--collections", default="", help="coleções extra a sondar (fallback), por vírgula")
    ap.add_argument("--sample", type=int, default=1, help="nº de docs a amostrar por coleção no detalhe (default 1)")
    ap.add_argument("--no-deep", action="store_true", help="não fazer o passo profundo de schema")
    ap.add_argument("--mongo-host", default=env("BCB_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("BCB_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("BCB_MONGO_DB", "BCB"))
    ap.add_argument("--mongo-user", default=env("BCB_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("BCB_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("BCB_AUTH_DB", "admin"))
    ap.add_argument("--ssh-host", default=env("BCB_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("BCB_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("BCB_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("BCB_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("BCB_SSH_PASSWORD", ""))
    args = ap.parse_args()
    args.mongo_user = args.mongo_user or "usr_" + args.mongo_db  # BCB -> usr_BCB
    args.mongo_pass = args.mongo_pass or "usr_" + args.mongo_db

    client, tunnel = conectar(args)
    try:
        db = client[args.mongo_db]

        if args.collection:
            colecoes = [c.strip() for c in args.collection.split(",") if c.strip()]
            origem = "argumento --collection"
        else:
            colecoes, origem = listar_colecoes(db, args)
        if not colecoes:
            sys.exit("Nenhuma coleção encontrada em %s (origem: %s). Passe --collection/--collections."
                     % (args.mongo_db, origem))

        print("=== base %s: %d coleções (via %s) ===" % (args.mongo_db, len(colecoes), origem))

        # --- inventário compacto (1 linha/coleção) + coleta das que têm recorte municipal
        com_muni = []  # (nome, campo_muni, campo_uf)
        linhas = ["colecao\test_docs\tn_campos\tcampo_municipio\tcampo_uf\tcampo_tempo\tcampos_topo"]
        for i, name in enumerate(colecoes):
            try:
                coll = db[name]
                doc = coll.find_one() or {}
                try:
                    est = coll.estimated_document_count()
                except Exception:  # noqa: BLE001
                    est = -1
                chaves = [k for k in doc.keys() if k != "_id"]
                campo_muni = achar_campo(chaves, CAMPOS_MUNICIPIO)
                campo_uf = achar_campo(chaves, CAMPOS_UF)
                campo_tempo = achar_campo(chaves, CAMPOS_TEMPO)
            except Exception as e:  # noqa: BLE001
                linhas.append("%s\tERRO\t\t\t\t\t%s" % (name, e))
                continue
            linhas.append("%s\t%s\t%d\t%s\t%s\t%s\t%s" % (
                name, est, len(chaves), campo_muni or "-", campo_uf or "-",
                campo_tempo or "-", ", ".join(chaves)[:200]))
            if campo_muni or campo_uf:
                com_muni.append((name, campo_muni, campo_uf))
            if (i + 1) % 50 == 0:
                print("  ...%d/%d coleções inventariadas" % (i + 1, len(colecoes)))

        try:
            outdir = os.path.dirname(args.out)
            if outdir and not os.path.exists(outdir):
                os.makedirs(outdir)
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write("\n".join(linhas) + "\n")
            print("\n[inventário -> %s]  (%d coleções)" % (args.out, len(linhas) - 1))
        except Exception as e:  # noqa: BLE001
            print("\n(falha ao escrever %s: %s — dump abaixo)" % (args.out, e))
            print("\n".join(linhas))

        # --- resumo: coleções com pista de recorte municipal/PB
        print("\n=== coleções com campo de município/UF (%d) — candidatas ao recorte PB ===" % len(com_muni))
        for name, cm, cu in com_muni:
            cob = cobertura_pb(db[name], cm, cu)
            marca = " | ".join("%s: %s" % (k, v) for k, v in cob.items()) or "(sem match PB pelas heurísticas)"
            print("  %s  [muni=%s uf=%s]" % (name, cm or "-", cu or "-"))
            print("      %s" % marca)

        # --- passo profundo: schema (chaves+tipos+preview) das coleções.
        # Se --collection foi passado, detalha as pedidas; senão, detalha TODAS
        # (a base BCB não deve ter centenas de coleções como a IBGE).
        alvo_deep = colecoes
        if alvo_deep and not args.no_deep:
            print("\n=== detalhe de schema de %d coleção(ões) (amostra=%d doc) ===" % (len(alvo_deep), args.sample))
            deep_linhas = []
            for name in alvo_deep:
                cab = "\n--- coleção %s ---" % name
                print(cab); deep_linhas.append(cab)
                try:
                    docs = list(db[name].find().limit(max(1, args.sample)))
                except Exception as e:  # noqa: BLE001
                    l = "  (find falhou: %s)" % e; print(l); deep_linhas.append(l); continue
                if not docs:
                    l = "  (coleção vazia)"; print(l); deep_linhas.append(l); continue
                for j, doc in enumerate(docs):
                    if args.sample > 1:
                        l = "  doc %d:" % (j + 1); print(l); deep_linhas.append(l)
                    for caminho, tp, prev in achatar_chaves(doc):
                        l = "    %-28s %-8s %s" % (caminho, tp, prev)
                        print(l); deep_linhas.append(l)
            try:
                outdir = os.path.dirname(args.deep_out)
                if outdir and not os.path.exists(outdir):
                    os.makedirs(outdir)
                with open(args.deep_out, "w", encoding="utf-8") as fh:
                    fh.write("\n".join(deep_linhas) + "\n")
                print("\n[detalhe -> %s]" % args.deep_out)
            except Exception as e:  # noqa: BLE001
                print("\n(falha ao escrever %s: %s)" % (args.deep_out, e))

        print("\nPróximo passo: escolhida a coleção + os campos (município, tempo, valor), "
              "escrevo o gerar_seed_<indicador>_lake.py no molde do gerar_seed_credito_financiamento_lake.py.")
    finally:
        if tunnel:
            tunnel.stop()


if __name__ == "__main__":
    main()
