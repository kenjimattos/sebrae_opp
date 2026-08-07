#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) das **emendas parlamentares federais por município da PB** — a partir dos
arquivos anuais "Emendas Parlamentares por Documento" do **Portal da Transparência (CGU)**.
NÃO usa o data lake do Sebrae nem a Base dos Dados. São ZIPs públicos, sem chave de API.

== Por que "por documento" e não a lista de emendas ==
A consulta de emendas traz uma linha por emenda, com um campo de localidade que frequentemente
vem como "MÚLTIPLA" ou "Nacional" — uma emenda agregadora distribui recurso para várias cidades.
Atribuir município por ali perde a maior parte da destinação real. Os **documentos de despesa**
(empenho, liquidação, pagamento) é que carregam o destino de cada parcela, com o **código IBGE do
município de aplicação do recurso** já estruturado. É por isso que este gerador lê o conjunto por
documento — e é o mesmo caminho que a Datapedia declara usar na nota técnica dela (jul/2026).

== Métrica: FLUXO (R$), acumulado na janela ==
Cada linha é um documento de despesa de uma emenda. As colunas de valor são exclusivas por fase
(confirmado ago/2026, PB/2024):

    Fase = "Empenho"     -> só "Valor Empenhado" preenchido
    Fase = "Liquidação"  -> nenhuma das duas (a liquidação não entra nessas colunas)
    Fase = "Pagamento"   -> só "Valor Pago" preenchido

Logo somar as duas colunas em todas as linhas NÃO duplica valor:

    empenhado = Σ "Valor Empenhado"   (vem só das linhas de Empenho)
    pago      = Σ "Valor Pago"        (vem só das linhas de Pagamento)

== Dois eixos de tempo — não confundir ==
  - **Ano da emenda** ("Ano da Emenda"): a safra da emenda. Define o UNIVERSO (default >= 2023).
  - **Ano do documento** ("Data Documento"): quando o dinheiro se moveu. Define a QUEBRA ANUAL
    (`porAno`) — é assim que "pago em 2024" deve ser lido, e é o critério do painel da Datapedia.
Uma emenda de 2023 pode ser paga em 2025 (restos a pagar); ela conta no universo pela safra 2023
e na quebra anual em 2025.

== Validação (ago/2026, janela 2023+) ==
Conferido contra o painel da Datapedia (conta SEBRAE-PB), que parte da mesma fonte pública:
    totalEmpenhado  5.371.611.968,13  (nosso: 5.373.796.867,13   +0,04%)
    totalPago       4.269.633.586,53  (nosso: 4.273.756.815,28   +0,10%)
    totalPago2023     649.150.784,80  (nosso:   649.150.784,80    0,00%)
    totalPago2024   1.187.072.618,28  (nosso: 1.187.072.618,28    0,00%)
    totalPago2025   1.405.615.073,98  (nosso: 1.405.615.073,98    0,00%)
Por município: 220 de 223 dentro de 1%. As diferenças restantes são pagamentos novos — nosso
extrato é posterior à atualização deles (29/jul/2026). Rodar `--conferir <map.json>` refaz essa
comparação contra uma captura do painel.

== Cobertura e ressalva ==
Censo de documentos: os 223 municípios aparecem. Município sem emenda sairia com R$ 0 (zero real,
não lacuna). ~13% do empenhado e ~18% do pago da PB ficam em linhas **sem município** ("Nacional"
ou "Sem informação") — aplicação estadual/nacional que não se municipaliza. Esse resto NÃO entra
nos 223 docs; vai num doc à parte com `escopo: "estado"`, para a UI poder mostrar o total do
estado sem inflar município nenhum.

SEM threshold/semáforo: é valor absoluto em R$, sem faixa oficial. A CGU não classifica.

== Schema do CSV (confirmado ago/2026) ==
ZIP anual (~15 Mb) -> 1 CSV (~320 Mb), encoding **ISO-8859-1**, delimitador **";"**, decimal ",".
Colunas usadas:
  Código da Emenda · Ano da Emenda · Nome do Autor da Emenda · Valor Empenhado · Valor Pago
  · Tipo de Emenda · Data Documento · Fase da despesa · UF de aplicação do recurso
  · Município de aplicação do recurso · Código IBGE do município de aplicação do recurso
(há 48 colunas no total; as demais são ignoradas.)

== USO ==
    python3 gerar_seed_emendas_federais.py --inspect       # colunas + fases + PB/anos
    python3 gerar_seed_emendas_federais.py                 # baixa os ZIPs, gera snapshot + seed
    python3 gerar_seed_emendas_federais.py --desde 2023    # recorta o universo por ano da emenda
    python3 gerar_seed_emendas_federais.py --zips /dir     # usa ZIPs já baixados
    python3 gerar_seed_emendas_federais.py --offline       # regenera o seed do snapshot
    python3 gerar_seed_emendas_federais.py --write-mongo   # + OPP_MONGO_USER/PASS no .env
    python3 gerar_seed_emendas_federais.py --conferir map.json   # compara com captura do painel

Requer só a stdlib (urllib/csv/zipfile). --write-mongo requer 'pip install pymongo<4'.
Compatível com Python 3.6 (sem f-strings / list[...]).
"""
import argparse
import csv
import io
import json
import os
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path


def env(key, default=""):
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
SNAPSHOT = DATA_DIR / "emendas_federais_pb.json"
SEED_FILE = SEED_DIR / "emendas-federais.mongodb.js"

# Portal da Transparência — "Emendas parlamentares por Documentos de Despesa".
# A URL abaixo devolve 302 para o CDN de dados abertos da CGU (dadosabertos-download.cgu.gov.br).
ZIP_URL = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares-documentos/{}"
CSV_ENCODING = "ISO-8859-1"
CSV_DELIM = ";"

ESFERA = "federal"
UF_PB = "PB"
DESDE_DEFAULT = 2023            # safra mínima da emenda (janela do painel de referência)

SOURCE = (
    "Portal da Transparência (CGU) — 'Emendas parlamentares por Documentos de Despesa', "
    "arquivos anuais. Valores empenhados e pagos acumulados, nominais"
)
SOURCE_DATASET = "cgu_emendas_parlamentares_por_documento"

# Colunas do CSV (nomes exatos, com acento).
C_UF = "UF de aplicação do recurso"
C_IBGE = "Código IBGE do município de aplicação do recurso"
C_MUN = "Município de aplicação do recurso"
C_ANO_EMENDA = "Ano da Emenda"
C_COD_EMENDA = "Código da Emenda"
C_AUTOR = "Nome do Autor da Emenda"
C_TIPO = "Tipo de Emenda"
C_EMPENHADO = "Valor Empenhado"
C_PAGO = "Valor Pago"
C_DATA = "Data Documento"
C_FASE = "Fase da despesa"

OBRIGATORIAS = (C_UF, C_IBGE, C_ANO_EMENDA, C_EMPENHADO, C_PAGO, C_DATA, C_FASE)


# ============================================================================
# utilidades
# ============================================================================

def parse_valor(v):
    """float a partir de string BR ('1.234.567,89'). Vazio/None → 0.0."""
    if v is None:
        return 0.0
    s = str(v).strip()
    if not s:
        return 0.0
    neg = s.startswith("-")
    s = s.lstrip("-").strip()
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        f = float(s)
    except ValueError:
        return 0.0
    return -f if neg else f


def ano_documento(v):
    """Ano (str 'AAAA') de 'dd/mm/aaaa'; None se não der."""
    s = (v or "").strip()
    m = re.match(r"^\d{2}/\d{2}/(\d{4})$", s)
    if m:
        return m.group(1)
    m = re.match(r"^(\d{4})-", s)
    return m.group(1) if m else None


def municipios_canonicos():
    """[(ibge, nome)] dos 223 da PB, na ordem do seed canônico."""
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    pares = re.findall(r'\{"_id": "(\d{7})", "name": "([^"]+)"', text)
    if len(pares) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(pares)))
    return pares


def anos_arquivo(desde, ate):
    """Arquivos anuais a varrer. Um documento nunca é anterior à safra da emenda, então
    começar em `desde` é suficiente para o universo escolhido."""
    return list(range(desde, ate + 1))


def download_zip(ano, dest_dir):
    """Baixa o ZIP anual (só stdlib). Devolve o Path; reaproveita se já existir."""
    import urllib.request
    dest = dest_dir / "_emendas_documentos_{}.zip".format(ano)
    if dest.exists() and dest.stat().st_size > 1000:
        print("[emendas] {} já baixado ({:.1f} Mb).".format(dest.name, dest.stat().st_size / 1e6),
              file=sys.stderr)
        return dest
    url = ZIP_URL.format(ano)
    print("[emendas] baixando {} …".format(url), file=sys.stderr)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SebraeOPP-ETL/1.0"})
        with urllib.request.urlopen(req, timeout=600) as resp, open(str(dest), "wb") as out:
            while True:
                chunk = resp.read(1 << 20)
                if not chunk:
                    break
                out.write(chunk)
    except Exception as e:  # noqa: BLE001 — mensagem acionável p/ o operador
        sys.exit("[emendas] falha ao baixar {} ({}). Baixe manualmente de\n  {}\n"
                 "e rode com --zips <diretório>.".format(ano, e, url))
    print("[emendas] salvo em {} ({:.1f} Mb).".format(dest, dest.stat().st_size / 1e6), file=sys.stderr)
    return dest


def open_rows(zip_path):
    """(DictReader, closer) lendo o CSV de dentro do ZIP em streaming — sem extrair os ~320 Mb."""
    zf = zipfile.ZipFile(str(zip_path))
    nomes = [n for n in zf.namelist() if n.lower().endswith(".csv")]
    if not nomes:
        sys.exit("ZIP sem CSV: {}".format(zip_path))
    raw = zf.open(nomes[0])
    txt = io.TextIOWrapper(raw, encoding=CSV_ENCODING, newline="")
    return csv.DictReader(txt, delimiter=CSV_DELIM), (lambda: (txt.close(), zf.close()))


# ============================================================================
# harvest: agrega empenhado/pago por município (PB), com quebra por ano do documento
# ============================================================================

def _blank():
    return {"empenhado": 0.0, "pago": 0.0, "porAno": {}, "emendas": set(), "autores": set()}


def _acc(a, empenhado, pago, ano_doc, cod_emenda, autor):
    a["empenhado"] += empenhado
    a["pago"] += pago
    if ano_doc:
        slot = a["porAno"].setdefault(ano_doc, {"empenhado": 0.0, "pago": 0.0})
        slot["empenhado"] += empenhado
        slot["pago"] += pago
    if cod_emenda:
        a["emendas"].add(cod_emenda)
    if autor:
        a["autores"].add(autor)


def _finalize(a):
    return {
        "empenhado": round(a["empenhado"], 2),
        "pago": round(a["pago"], 2),
        "porAno": dict((k, {"empenhado": round(v["empenhado"], 2), "pago": round(v["pago"], 2)})
                       for k, v in sorted(a["porAno"].items())),
        "nEmendas": len(a["emendas"]),
        "nAutores": len(a["autores"]),
    }


def harvest(zips, code_set, desde, ate):
    """Varre os ZIPs anuais; filtra UF=PB e o universo (ano da emenda em [desde, ate]).
    Devolve (municipios{ibge->agg}, sem_municipio_agg, meta)."""
    muni = {}
    sem_mun = _blank()
    nomes_vistos = {}
    n_total = n_pb = n_fora_universo = 0
    fora_ibge = set()
    safras = set()
    # união da PB inteira — os agregados por município perdem a distinção ao virar
    # contagem, e somá-las contaria a mesma emenda uma vez por município atendido.
    emendas_pb = set()
    autores_pb = set()

    for zip_path in zips:
        rows, close = open_rows(zip_path)
        cols = rows.fieldnames or []
        for req in OBRIGATORIAS:
            if req not in cols:
                sys.exit("Coluna obrigatória {!r} ausente em {}.\nColunas: {}".format(
                    req, zip_path.name, cols))
        for row in rows:
            n_total += 1
            if (row.get(C_UF) or "").strip().upper() != UF_PB:
                continue
            safra = (row.get(C_ANO_EMENDA) or "").strip()
            if not safra.isdigit():
                continue
            safra_i = int(safra)
            if safra_i < desde or safra_i > ate:
                n_fora_universo += 1
                continue
            empenhado = parse_valor(row.get(C_EMPENHADO))
            pago = parse_valor(row.get(C_PAGO))
            if not empenhado and not pago:
                continue          # linhas de Liquidação não movem nenhuma das duas colunas
            n_pb += 1
            safras.add(safra)
            ano_doc = ano_documento(row.get(C_DATA))
            cod = (row.get(C_COD_EMENDA) or "").strip()
            autor = (row.get(C_AUTOR) or "").strip()
            if cod:
                emendas_pb.add(cod)
            if autor:
                autores_pb.add(autor)
            ibge = (row.get(C_IBGE) or "").strip()
            if ibge in code_set:
                nomes_vistos[ibge] = (row.get(C_MUN) or "").strip()
                _acc(muni.setdefault(ibge, _blank()), empenhado, pago, ano_doc, cod, autor)
            else:
                if ibge and ibge.isdigit():
                    fora_ibge.add(ibge)
                _acc(sem_mun, empenhado, pago, ano_doc, cod, autor)
        close()
        print("[emendas] {} varrido.".format(zip_path.name), file=sys.stderr)

    if fora_ibge:
        print("[emendas] aviso: {} códigos IBGE da PB não casaram com os 223 canônicos "
              "(amostra: {}).".format(len(fora_ibge), ", ".join(sorted(fora_ibge)[:10])),
              file=sys.stderr)

    meta = {
        "totalLinhas": n_total, "linhasPB": n_pb, "linhasForaDoUniverso": n_fora_universo,
        "safras": sorted(safras),
        "nEmendasPB": len(emendas_pb), "nAutoresPB": len(autores_pb),
    }
    print("[emendas] {} linhas nos arquivos; PB no universo: {} documentos, {} municípios, "
          "{} documentos sem município.".format(n_total, n_pb, len(muni),
                                                len(sem_mun["emendas"])), file=sys.stderr)
    return (dict((c, _finalize(a)) for c, a in muni.items()), _finalize(sem_mun),
            meta, nomes_vistos)


# ============================================================================
# build_docs + emit + write-mongo
# ============================================================================

def fmt_reais(v):
    if v >= 1e9:
        return ("R$ {:.2f} bi".format(v / 1e9)).replace(".", ",")
    if v >= 1e6:
        return ("R$ {:.2f} mi".format(v / 1e6)).replace(".", ",")
    if v >= 1e3:
        return "R$ {:.0f} mil".format(v / 1e3)
    return "R$ {:.0f}".format(v)


def build_docs(snapshot):
    """223 docs municipais + 1 doc de escopo estadual (o que não se municipaliza)."""
    janela = snapshot["janela"]
    ref = str(janela["ate"])
    muni = snapshot["municipios"]
    docs = []
    tot = {"empenhado": 0.0, "pago": 0.0, "com": 0}

    for ibge, nome in municipios_canonicos():
        a = muni.get(ibge) or {"empenhado": 0.0, "pago": 0.0, "porAno": {},
                               "nEmendas": 0, "nAutores": 0}
        tot["empenhado"] += a["empenhado"]
        tot["pago"] += a["pago"]
        if a["empenhado"] or a["pago"]:
            tot["com"] += 1
        docs.append({
            "_id": "{}:{}".format(ibge, ESFERA),
            "escopo": "municipio",
            "municipalityId": ibge,
            "esfera": ESFERA,
            "empenhado": a["empenhado"],
            "pago": a["pago"],
            "rawEmpenhado": fmt_reais(a["empenhado"]),
            "rawPago": fmt_reais(a["pago"]),
            "porAno": a["porAno"],
            "nEmendas": a["nEmendas"],
            "nAutores": a["nAutores"],
            "janela": janela,
            "atribuicao": "ibge",     # campo estruturado na origem — sem inferência de texto
            "referenceYear": ref,
            "source": SOURCE,
            "isFictional": False,
        })

    sem = snapshot.get("semMunicipioPB") or {}
    docs.append({
        "_id": "PB:{}".format(ESFERA),
        "escopo": "estado",
        "municipalityId": None,
        "esfera": ESFERA,
        # total do estado = municipalizado + o que não se municipaliza
        "empenhado": round(tot["empenhado"] + sem.get("empenhado", 0.0), 2),
        "pago": round(tot["pago"] + sem.get("pago", 0.0), 2),
        "rawEmpenhado": fmt_reais(tot["empenhado"] + sem.get("empenhado", 0.0)),
        "rawPago": fmt_reais(tot["pago"] + sem.get("pago", 0.0)),
        "porAno": _somar_por_ano(muni, sem),
        "naoMunicipalizado": {
            "empenhado": sem.get("empenhado", 0.0),
            "pago": sem.get("pago", 0.0),
            "porAno": sem.get("porAno", {}),
            "nota": "aplicação estadual/nacional ('Nacional' ou 'Sem informação' na origem); "
                    "não entra em nenhum dos 223 municípios",
        },
        # contagem distinta da PB inteira (não a soma das municipais — uma emenda
        # que atende 5 cidades seria contada 5 vezes)
        "nEmendas": snapshot.get("nEmendasPB", 0),
        "nAutores": snapshot.get("nAutoresPB", 0),
        "janela": janela,
        "atribuicao": "ibge",
        "referenceYear": ref,
        "source": SOURCE,
        "isFictional": False,
    })
    return docs, {"ref": ref, "janela": janela, "tot": tot, "sem": sem}


def _somar_por_ano(muni, sem):
    """Quebra anual do estado inteiro (municipalizado + não municipalizado)."""
    acc = {}
    for a in list(muni.values()) + [sem]:
        for ano, v in (a.get("porAno") or {}).items():
            slot = acc.setdefault(ano, {"empenhado": 0.0, "pago": 0.0})
            slot["empenhado"] += v.get("empenhado", 0.0)
            slot["pago"] += v.get("pago", 0.0)
    return dict((k, {"empenhado": round(v["empenhado"], 2), "pago": round(v["pago"], 2)})
                for k, v in sorted(acc.items()))


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_emendas_federais.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def emit(docs, ref, janela):
    lines = [HEADER, ""]
    lines.append("// --- Emendas parlamentares FEDERAIS por município da PB ---")
    lines.append("// Universo: emendas com safra {}–{}; quebra anual (`porAno`) pelo ano do".format(
        janela.get("de"), janela.get("ate")))
    lines.append("// DOCUMENTO de despesa. Fonte: Portal da Transparência (CGU), conjunto por")
    lines.append("// documento. Município vem do código IBGE estruturado. SEM threshold.")
    lines.append("// {} docs = 223 municípios + 1 de escopo estadual.".format(len(docs)))
    lines.append("const emendas = [")
    for d in docs:
        lines.append("  {},".format(js(d)))
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = emendas.map(e => ({ updateOne: {")
    lines.append("  filter: { _id: e._id },")
    lines.append("  update: { $set: Object.assign({}, e, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.emendas.bulkWrite(ops, { ordered: false })")
    lines.append("print(`emendas(federal) -> upserted=${res.upsertedCount} "
                 "modified=${res.modifiedCount}`)")
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def write_mongo(args, docs):
    from datetime import timezone
    from pymongo import MongoClient, UpdateOne
    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db, serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]
    now = datetime.now(timezone.utc)
    ops = [UpdateOne({"_id": d["_id"]}, {"$set": dict(d, updatedAt=now)}, upsert=True)
           for d in docs]
    res = db.emendas.bulk_write(ops, ordered=False)
    print("[write-mongo] OPP {} -> emendas upserted={} modified={}".format(
        args.opp_db, res.upserted_count, res.modified_count))


# ============================================================================
# inspect / conferir
# ============================================================================

def _inspect(zip_path):
    import collections
    rows, close = open_rows(zip_path)
    print("\n=== colunas ({}) ===".format(len(rows.fieldnames or [])))
    print("  " + ", ".join(rows.fieldnames or []))
    fases = collections.Counter()
    fase_valores = collections.defaultdict(lambda: {"emp": 0.0, "pago": 0.0})
    safras_pb = collections.Counter()
    n = n_pb = pb_sem_mun = 0
    exemplo = None
    for row in rows:
        n += 1
        fase = (row.get(C_FASE) or "").strip()
        fases[fase] += 1
        if (row.get(C_UF) or "").strip().upper() == UF_PB:
            n_pb += 1
            fase_valores[fase]["emp"] += parse_valor(row.get(C_EMPENHADO))
            fase_valores[fase]["pago"] += parse_valor(row.get(C_PAGO))
            safras_pb[(row.get(C_ANO_EMENDA) or "?").strip()] += 1
            if not (row.get(C_IBGE) or "").strip().isdigit():
                pb_sem_mun += 1
            if exemplo is None:
                exemplo = row
    close()
    print("\n=== fase da despesa (Brasil, {} linhas) ===".format(n))
    for k, v in fases.most_common():
        print("  {:8d}  {}".format(v, k))
    print("\n=== PB: {} linhas ({} sem município) ===".format(n_pb, pb_sem_mun))
    print("  safras (ano da emenda): {}".format(dict(sorted(safras_pb.items()))))
    print("\n=== valores por fase (PB) — confirma que as colunas são exclusivas ===")
    for k in sorted(fase_valores):
        v = fase_valores[k]
        print("  {:14s} empenhado={:>18,.2f}  pago={:>18,.2f}".format(k, v["emp"], v["pago"]))
    if exemplo:
        print("\n=== 1 linha PB (campos-chave) ===")
        for k in (C_COD_EMENDA, C_ANO_EMENDA, C_AUTOR, C_TIPO, C_FASE, C_DATA,
                  C_EMPENHADO, C_PAGO, C_UF, C_MUN, C_IBGE):
            print("  {:52s} = {!r}".format(k, exemplo.get(k)))


def _conferir(snapshot, map_json):
    """Compara o snapshot com uma captura do painel de referência (lista de
    {ibge, empenhado, pago}). Só relatório — não altera nada."""
    dados = json.loads(Path(map_json).read_text(encoding="utf-8"))
    ref = dict((str(m["ibge"]), m) for m in dados)
    muni = snapshot["municipios"]
    dentro = fora = 0
    piores = []
    for ibge, m in ref.items():
        nosso = muni.get(ibge) or {"empenhado": 0.0, "pago": 0.0}
        alvo = float(m.get("pago") or 0)
        d = abs(nosso["pago"] - alvo)
        rel = (d / alvo) if alvo else (0.0 if not nosso["pago"] else 1.0)
        if rel <= 0.01:
            dentro += 1
        else:
            fora += 1
            piores.append((d, ibge, alvo, nosso["pago"]))
    print("\n=== conferência com {} ===".format(map_json))
    print("municípios dentro de 1% no pago: {} de {}".format(dentro, dentro + fora))
    piores.sort(reverse=True)
    for d, ibge, alvo, nosso in piores[:10]:
        print("  {}  referência={:>18,.2f}  nosso={:>18,.2f}  delta={:+.2f}%".format(
            ibge, alvo, nosso, ((nosso - alvo) / alvo * 100) if alvo else 0.0))


# ============================================================================
# main
# ============================================================================

def main():
    load_dotenv()
    ap = argparse.ArgumentParser(
        description="Seed de emendas parlamentares federais por município (PB).")
    ap.add_argument("--inspect", action="store_true",
                    help="colunas + fases + safras da PB (usa o arquivo do ano --ate)")
    ap.add_argument("--offline", action="store_true",
                    help="regenera o seed do snapshot (não baixa nada)")
    ap.add_argument("--zips", default="", help="diretório com ZIPs já baixados")
    ap.add_argument("--desde", type=int, default=int(env("EMENDAS_DESDE", "0")) or DESDE_DEFAULT,
                    help="safra mínima da emenda (ano da emenda >= AAAA). Default: {}.".format(
                        DESDE_DEFAULT))
    ap.add_argument("--ate", type=int, default=int(env("EMENDAS_ATE", "0")) or datetime.now().year,
                    help="safra máxima / último arquivo anual. Default: ano corrente.")
    ap.add_argument("--conferir", default="",
                    help="JSON de referência [{ibge, empenhado, pago}] para comparar")
    ap.add_argument("--snapshot", default=str(SNAPSHOT))
    ap.add_argument("--write-mongo", action="store_true")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""))
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_path = Path(args.snapshot)
    zip_dir = Path(args.zips) if args.zips else DATA_DIR

    if args.desde > args.ate:
        sys.exit("--desde ({}) não pode ser maior que --ate ({}).".format(args.desde, args.ate))

    if args.inspect:
        zp = zip_dir / "_emendas_documentos_{}.zip".format(args.ate)
        if not zp.exists():
            zp = download_zip(args.ate, zip_dir)
        return _inspect(zp)

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — janela {}, {} municípios.".format(
            snapshot.get("fetchedAt"), snapshot.get("janela"),
            len(snapshot.get("municipios") or {})), file=sys.stderr)
    else:
        code_set = set(c for c, _ in municipios_canonicos())
        zips = []
        for ano in anos_arquivo(args.desde, args.ate):
            zp = zip_dir / "_emendas_documentos_{}.zip".format(ano)
            zips.append(zp if zp.exists() else download_zip(ano, zip_dir))
        municipios, sem_mun, meta, nomes = harvest(zips, code_set, args.desde, args.ate)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "fonte": "portal-da-transparencia-cgu",
            "dataset": SOURCE_DATASET,
            "esfera": ESFERA,
            "janela": {"de": args.desde, "ate": args.ate},
            "criterioUniverso": "ano da emenda",
            "criterioQuebraAnual": "ano do documento de despesa",
            "totalLinhas": meta["totalLinhas"], "linhasPB": meta["linhasPB"],
            "safras": meta["safras"],
            "nEmendasPB": meta["nEmendasPB"], "nAutoresPB": meta["nAutoresPB"],
            "municipios": municipios, "semMunicipioPB": sem_mun,
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1),
                                 encoding="utf-8")
        print("[emendas] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    if args.conferir:
        _conferir(snapshot, args.conferir)

    docs, m = build_docs(snapshot)
    out = emit(docs, m["ref"], m["janela"])
    tot, sem = m["tot"], m["sem"]
    print("emendas federais (janela {}–{}, safra da emenda): {}/223 municípios com valor.".format(
        m["janela"]["de"], m["janela"]["ate"], tot["com"]))
    print("Municipalizado: R$ {:,.2f} empenhado · R$ {:,.2f} pago.".format(
        tot["empenhado"], tot["pago"]))
    if sem.get("empenhado") or sem.get("pago"):
        print("Fora do total municipal (aplicação estadual/nacional): "
              "R$ {:,.2f} empenhado · R$ {:,.2f} pago.".format(
                  sem.get("empenhado", 0.0), sem.get("pago", 0.0)))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, docs)


if __name__ == "__main__":
    main()
