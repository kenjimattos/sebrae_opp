#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CALIBRAÇÃO do classificador de inovação para o indicador
`compras-publicas-inovacao` (agenda Inclusão produtiva).

NÃO é o gerador final — é a ferramenta para afinar a SEMENTE DE PALAVRAS-CHAVE do
`OBJETO_CONTRATO` antes de cravar a métrica. A métrica combina dois sinais, ambos no
data lake do Sebrae, sem fonte externa:

  (A) CNAE do fornecedor  -> setor intensivo em conhecimento (TIC/criativa/P&D),
                             mesma lista usada em `trabalhadores-tic` (RF_ESTABELECIMENTOS).
  (B) OBJETO do contrato  -> texto livre do que foi comprado (PNCP CONTRATOS).

Este script só exercita o sinal (B), que é o que precisa de calibração humana — o (A)
é pertencimento determinístico a uma lista de CNAE já validada. Regra do classificador:

  FORTE casa            -> inovação (confiança 'alta'), ignora NEG (ex.: "software para
                           o sistema de abastecimento de água" conta pelo 'software').
  FRACO casa + ÂNCORA   -> inovação (confiança 'media') SE nenhum termo NEG casar.
                           (termos genéricos — "sistema", "rede", "portal" — só contam
                           em contexto de tecnologia, e nunca em obra/infra.)
  caso contrário        -> não-inovação.

USO:

  # 1) Puxa N objetos reais de contratos MUNICIPAIS da PB do lake e classifica.
  #    Roda na 10.1.141.23 (vê o lake). Salva amostra p/ iterar offline.
  python3 calibrar_compras_inovacao.py --inspect --ano 2025 --limit 400 \
      --mongo-host 10.19.4.174 --mongo-user usr_PNCP --mongo-pass usr_PNCP \
      --dump amostra_objetos_pb.json

  # 2) Itera as palavras SEM o lake: reclassifica a amostra salva e mostra os baldes.
  python3 calibrar_compras_inovacao.py --score amostra_objetos_pb.json

Lê os baldes na tela: confira FRACO (falsos positivos?) e NENHUM (palavra que faltou?),
edite as listas FORTE/FRACO/ANCORA/NEG aqui e rode --score de novo. Requer: pymongo<4.
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from collections import Counter

# ----------------------------------------------------------------------------
# SEMENTE — editar aqui durante a calibração. Tudo é casado sobre o texto
# NORMALIZADO (minúsculo, sem acento), então escreva sem acento e em minúsculo.
# ----------------------------------------------------------------------------

# BOILERPLATE: jargão de licitação removido ANTES de classificar — não diz nada
# sobre o objeto. Mata o ruído do "Sistema de Registro de Preços" (procedimento,
# não sistema de TI) e da "proposta mais vantajosa" (pegava 'vant').
BOILERPLATE = [
    "sistema de registro de precos", "sistema de registro de preco",
    "registro de precos", "registro de preco", "ata de registro",
    "futura e eventual", "futuras e eventuais", "proposta mais vantajosa",
    "menor preco", "maior desconto", "maior percentual de desconto",
]

# FORTE: alta precisão, conta sozinho. Termos que, no contexto de compra pública
# municipal, quase sempre indicam software/dados/P&D/tecnologia de fronteira.
FORTE = [
    "software", "aplicativo", "plataforma digital", "plataforma online",
    "sistema de informacao", "sistema informatizado", "sistema de gestao",
    "licenca de software", "licenciamento de software", "licenca de uso de software",
    "desenvolvimento de sistema", "desenvolvimento de aplicativo", "desenvolvimento de site",
    "hospedagem de sistema", "integracao de sistemas", "erp", "saas",
    "computacao em nuvem", "nuvem", "cloud", "data center", "datacenter",
    "banco de dados", "business intelligence", "ciencia de dados",
    "inteligencia artificial", "aprendizado de maquina", "machine learning", "chatbot",
    "internet das coisas", "iot", "telemetria", "sensoriamento", "sensores",
    "georreferenciamento", "geoprocessamento", "geotecnologia",
    "sistema de informacao geografica", "drone", "vant",
    "veiculo aereo nao tripulado", "cidade inteligente", "smart city",
    "pesquisa e desenvolvimento", "p&d", "encomenda tecnologica",
    "solucao inovadora", "inovacao tecnologica", "prototipo", "prova de conceito",
    "startup", "transformacao digital", "digitalizacao", "assinatura digital",
    "certificado digital", "biometria", "reconhecimento facial", "automacao de processos",
    "robotica", "portal web", "website", "aplicacao web", "aplicacao mobile",
]

# FRACO: genérico — só conta com ÂNCORA tecnológica e sem NEG.
FRACO = [
    "sistema", "plataforma", "portal", "rede", "aplicacao", "monitoramento",
    "sensor", "automacao", "automatiza", "conectividade", "digital", "tecnologia",
]

# ÂNCORA: liga um termo FRACO a contexto de tecnologia.
ANCORA = [
    "informa", "digital", "software", "tecnolog", "dados", "computa", "eletronic",
    "web", "online", "internet", "app", "telemetri", "smart", "wifi", "wi-fi",
]

# NEG: veta o caminho FRACO (obra/infra/serviço braçal). NÃO veta FORTE.
NEG = [
    "agua", "esgoto", "esgotamento", "saneamento", "abastecimento",
    "viario", "pavimenta", "asfalt", "recapeamento", "terraplanagem", "drenagem",
    "iluminacao publica", "rede eletrica", "rede de distribuicao", "energia eletrica",
    "ar condicionado", "ar-condicionado", "climatizacao", "refrigeracao",
    "combate a incendio", "incendio", "hidraulic", "predial", "alvenaria",
    "ponte", "calcamento", "meio-fio", "merenda", "alimentacao escolar",
    "medicamento", "oxigenio", "pneus", "veiculo", "combustivel", "frota",
    "sistema de freios", "sistema de ar", "sistema viario", "sistema de esgoto",
    "sistema de abastecimento", "sistema de iluminacao", "sistema de protecao",
]

# EDU_CONTENT: compra de material/conteúdo didático. Quando presente, a "plataforma
# digital" é acessória ao conteúdo (sistema de apostilas/ensino) → NÃO conta como
# inovação. Veta só o sinal fraco e o forte-de-plataforma; software/app real ainda conta.
EDU_CONTENT = [
    "material didatico", "material pedagogico", "material escolar", "apostila",
    "livro didatico", "kit pedagogico", "kit escolar", "sistema de ensino",
    "sistema estruturado de ensino", "recomposicao de aprendizagem", "apoio pedagogico",
]

# Termos FORTE considerados acessórios em contexto de conteúdo didático (só plataforma).
SOFT_PLATFORM = {"plataforma digital", "plataforma online"}

# Siglas curtas que SÓ valem como palavra inteira (fronteira dos dois lados) —
# senão pegam pedaços de outras palavras (vant⊂vantajosa, iot⊂patriota, erp⊂...).
EXATAS = {"vant", "iot", "erp", "web", "app", "wifi", "wi-fi", "sig", "bi", "api"}


def _build_rx(terms):
    """Compila um regex: termo em EXATAS casa palavra inteira (\\b...\\b); os demais
    casam por prefixo com fronteira à esquerda (\\b...) para pegar variações
    morfológicas (informa→informacao/informatica, tecnolog→tecnologia/tecnologica)."""
    parts = []
    for t in terms:
        esc = re.escape(t)
        parts.append(r"\b%s\b" % esc if t in EXATAS else r"\b%s" % esc)
    return re.compile("(?:" + "|".join(parts) + ")")


RX_FORTE = _build_rx(FORTE)
RX_FRACO = _build_rx(FRACO)
RX_ANCORA = _build_rx(ANCORA)
RX_NEG = _build_rx(NEG)
RX_EDU = _build_rx(EDU_CONTENT)
RX_BOILER = re.compile("(?:" + "|".join(re.escape(t) for t in BOILERPLATE) + ")")


def normalize(text):
    """minúsculo + sem acento, espaços colapsados, sem boilerplate. None -> ''. """
    if not text:
        return ""
    t = unicodedata.normalize("NFKD", str(text))
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"\s+", " ", t.lower()).strip()
    return RX_BOILER.sub(" ", t)


def _hits(norm, rx):
    """Casamentos distintos do regex, na ordem de aparição (dedupe preservando ordem)."""
    return list(dict.fromkeys(m.group(0).strip() for m in rx.finditer(norm)))


def classify_objeto(objeto):
    """Retorna dict: {inovacao, confianca, via, termos}.
    via in {forte, fraco, fraco-vetado, edu-vetado, none}."""
    n = normalize(objeto)
    edu = bool(RX_EDU.search(n))
    forte = _hits(n, RX_FORTE)
    if forte:
        # Conteúdo didático + sinal só de plataforma → acessório, não conta.
        if edu and all(t in SOFT_PLATFORM for t in forte):
            return {"inovacao": False, "confianca": "nenhuma", "via": "edu-vetado",
                    "termos": forte + ["EDU"]}
        return {"inovacao": True, "confianca": "alta", "via": "forte", "termos": forte}
    fraco = _hits(n, RX_FRACO)
    if fraco:
        if edu:  # sinal fraco em compra de material didático → não conta.
            return {"inovacao": False, "confianca": "nenhuma", "via": "edu-vetado",
                    "termos": fraco + ["EDU"]}
        anc = _hits(n, RX_ANCORA)
        neg = _hits(n, RX_NEG)
        if anc and not neg:
            return {"inovacao": True, "confianca": "media", "via": "fraco",
                    "termos": fraco + ["@" + a for a in anc]}
        return {"inovacao": False, "confianca": "nenhuma", "via": "fraco-vetado",
                "termos": fraco + (["NEG:" + x for x in neg] if neg else ["sem-ancora"])}
    return {"inovacao": False, "confianca": "nenhuma", "via": "none", "termos": []}


# ----------------------------------------------------------------------------
# Conexão ao lake (espelha gerar_seed_mpe_compras_publicas_lake.py)
# ----------------------------------------------------------------------------

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


TIPO_PJ = ["PJ", "J", "Pessoa Jurídica", "PESSOA JURIDICA"]


def fetch_amostra(args):
    from pymongo import MongoClient
    client = MongoClient(
        host=args.mongo_host, port=args.mongo_port,
        username=args.mongo_user or None, password=args.mongo_pass or None,
        authSource=args.auth_db or args.mongo_db, serverSelectionTimeoutMS=15000,
    )
    coll = client[args.mongo_db][args.collection]
    match = {
        "ORGAO_ENTIDADE.ESFERA_ID": "M",
        "UNIDADE_ORGAO.UF_SIGLA": "PB",
        "TIPO_PESSOA": {"$in": TIPO_PJ},
    }
    proj = {"_id": 0, "OBJETO_CONTRATO": 1, "VALOR_GLOBAL": 1, "VALOR_INICIAL": 1,
            "NI_FORNECEDOR": 1, "UNIDADE_ORGAO.CODIGO_IBGE": 1,
            "CATEGORIA_PROCESSO.NOME": 1}
    cur = coll.find(match, proj).limit(args.limit)
    rows = []
    for d in cur:
        rows.append({
            "objeto": d.get("OBJETO_CONTRATO") or "",
            "valor": d.get("VALOR_GLOBAL") or d.get("VALOR_INICIAL") or 0,
            "ibge": (d.get("UNIDADE_ORGAO") or {}).get("CODIGO_IBGE"),
            "categoria": (d.get("CATEGORIA_PROCESSO") or {}).get("NOME"),
        })
    return rows


# ----------------------------------------------------------------------------
# Relatório de calibração
# ----------------------------------------------------------------------------

def report(rows, show=8):
    baldes = {"forte": [], "fraco": [], "fraco-vetado": [], "edu-vetado": [], "none": []}
    val = {"inov": 0.0, "tot": 0.0}
    for r in rows:
        c = classify_objeto(r["objeto"])
        baldes[c["via"]].append((r, c))
        v = float(r.get("valor") or 0)
        val["tot"] += v
        if c["inovacao"]:
            val["inov"] += v

    n = len(rows)
    print("=" * 78)
    print("AMOSTRA: %d contratos municipais PJ (PB)" % n)
    for via in ("forte", "fraco", "fraco-vetado", "edu-vetado", "none"):
        b = baldes[via]
        pct = (100.0 * len(b) / n) if n else 0
        print("  %-13s %5d  (%4.1f%%)" % (via, len(b), pct))
    inov_n = len(baldes["forte"]) + len(baldes["fraco"])
    print("  -> classificados INOVAÇÃO: %d (%.1f%% dos contratos)" % (
        inov_n, (100.0 * inov_n / n) if n else 0))
    if val["tot"]:
        print("  -> %% DO VALOR em inovação: %.1f%% (R$ %.0f de R$ %.0f)" % (
            100.0 * val["inov"] / val["tot"], val["inov"], val["tot"]))
    print()

    for via, titulo in (("forte", "FORTE — confira se algum é falso positivo"),
                        ("fraco", "FRACO — os mais arriscados, leia com atenção"),
                        ("fraco-vetado", "FRACO VETADO — vetado por NEG/sem-âncora"),
                        ("edu-vetado", "EDU VETADO — material/conteúdo didático (plataforma acessória)"),
                        ("none", "NENHUM — caça a palavras que FALTARAM")):
        b = baldes[via]
        print("-" * 78)
        print("[%s]  (%d)" % (titulo, len(b)))
        for r, c in b[:show]:
            termos = ", ".join(c["termos"][:6])
            print("  • %-70s" % (normalize(r["objeto"])[:70]))
            if termos:
                print("      ↳ %s" % termos)
        print()

    # palavras mais comuns no balde NENHUM — pista de termos a adicionar
    wc = Counter()
    for r, _c in baldes["none"]:
        for w in normalize(r["objeto"]).split():
            if len(w) > 4:
                wc[w] += 1
    print("-" * 78)
    print("Tokens frequentes no balde NENHUM (candidatos a nova palavra-chave):")
    print("  " + ", ".join("%s(%d)" % (w, c) for w, c in wc.most_common(25)))


def main():
    load_dotenv()
    ap = argparse.ArgumentParser()
    ap.add_argument("--inspect", action="store_true", help="puxa amostra do lake e classifica")
    ap.add_argument("--score", metavar="ARQ", help="reclassifica amostra JSON local (offline)")
    ap.add_argument("--dump", metavar="ARQ", help="salva a amostra puxada do lake (p/ --score)")
    ap.add_argument("--ano", default="2025")
    ap.add_argument("--limit", type=int, default=400)
    ap.add_argument("--show", type=int, default=8)
    ap.add_argument("--mongo-host", default=env("PNCP_MONGO_HOST", "10.19.4.174"))
    ap.add_argument("--mongo-port", type=int, default=int(env("PNCP_MONGO_PORT", "27018")))
    ap.add_argument("--mongo-db", default=env("PNCP_MONGO_DB", "PNCP"))
    ap.add_argument("--collection", default="")
    ap.add_argument("--mongo-user", default="")
    ap.add_argument("--mongo-pass", default="")
    ap.add_argument("--auth-db", default=env("PNCP_AUTH_DB", "admin"))
    args = ap.parse_args()
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)
    args.collection = args.collection or ("CONTRATOS_" + str(args.ano))

    if args.score:
        rows = json.load(open(args.score, encoding="utf-8"))
        report(rows, show=args.show)
        return
    if args.inspect:
        rows = fetch_amostra(args)
        if args.dump:
            with open(args.dump, "w", encoding="utf-8") as fh:
                json.dump(rows, fh, ensure_ascii=False, indent=1)
            print("amostra salva em %s (%d linhas)\n" % (args.dump, len(rows)))
        report(rows, show=args.show)
        return
    ap.print_help()


if __name__ == "__main__":
    main()
