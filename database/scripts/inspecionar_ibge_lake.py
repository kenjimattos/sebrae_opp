#!/usr/bin/env python3
"""
Inventaria a base **IBGE** do data lake do Sebrae (Mongo `10.19.4.174:27018`,
usuário `usr_IBGE`, authSource `admin`) para descobrir QUAIS indicadores do
mapeamento (MAPEAMENTO_BASE_DOS_DADOS.md) que HOJE **não** vêm do lake já estão
disponíveis ali — SEM despejar doc por doc (a base tem centenas de coleções).

O que a base é (confirmado jun/2026 na 10.1.141.23): um dump das **tabelas do
SIDRA/IBGE**, UMA COLEÇÃO POR TABELA (nome = número da tabela SIDRA: `5938`, `993`,
`96`… + algumas nomeadas, ex. `AREA_MUNICIPIOS_KM`). Todo doc segue o formato SIDRA:
  VARIAVEL (o que é medido)  VALOR  ANO/CD_ANO  MUNICIPIO/CD_MUNICIPIO  UNIDADE_DE_MEDIDA
  + dimensões de classificação por tabela (situação, grupos de idade, CNAE, etc.)
**Não há campo UF** — a PB é identificada por CD_MUNICIPIO com prefixo `25` ou pelo
nome MUNICIPIO terminando em `(PB)`.

Candidatos do mapeamento hoje servidos pela Base dos Dados (BD) e que poderiam
migrar para o lake se estiverem aqui (ver §1 "Base econômica" e §2):
  - PIB total / PIB per capita / VAB por setor -> SIDRA 5938 (PIB dos Municípios)
  - População                                  -> SIDRA 6579 (estimativas) / Censo
  - GINI / rendimento / renda                  -> Censo / SIDRA (verificar)
  - IDH-M                                       -> Atlas (provavelmente NÃO é SIDRA)

Saída: um **inventário compacto** (1 linha por coleção) escrito num arquivo (--out),
e no stdout só o resumo + as coleções que casam com as pistas do mapeamento (com a
lista de VARIAVEL, anos e cobertura PB de cada uma). NÃO escreve no lake.

Uso (na 10.1.141.23, que enxerga o lake — ou via túnel SSH com --ssh-host):
  python3 database/scripts/inspecionar_ibge_lake.py
  python3 database/scripts/inspecionar_ibge_lake.py --out database/data/ibge_inv.tsv
  python3 database/scripts/inspecionar_ibge_lake.py --collection 5938   # só uma tabela, detalhada

Variáveis de ambiente equivalentes: IBGE_MONGO_HOST/PORT/USER/PASS, IBGE_AUTH_DB,
IBGE_MONGO_DB, e IBGE_SSH_* (host/port/user/key/password). Defaults do lake
(host/porta/authSource + credencial usr_IBGE) são derivados no script.

Requer:  pip install 'pymongo<4'   (host do ETL é Python 3.6 — sem `list[...]`)
"""
import argparse
import os
import re
import sys
from typing import List  # 3.6-safe: nada de PEP585/604

LAKE_HOST = "10.19.4.174"

# Pistas (regex, case-insensitive) casadas contra o texto de VARIAVEL de cada tabela
# SIDRA — é o VARIAVEL que diz o que a tabela mede, não o nome (número) da coleção.
# Focadas nos indicadores do mapeamento que HOJE não vêm do lake (base econômica + extras).
PISTAS = [
    ("PIB / PIB per capita",   r"produto\s+interno\s+bruto|\bpib\b"),
    ("VAB (valor adicionado)", r"valor\s+adicionad"),
    ("Populacao",              r"popula|residente|habitante"),
    ("Renda / rendimento",     r"rendimento|\brenda\b|remunera|sal[aá]ri"),
    ("Gini / desigualdade",    r"gini|desigual|concentra[cç]"),
    ("IDH / IDHM",             r"\bidh\b|idhm|desenvolvimento\s+humano"),
    ("Empresas / ocupacao",    r"empresas|pessoal\s+ocupad|unidades\s+locais"),
    ("Densidade demografica",  r"densidade"),
]

# Fallback: se listCollections for negado, sondamos estes números de tabela SIDRA
# (os mais úteis p/ o mapeamento) + nomeadas. Passe --collections a,b p/ estender.
GUESS_COLLECTIONS = [
    "5938",   # PIB dos Municípios (PIB, PIB per capita, VAB por setor, população)
    "21", "24", "37",   # PIB municipal (séries antigas)
    "6579",   # População residente estimada
    "200", "202", "1378", "1552", "9514",  # Censo — população
    "993",    # CEMPRE — nº de empresas e outras organizações
    "AREA_MUNICIPIOS_KM",
]


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


# --- regex de PB por nome de município (não há campo UF; CD_MUNICIPIO PB = prefixo 25)
PB_NOME = re.compile(r"\(PB\)\s*$")
PISTAS_RX = [(rot, re.compile(pad, re.I)) for rot, pad in PISTAS]


def casa_pistas(texto):
    """Rótulos das pistas que casam com um texto (VARIAVEL). Lista vazia = nenhum."""
    if not texto:
        return []
    return [rot for rot, rx in PISTAS_RX if rx.search(texto)]


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


def resumo_colecao(coll):
    """Linha de inventário barata: (est_docs, ano_amostra, variavel_amostra, tem_muni)."""
    doc = coll.find_one() or {}
    variavel = doc.get("VARIAVEL", "")
    ano = doc.get("ANO", doc.get("CD_ANO", ""))
    tem_muni = ("MUNICIPIO" in doc) or ("CD_MUNICIPIO" in doc)
    try:
        est = coll.estimated_document_count()
    except Exception:  # noqa: BLE001
        est = -1
    return est, ano, variavel, tem_muni


def detalhar_colecao(coll, cap=250):
    """Passo profundo (só p/ coleções que casaram): distinct VARIAVEL + anos +
    cobertura PB (por nome MUNICIPIO terminando em (PB))."""
    info = {"variaveis": [], "anos": [], "pb_docs": None, "pb_munis": None}
    try:
        vs = coll.distinct("VARIAVEL")
        info["variaveis"] = sorted(map(str, vs))[:cap]
    except Exception as e:  # noqa: BLE001
        info["variaveis"] = ["(distinct VARIAVEL falhou: %s)" % e]
    try:
        anos = coll.distinct("ANO")
        info["anos"] = sorted(map(str, anos))
    except Exception:  # noqa: BLE001
        pass
    try:
        filtro_pb = {"MUNICIPIO": {"$regex": r"\(PB\)\s*$"}}
        info["pb_docs"] = coll.count_documents(filtro_pb)
        info["pb_munis"] = len(coll.distinct("CD_MUNICIPIO", filtro_pb))
    except Exception as e:  # noqa: BLE001
        info["pb_erro"] = str(e)
    return info


def main():
    load_dotenv()
    ap = argparse.ArgumentParser(description="Inventaria a base IBGE (SIDRA) do data lake do Sebrae.")
    ap.add_argument("--out", default="database/data/ibge_lake_inventario.tsv",
                    help="arquivo TSV do inventário completo (default: database/data/ibge_lake_inventario.tsv)")
    ap.add_argument("--deep-out", default="database/data/ibge_lake_detalhe.txt",
                    help="arquivo do detalhe (VARIAVEL/anos/PB) das coleções que casaram")
    ap.add_argument("--collection", default="",
                    help="detalhar SÓ esta(s) coleção(ões) — aceita lista separada por vírgula (ex.: 21,155,993)")
    ap.add_argument("--collections", default="", help="coleções extra a sondar (fallback), separadas por vírgula")
    ap.add_argument("--no-deep", action="store_true", help="não fazer o passo profundo nas coleções que casaram")
    ap.add_argument("--mongo-host", default=env("IBGE_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("IBGE_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("IBGE_MONGO_DB", "IBGE"))
    ap.add_argument("--mongo-user", default=env("IBGE_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("IBGE_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("IBGE_AUTH_DB", "admin"))
    ap.add_argument("--ssh-host", default=env("IBGE_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("IBGE_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("IBGE_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("IBGE_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("IBGE_SSH_PASSWORD", ""))
    args = ap.parse_args()
    args.mongo_user = args.mongo_user or "usr_" + args.mongo_db  # IBGE -> usr_IBGE
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

        # --- inventário compacto p/ arquivo (1 linha por coleção) + coleta dos matches
        casaram = []  # (nome, variavel_amostra, rotulos)
        linhas = ["colecao\test_docs\tano_amostra\ttem_muni\tpistas\tvariavel_amostra"]
        for i, name in enumerate(colecoes):
            try:
                est, ano, variavel, tem_muni = resumo_colecao(db[name])
            except Exception as e:  # noqa: BLE001
                linhas.append("%s\tERRO\t\t\t\t%s" % (name, e))
                continue
            rotulos = casa_pistas(variavel) or casa_pistas(name)
            linhas.append("%s\t%s\t%s\t%s\t%s\t%s" % (
                name, est, ano, "sim" if tem_muni else "nao",
                "|".join(rotulos), (variavel or "").replace("\t", " ")))
            if rotulos:
                casaram.append((name, variavel, rotulos))
            if (i + 1) % 50 == 0:
                print("  ...%d/%d coleções inventariadas" % (i + 1, len(colecoes)))

        # grava o inventário
        try:
            outdir = os.path.dirname(args.out)
            if outdir and not os.path.exists(outdir):
                os.makedirs(outdir)
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write("\n".join(linhas) + "\n")
            print("\n[inventário completo -> %s]  (%d linhas)" % (args.out, len(linhas) - 1))
        except Exception as e:  # noqa: BLE001
            print("\n(falha ao escrever %s: %s — dump no stdout abaixo)" % (args.out, e))
            print("\n".join(linhas))

        # --- resumo dos matches no stdout
        print("\n=== coleções que casam com as pistas do mapeamento (%d) ===" % len(casaram))
        if not casaram:
            print("  nenhuma coleção casou pelas pistas atuais — abra o TSV e ajuste PISTAS.")
        for name, variavel, rotulos in casaram:
            print("  [%s]  %s" % ("|".join(rotulos), name))
            print("      VARIAVEL(amostra): %s" % (variavel or "(vazio)"))

        # --- passo profundo: distinct VARIAVEL + anos + cobertura PB.
        # Se o usuário pediu coleções explícitas (--collection), detalha TODAS elas
        # (mesmo sem casar pista); senão, detalha só as que casaram no inventário.
        if args.collection:
            # detalha todas as coleções pedidas; rótulos vêm do que já casou no inventário
            rot_por_nome = dict((n, r) for (n, _, r) in casaram)
            alvo_deep = [(n, rot_por_nome.get(n, [])) for n in colecoes]
        else:
            alvo_deep = [(n, r) for (n, _, r) in casaram]

        if alvo_deep and not args.no_deep:
            print("\n=== detalhe (VARIAVEL / anos / cobertura PB) de %d coleção(ões) ===" % len(alvo_deep))
            deep_linhas = []
            for name, rotulos in alvo_deep:
                cab = "\n--- coleção %s  [%s] ---" % (name, "|".join(rotulos) or "sem pista")
                print(cab)
                deep_linhas.append(cab)
                info = detalhar_colecao(db[name])
                if info.get("pb_erro"):
                    l = "  (cobertura PB falhou: %s)" % info["pb_erro"]
                else:
                    l = "  PB: %s docs ; %s municípios distintos (PB tem 223)" % (info["pb_docs"], info["pb_munis"])
                print(l); deep_linhas.append(l)
                if info["anos"]:
                    l = "  anos: %s" % ", ".join(info["anos"]); print(l); deep_linhas.append(l)
                l = "  VARIAVEL distintas (até 250):"; print(l); deep_linhas.append(l)
                for v in info["variaveis"]:
                    l = "    - %s" % v; print(l); deep_linhas.append(l)
            try:
                outdir = os.path.dirname(args.deep_out)
                if outdir and not os.path.exists(outdir):
                    os.makedirs(outdir)
                with open(args.deep_out, "w", encoding="utf-8") as fh:
                    fh.write("\n".join(deep_linhas) + "\n")
                print("\n[detalhe -> %s]" % args.deep_out)
            except Exception as e:  # noqa: BLE001
                print("\n(falha ao escrever %s: %s)" % (args.deep_out, e))

        print("\nPróximo passo: escolhida a tabela, escrevo o gerar_seed_<indicador>_lake.py "
              "filtrando VARIAVEL + CD_VARIAVEL e o recorte PB (MUNICIPIO ~ /(PB)$/), no molde "
              "do gerar_seed_escolaridade.py.")
    finally:
        if tunnel:
            tunnel.stop()


if __name__ == "__main__":
    main()
