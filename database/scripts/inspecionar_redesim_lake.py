#!/usr/bin/env python3
"""
Inspeciona a base **REDESIM** do data lake do Sebrae (Mongo `10.19.4.174:27018`,
usuário `usr_REDESIM`, authSource `admin`) para verificar se os microdados de
solicitações de abertura (coleções `BRASIL_<ano>`) trazem TUDO o que os geradores
de indicadores da Redesim hoje extraem da API pública (XLSX).

Objetivo: responder "o lake tem todos os dados que vêm da Redesim?" sem chutar
nomes de campo. NÃO escreve nada — só lê e relata.

O gerador atual (gerar_seed_tempo_abertura.py / _viabilidade) soma, por solicitação,
3 grandezas em horas úteis (posições do XLSX -> nomes próprios no Mongo):
  - QTDE HH VIABILIDADE TOTAL   (viabilidade)            -> tempo-viabilidade e tempo-abertura
  - QTDE HH LIBERAÇÃO DBE       (validação cadastral)    -> tempo-abertura
  - QTDE HORAS DEFERIMENTO      (registro/inscrição CNPJ)-> tempo-abertura
mais o município e a UF (recorte PB). Este script localiza esses campos no doc real.

Uso (na 10.1.141.23, que enxerga o lake — ou via túnel SSH com --ssh-host):
  python3 database/scripts/inspecionar_redesim_lake.py \
      --mongo-user usr_REDESIM --mongo-pass '***' --collection BRASIL_2025

Variáveis de ambiente equivalentes: REDESIM_MONGO_HOST/PORT/USER/PASS, REDESIM_AUTH_DB,
e REDESIM_SSH_* (host/port/user/key/password) se o próprio script for abrir o túnel.

Requer:  pip install 'pymongo<4'   (host do ETL é Python 3.6 — sem `list[...]`)
"""
import argparse
import os
import re
import sys
from typing import List  # 3.6-safe: nada de PEP585/604

# Lake do Sebrae: mesmo IP p/ conexão direta (da 10.1.141.23) e p/ remote_bind do túnel.
LAKE_HOST = "10.19.4.174"

# Pistas (regex, case-insensitive) para achar cada grandeza, independente da
# grafia exata que o Sebrae usou ao carregar o dump.
PISTAS = [
    ("viabilidade (HH)",        r"viabil"),
    ("liberacao DBE (HH)",      r"dbe|liber"),
    ("deferimento (horas)",     r"deferiment|registr|inscric"),
    ("municipio",               r"munic"),
    ("UF",                      r"^uf$|unidade.*feder|sigla.*uf"),
    ("ano",                     r"^ano$"),
    ("mes",                     r"^mes$|m[eê]s"),
]


def env(key, default=""):
    """os.environ.get que trata variável presente-porém-VAZIA como ausente — o .env
    modelo deixa chaves em branco, e '' não deve sobrescrever o default (int('') quebra)."""
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


def conectar(args):
    """Abre o cliente Mongo no lake (direto ou via túnel SSH). Devolve (client, tunnel)."""
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
        authSource=args.auth_db,  # lake: usuarios por base ficam no admin
        serverSelectionTimeoutMS=15000,
    )
    return client, tunnel


def achar_campos(chaves):
    """Para cada pista, lista as chaves do doc que casam — assim a gente vê o
    nome REAL de cada grandeza que os geradores precisam."""
    achados = []
    for rotulo, pad in PISTAS:
        rx = re.compile(pad, re.I)
        casam = [k for k in chaves if rx.search(k)]
        achados.append((rotulo, casam))
    return achados


def main():
    load_dotenv()  # .env auto: dispensa `source` em cada terminal
    ap = argparse.ArgumentParser(description="Inspeciona REDESIM.BRASIL_<ano> no data lake do Sebrae.")
    ap.add_argument("--collection", default="BRASIL_2025", help="coleção a inspecionar (default: BRASIL_2025)")
    ap.add_argument("--uf", default="PB", help="UF para os recortes de sanidade (default: PB)")
    ap.add_argument("--mongo-host", default=env("REDESIM_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("REDESIM_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("REDESIM_MONGO_DB", "REDESIM"))
    ap.add_argument("--mongo-user", default=env("REDESIM_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("REDESIM_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("REDESIM_AUTH_DB", "admin"))
    ap.add_argument("--ssh-host", default=env("REDESIM_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("REDESIM_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("REDESIM_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("REDESIM_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("REDESIM_SSH_PASSWORD", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> (cada base tem a sua).
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)

    client, tunnel = conectar(args)
    try:
        db = client[args.mongo_db]

        print("\n=== coleções na base %s ===" % args.mongo_db)
        for name in sorted(db.list_collection_names()):
            try:
                n = db[name].estimated_document_count()
                print("  %-16s ~%s docs" % (name, format(n, ",d")))
            except Exception as e:  # noqa: BLE001
                print("  %-16s (erro ao contar: %s)" % (name, e))

        coll = db[args.collection]
        print("\n=== 1 documento de exemplo de %s (UF=%s) ===" % (args.collection, args.uf))
        sample = coll.find_one({"UF": args.uf}) or coll.find_one()
        if not sample:
            sys.exit("Coleção vazia ou inacessível: %s" % args.collection)
        chaves = list(sample.keys())
        for k in chaves:
            v = sample[k]
            print("  %-32s = %r  (%s)" % (k, v, type(v).__name__))

        print("\n=== campos que os geradores da Redesim precisam (match por pista) ===")
        for rotulo, casam in achar_campos(chaves):
            marca = ", ".join(casam) if casam else "** NENHUM CAMPO CASOU — investigar **"
            print("  %-22s -> %s" % (rotulo, marca))

        print("\n=== sanidade de cobertura (%s) ===" % args.uf)
        try:
            total = coll.estimated_document_count()
            pb = coll.count_documents({"UF": args.uf})
            print("  total %s docs ; UF=%s: %s docs" % (format(total, ",d"), args.uf, format(pb, ",d")))
            munis = coll.distinct("MUNICIPIO", {"UF": args.uf})
            print("  MUNICIPIO distintos na %s: %d (PB tem 223 municípios)" % (args.uf, len(munis)))
            print("  amostra de MUNICIPIO: %s" % (sorted(map(str, munis))[:5]))
        except Exception as e:  # noqa: BLE001
            print("  (erro nos recortes de sanidade: %s)" % e)

        print("\nPróximo passo: com os nomes reais dos 3 campos de tempo + município confirmados,\n"
              "escrevo o gerar_seed_tempo_abertura_lake.py (e _viabilidade) agregando na origem.")
    finally:
        if tunnel:
            tunnel.stop()


if __name__ == "__main__":
    main()
