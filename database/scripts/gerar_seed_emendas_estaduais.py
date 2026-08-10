#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o seed (mongosh) das **emendas parlamentares estaduais (ALPB) por município da PB** — a
partir da API de dados abertos da **CODATA/CGE-PB**, que alimenta o portal da transparência do
estado (transparencia.pb.gov.br/orcamento/emendas-parlamentares). Pública, sem chave.

    listagem_emendas  -> uma linha por emenda: deputado, secretaria, OBJETO (texto livre), valor
    execucao_emendas  -> por emenda: valorEmenda, valorEmpenhado, valorLiquidado, valorPago

As duas se juntam pela chave (ano, emenda). O join casa 96–99% das emendas.

== A ressalva central: a atribuição municipal é INFERIDA, não estruturada ==
Diferente do federal (que traz "Código IBGE do município de aplicação do recurso" pronto), aqui
**não existe campo de município**. Ele só aparece dentro do texto livre do `objeto`:

    "Transferir os recursos para a Prefeitura Municipal de PATOS-PB para a aquisição de ..."

O campo `beneficiarioFinal` existe no schema mas vem preenchido em só ~5% dos registros — não
serve como fonte. Então este gerador infere o município do texto, e por isso todo doc que ele
escreve leva `atribuicao: "texto-beneficiario"` (contra `"ibge"` do federal). **A UI deve rotular
esses valores como estimativa** — nunca somá-los ao federal num número único sem ressalva.

== Regra de atribuição (conservadora, por desenho) ==
Só conta como transferência municipal quando o **beneficiário** declarado é o próprio município:

    (para|ao|aos|destinar|repassar) + [artigo] + (Município | Prefeitura [Municipal] |
                                                  Fundo Municipal ...) + de + <NOME>

E rejeita quando há uma **entidade nomeada** antes do município no mesmo trecho — nesse caso o
município é o endereço dela, não o destino. Essa distinção é o que separa

    "Transferir para o Município de João Pessoa, pessoa jurídica de direito público"   -> conta
    "Transferir para o Hospital de Trauma, localizado no município de João Pessoa"     -> NÃO

Sem essa regra, João Pessoa aparece com 2,5x o valor real (entidades estaduais são sediadas lá).
Emendas para ONGs, APAEs, associações e órgãos estaduais ficam **fora** do total municipal — vão
para o doc de `escopo: "estado"`, mesma lógica do gerador federal.

Tratamentos menores, todos vistos nos dados reais: preposições fora do padrão ("ao Município de"),
palavras coladas ("omunicípiode REMÍGIO"), e três municípios renomeados cujo texto usa o nome
novo e o nosso seed canônico o antigo (ver ALIASES).

== Qualidade medida (ago/2026, janela 2021–2025) ==
Confrontado com o painel da Datapedia, que parte da MESMA fonte e declara na nota técnica ter
feito a mesma padronização manual de nomes:

    municipalizado nosso      R$ 314.781.635,57  (61,9% do total)
    municipalizado Datapedia  R$ 331.135.100,57  (65,2%)   -> delta agregado -4,94%
    municípios dentro de  1%  124 de 223 (55,6%)
    municípios dentro de  5%  134 de 223 (60,1%)
    municípios dentro de 15%  177 de 223 (79,4%)

Ou seja: o agregado é próximo, o município a município diverge. Isso é o teto do método — nem a
Datapedia municipaliza tudo (só 65%), e a regra exata deles não é publicada. Não persiga
convergência total: o honesto é exibir como estimativa. `--conferir <map.json>` refaz a medida.

== Diferença de semântica em `porAno` (importante) ==
No gerador FEDERAL, `porAno` é pelo **ano do documento** de despesa (quando o dinheiro se moveu).
Aqui não há documento: a execução vem agregada por emenda. Então `porAno` é pela **safra da
emenda**, e o doc leva `criterioQuebraAnual` dizendo isso. Não compare as duas séries lado a lado
como se fossem a mesma coisa.

== USO ==
    python3 gerar_seed_emendas_estaduais.py --inspect     # shape da API + cobertura do join
    python3 gerar_seed_emendas_estaduais.py               # consulta a API, gera snapshot + seed
    python3 gerar_seed_emendas_estaduais.py --offline     # regenera o seed do snapshot
    python3 gerar_seed_emendas_estaduais.py --write-mongo # + OPP_MONGO_USER/PASS no .env
    python3 gerar_seed_emendas_estaduais.py --conferir map.json   # mede contra uma referência
    python3 gerar_seed_emendas_estaduais.py --amostra-nao-atribuidas 20   # auditar o resíduo

Requer só a stdlib (urllib/json). --write-mongo requer 'pip install pymongo<4'.
Compatível com Python 3.6 (sem f-strings / list[...]).
"""
import argparse
import collections
import json
import os
import re
import sys
import unicodedata
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
SNAPSHOT = DATA_DIR / "emendas_estaduais_pb.json"
SEED_FILE = SEED_DIR / "emendas-estaduais.mongodb.js"

API = "https://api.dadosabertos.codata.pb.gov.br/api/v1/orcamento"
PER_PAGE = 1000                  # teto da API
ESFERA = "estadual"
DESDE_DEFAULT = 2021             # primeira safra publicada no conjunto

SOURCE = (
    "CODATA/CGE-PB — API de dados abertos do Portal da Transparência do Estado da Paraíba "
    "(listagem e execução de emendas parlamentares da ALPB). Município inferido do objeto"
)
SOURCE_DATASET = "codata_pb_emendas_parlamentares"

# Municípios renomeados: o texto das emendas usa o nome atual, o seed canônico da OPP
# (que segue a nomenclatura do GeoJSON/IBGE usada no mapa) ainda traz o antigo.
ALIASES = {
    "2516409": "Tacima",                  # ex-Campo de Santana
    "2515401": "São Vicente do Seridó",   # ex-Seridó
    "2513653": "Joca Claudino",           # ex-Santarém
}

# Entidade nomeada: se aparecer ANTES do município no trecho do beneficiário, o município
# é o endereço dela e a emenda não é uma transferência municipal.
ENTIDADE = re.compile(
    r"\b(INSTITUTO|FUNDACAO|HOSPITAL|ASSOCIACAO|APAE|COOPERATIVA|CLUBE|IGREJA|PAROQUIA"
    r"|SOCIEDADE|SINDICATO|FEDERACAO|CONSELHO|ABRIGO|CENTRO|ENTIDADE|EMPRESA|UNIVERSIDADE"
    r"|ESCOLA|CRECHE|SECRETARIA|FUNDO ESTADUAL|DEFENSORIA|POLICIA|COMANDO|AGENCIA"
    r"|DEPARTAMENTO|COLONIA|DISTRITO|PASTORAL|LIGA|GRUPO)\b")

BENEFICIARIO = re.compile(
    r"\b(?:PARA|AO|AOS|DESTINAR|DESTINADOS?|REPASSAR|TRANSFERIR)\s+(?:[AO]S?\s+)?"
    r"(MUNICIPIO|PREFEITURA\s+MUNICIPAL|PREFEITURA|FUNDO\s+MUNICIPAL(?:\s+[A-Z]+){0,5}?)"
    r"\s+D[EO]?\s+([A-Z\s]{3,40})")


# ============================================================================
# utilidades
# ============================================================================

def norm(s):
    """Maiúsculas sem acento, pontuação virando espaço. Separa palavras coladas
    ('omunicípiode REMÍGIO' aparece de verdade nos dados)."""
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").upper()
    for w in ("MUNICIPIOS", "MUNICIPIO", "PREFEITURA"):
        s = re.sub(r"(?<=[A-Z])" + w, " " + w, s)
        s = re.sub(w + r"(?=[A-Z])", w + " ", s)
    return re.sub(r"[^A-Z0-9]+", " ", s).strip()


def brl(v):
    return "{:,.2f}".format(v).replace(",", "#").replace(".", ",").replace("#", ".")


def fmt_reais(v):
    if v >= 1e9:
        return ("R$ {:.2f} bi".format(v / 1e9)).replace(".", ",")
    if v >= 1e6:
        return ("R$ {:.2f} mi".format(v / 1e6)).replace(".", ",")
    if v >= 1e3:
        return "R$ {:.0f} mil".format(v / 1e3)
    return "R$ {:.0f}".format(v)


def municipios_canonicos():
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    pares = re.findall(r'\{"_id": "(\d{7})", "name": "([^"]+)"', text)
    if len(pares) < 200:
        sys.exit("Esperava 223 municípios em {}, achei {}.".format(MUNICIPIOS_SEED, len(pares)))
    return pares


def indice_nomes(municipios):
    """[(nome normalizado, ibge)] ordenado do mais longo p/ o mais curto — casar
    'Riacho de Santo Antônio' antes de 'Riacho'."""
    pares = [(norm(n), i) for i, n in municipios]
    pares += [(norm(v), k) for k, v in ALIASES.items()]
    return sorted(pares, key=lambda t: -len(t[0]))


def get_json(url):
    import urllib.request
    req = urllib.request.Request(url, headers={
        "User-Agent": "SebraeOPP-ETL/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_ano(endpoint, ano):
    """Todas as páginas de um endpoint/ano. A API exige `ano` e limita per_page a 1000."""
    out = []
    pagina = 1
    while True:
        url = "{}/{}?ano={}&per_page={}&page={}".format(API, endpoint, ano, PER_PAGE, pagina)
        d = get_json(url)
        dados = d.get("dados") or []
        out.extend(dados)
        pag = d.get("paginacao") or {}
        if pagina >= int(pag.get("pages") or 1) or not dados:
            break
        pagina += 1
    return out


# ============================================================================
# atribuição
# ============================================================================

def atribuir(texto_norm, nomes_idx):
    """IBGE quando o beneficiário declarado é o próprio município; senão None."""
    posicoes = [p for p in (texto_norm.find(" PARA "), texto_norm.find(" AO "),
                            texto_norm.find(" AOS ")) if p != -1]
    inicio = min(posicoes) if posicoes else 0
    for m in BENEFICIARIO.finditer(texto_norm):
        if ENTIDADE.search(texto_norm[inicio:m.start()]):
            continue          # entidade nomeada antes => o município é endereço dela
        cauda = m.group(2).strip()
        for nome, ibge in nomes_idx:
            if cauda.startswith(nome):
                return ibge
    return None


def harvest(desde, ate, nomes_idx):
    """Consulta a API, atribui município e junta com a execução. Devolve o snapshot."""
    municipios = {}
    estado = {"valor": 0.0, "empenhado": 0.0, "pago": 0.0, "porAno": {}}
    nao_atribuidas = []
    n_emendas = n_atribuidas = 0
    autores = set()
    sem_execucao = 0

    for ano in range(desde, ate + 1):
        try:
            listagem = fetch_ano("listagem_emendas", ano)
        except Exception as e:  # noqa: BLE001
            print("[emendas-pb] aviso: listagem {} indisponível ({}). Pulando.".format(ano, e),
                  file=sys.stderr)
            continue
        try:
            execucao = fetch_ano("execucao_emendas", ano)
        except Exception as e:  # noqa: BLE001
            print("[emendas-pb] aviso: execução {} indisponível ({}).".format(ano, e),
                  file=sys.stderr)
            execucao = []

        # execução pode ter mais de uma linha por emenda (órgãos distintos) — somar.
        exec_por_emenda = {}
        for r in execucao:
            k = (r.get("emenda") or "").strip()
            if not k:
                continue
            a = exec_por_emenda.setdefault(k, {"empenhado": 0.0, "pago": 0.0})
            a["empenhado"] += float(r.get("valorEmpenhado") or 0)
            a["pago"] += float(r.get("valorPago") or 0)

        for row in listagem:
            n_emendas += 1
            valor = float(row.get("valor") or 0)
            chave = (row.get("emenda") or "").strip()
            ex = exec_por_emenda.get(chave)
            if ex is None:
                sem_execucao += 1
                ex = {"empenhado": 0.0, "pago": 0.0}
            dep = (row.get("nomeDeputado") or "").strip()
            if dep:
                autores.add(dep)

            ano_str = str(ano)
            estado["valor"] += valor
            estado["empenhado"] += ex["empenhado"]
            estado["pago"] += ex["pago"]
            slot = estado["porAno"].setdefault(ano_str, {"valor": 0.0, "empenhado": 0.0, "pago": 0.0})
            slot["valor"] += valor
            slot["empenhado"] += ex["empenhado"]
            slot["pago"] += ex["pago"]

            texto = norm(" ".join(x for x in (row.get("objeto"), row.get("beneficiarioFinal")) if x))
            ibge = atribuir(texto, nomes_idx)
            if not ibge:
                nao_atribuidas.append({
                    "emenda": chave, "ano": ano_str, "valor": round(valor, 2),
                    "deputado": dep, "objeto": (row.get("objeto") or "")[:200],
                })
                continue

            n_atribuidas += 1
            a = municipios.setdefault(ibge, {
                "valor": 0.0, "empenhado": 0.0, "pago": 0.0, "porAno": {},
                "nEmendas": 0, "autores": set()})
            a["valor"] += valor
            a["empenhado"] += ex["empenhado"]
            a["pago"] += ex["pago"]
            a["nEmendas"] += 1
            if dep:
                a["autores"].add(dep)
            s = a["porAno"].setdefault(ano_str, {"valor": 0.0, "empenhado": 0.0, "pago": 0.0})
            s["valor"] += valor
            s["empenhado"] += ex["empenhado"]
            s["pago"] += ex["pago"]

        print("[emendas-pb] {} varrido: {} emendas, {} linhas de execução.".format(
            ano, len(listagem), len(execucao)), file=sys.stderr)

    def fin(a):
        return {
            "valor": round(a["valor"], 2),
            "empenhado": round(a["empenhado"], 2),
            "pago": round(a["pago"], 2),
            "porAno": dict((k, dict((kk, round(vv, 2)) for kk, vv in v.items()))
                           for k, v in sorted(a["porAno"].items())),
            "nEmendas": a.get("nEmendas", 0),
            "nAutores": len(a["autores"]) if isinstance(a.get("autores"), set) else 0,
        }

    municipalizado = sum(a["valor"] for a in municipios.values())
    meta = {
        "nEmendas": n_emendas, "nAtribuidas": n_atribuidas, "nAutores": len(autores),
        "semExecucao": sem_execucao,
        "coberturaValor": round(municipalizado / estado["valor"], 4) if estado["valor"] else 0.0,
    }
    print("[emendas-pb] {} emendas; {} atribuídas a município ({:.1f}% do valor); "
          "{} sem linha de execução.".format(n_emendas, n_atribuidas,
                                             meta["coberturaValor"] * 100, sem_execucao),
          file=sys.stderr)
    return (dict((k, fin(v)) for k, v in municipios.items()), fin(estado), meta,
            sorted(nao_atribuidas, key=lambda r: -r["valor"]))


# ============================================================================
# build_docs + emit + write-mongo
# ============================================================================

def build_docs(snapshot):
    janela = snapshot["janela"]
    ref = str(janela["ate"])
    muni = snapshot["municipios"]
    estado = snapshot["estado"]
    meta = snapshot["meta"]
    docs = []
    tot = {"valor": 0.0, "empenhado": 0.0, "pago": 0.0, "com": 0}

    for ibge, _nome in municipios_canonicos():
        a = muni.get(ibge) or {"valor": 0.0, "empenhado": 0.0, "pago": 0.0,
                               "porAno": {}, "nEmendas": 0, "nAutores": 0}
        tot["valor"] += a["valor"]
        tot["empenhado"] += a["empenhado"]
        tot["pago"] += a["pago"]
        if a["valor"]:
            tot["com"] += 1
        docs.append({
            "_id": "{}:{}".format(ibge, ESFERA),
            "escopo": "municipio",
            "municipalityId": ibge,
            "esfera": ESFERA,
            "valor": a["valor"],
            "empenhado": a["empenhado"],
            "pago": a["pago"],
            "rawEmpenhado": fmt_reais(a["empenhado"]),
            "rawPago": fmt_reais(a["pago"]),
            "porAno": a["porAno"],
            "nEmendas": a["nEmendas"],
            "nAutores": a["nAutores"],
            "janela": janela,
            "atribuicao": "texto-beneficiario",
            "referenceYear": ref,
            "source": SOURCE,
            "isFictional": False,
        })

    nao_mun_valor = round(estado["valor"] - tot["valor"], 2)
    docs.append({
        "_id": "PB:{}".format(ESFERA),
        "escopo": "estado",
        "municipalityId": None,
        "esfera": ESFERA,
        "valor": estado["valor"],
        "empenhado": estado["empenhado"],
        "pago": estado["pago"],
        "rawEmpenhado": fmt_reais(estado["empenhado"]),
        "rawPago": fmt_reais(estado["pago"]),
        "porAno": estado["porAno"],
        "naoMunicipalizado": {
            "valor": nao_mun_valor,
            "empenhado": round(estado["empenhado"] - tot["empenhado"], 2),
            "pago": round(estado["pago"] - tot["pago"], 2),
            "nota": "emendas cujo beneficiário declarado não é um município (ONGs, APAEs, "
                    "associações, fundos e órgãos estaduais) ou cujo objeto não permite "
                    "identificar o destino; não entra em nenhum dos 223 municípios",
        },
        "nEmendas": meta["nEmendas"],
        "nAutores": meta["nAutores"],
        "janela": janela,
        "atribuicao": "texto-beneficiario",
        "referenceYear": ref,
        "source": SOURCE,
        "isFictional": False,
    })
    return docs, {"ref": ref, "janela": janela, "tot": tot, "estado": estado, "meta": meta}


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_emendas_estaduais.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
const database = db
"""


def js(obj):
    return json.dumps(obj, ensure_ascii=False)


def emit(docs, janela, meta):
    lines = [HEADER, ""]
    lines.append("// --- Emendas parlamentares ESTADUAIS (ALPB) por município da PB ---")
    lines.append("// Janela {}–{} (safra da emenda). Fonte: CODATA/CGE-PB, API de dados".format(
        janela.get("de"), janela.get("ate")))
    lines.append("// abertos do Portal da Transparência do Estado.")
    lines.append("//")
    lines.append("// ATENÇÃO: `atribuicao: 'texto-beneficiario'` — a origem NÃO tem campo de")
    lines.append("// município; ele é inferido do texto livre do objeto da emenda. Só {:.1f}% do".format(
        meta["coberturaValor"] * 100))
    lines.append("// valor é municipalizável; o resto é ONG/órgão estadual e fica no doc de")
    lines.append("// escopo 'estado'. A UI deve exibir como ESTIMATIVA, nunca somando ao federal")
    lines.append("// (que é exato) num número único sem ressalva.")
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
    lines.append("print(`emendas(estadual) -> upserted=${res.upsertedCount} "
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

def _inspect(ano):
    print("=== listagem_emendas / execucao_emendas — ano {} ===".format(ano))
    for ep in ("listagem_emendas", "execucao_emendas"):
        d = get_json("{}/{}?ano={}&per_page=1".format(API, ep, ano))
        pag = d.get("paginacao") or {}
        dados = d.get("dados") or []
        print("\n--- {} — total {} registros".format(ep, pag.get("total")))
        if dados:
            for k, v in dados[0].items():
                sv = repr(v)
                print("  {:26s} = {}".format(k, sv[:110] + ("…" if len(sv) > 110 else "")))
    listagem = fetch_ano("listagem_emendas", ano)
    execucao = fetch_ano("execucao_emendas", ano)
    chaves_exec = set((r.get("emenda") or "").strip() for r in execucao)
    casam = sum(1 for r in listagem if (r.get("emenda") or "").strip() in chaves_exec)
    com_benef = sum(1 for r in listagem if r.get("beneficiarioFinal"))
    print("\n=== cobertura do join (ano {}) ===".format(ano))
    print("  listagem: {} · execução: {} ({} chaves distintas)".format(
        len(listagem), len(execucao), len(chaves_exec)))
    print("  casam: {} ({:.1f}% da listagem)".format(casam, casam / len(listagem) * 100
                                                     if listagem else 0))
    print("  com beneficiarioFinal preenchido: {} ({:.1f}%) — por isso a atribuição vem do "
          "texto".format(com_benef, com_benef / len(listagem) * 100 if listagem else 0))


def _conferir(snapshot, map_json):
    """Compara com uma referência [{ibge, monetaryValue}] — só relatório."""
    dados = json.loads(Path(map_json).read_text(encoding="utf-8"))
    ref = {}
    for m in dados:
        v = m.get("monetaryValue", m.get("valor", m.get("pago")))
        ref[str(m["ibge"])] = float(v or 0)
    muni = snapshot["municipios"]
    nosso_tot = sum(a["valor"] for a in muni.values())
    ref_tot = sum(ref.values())
    print("\n=== conferência com {} ===".format(map_json))
    print("municipalizado nosso: {} · referência: {} · delta {:+.2f}%".format(
        brl(nosso_tot), brl(ref_tot),
        ((nosso_tot - ref_tot) / ref_tot * 100) if ref_tot else 0))
    for tol in (0.01, 0.05, 0.15):
        dentro = sum(1 for i, v in ref.items()
                     if v and abs((muni.get(i) or {}).get("valor", 0) - v) / v <= tol)
        print("  municípios dentro de {:3.0f}%: {} de {} ({:.1f}%)".format(
            tol * 100, dentro, len(ref), dentro / len(ref) * 100 if ref else 0))


def _amostra(nao_atribuidas, n):
    print("\n=== {} maiores emendas NÃO atribuídas a município ===".format(n))
    for r in nao_atribuidas[:n]:
        print("  {} {}  {:>16}  {}".format(r["ano"], r["emenda"], brl(r["valor"]),
                                           r["deputado"]))
        print("      {}…".format(r["objeto"][:150].replace("\n", " ")))


# ============================================================================
# main
# ============================================================================

def main():
    load_dotenv()
    ap = argparse.ArgumentParser(
        description="Seed de emendas parlamentares estaduais (ALPB) por município (PB).")
    ap.add_argument("--inspect", action="store_true",
                    help="shape dos dois endpoints + cobertura do join")
    ap.add_argument("--offline", action="store_true",
                    help="regenera o seed do snapshot (não consulta a API)")
    ap.add_argument("--desde", type=int, default=int(env("EMENDAS_PB_DESDE", "0")) or DESDE_DEFAULT,
                    help="safra mínima. Default: {}.".format(DESDE_DEFAULT))
    ap.add_argument("--ate", type=int, default=int(env("EMENDAS_PB_ATE", "0")) or datetime.now().year,
                    help="safra máxima. Default: ano corrente.")
    ap.add_argument("--conferir", default="",
                    help="JSON de referência [{ibge, monetaryValue}] para medir a atribuição")
    ap.add_argument("--amostra-nao-atribuidas", type=int, default=0,
                    help="lista as N maiores emendas sem município (auditoria do resíduo)")
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

    if args.desde > args.ate:
        sys.exit("--desde ({}) não pode ser maior que --ate ({}).".format(args.desde, args.ate))

    if args.inspect:
        return _inspect(args.ate)

    if args.offline:
        if not snapshot_path.exists():
            sys.exit("Snapshot não encontrado: {}. Rode online uma vez primeiro.".format(snapshot_path))
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        print("[offline] snapshot {} — janela {}, {} municípios.".format(
            snapshot.get("fetchedAt"), snapshot.get("janela"),
            len(snapshot.get("municipios") or {})), file=sys.stderr)
    else:
        nomes_idx = indice_nomes(municipios_canonicos())
        municipios, estado, meta, nao_atribuidas = harvest(args.desde, args.ate, nomes_idx)
        snapshot = {
            "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
            "fonte": "codata-cge-pb",
            "dataset": SOURCE_DATASET,
            "esfera": ESFERA,
            "janela": {"de": args.desde, "ate": args.ate},
            "criterioUniverso": "ano da emenda",
            "criterioQuebraAnual": "ano da emenda (a execução vem agregada, sem data de documento)",
            "metodoAtribuicao": "beneficiário municipal declarado no objeto (texto livre)",
            "municipios": municipios, "estado": estado, "meta": meta,
            "naoAtribuidas": nao_atribuidas[:200],
        }
        snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1),
                                 encoding="utf-8")
        print("[emendas-pb] snapshot salvo em {}".format(snapshot_path), file=sys.stderr)

    if args.conferir:
        _conferir(snapshot, args.conferir)
    if args.amostra_nao_atribuidas:
        _amostra(snapshot.get("naoAtribuidas") or [], args.amostra_nao_atribuidas)

    docs, m = build_docs(snapshot)
    out = emit(docs, m["janela"], m["meta"])
    tot, estado, meta = m["tot"], m["estado"], m["meta"]
    print("emendas estaduais (janela {}–{}): {}/223 municípios com valor; {} emendas, "
          "{} atribuídas.".format(m["janela"]["de"], m["janela"]["ate"], tot["com"],
                                  meta["nEmendas"], meta["nAtribuidas"]))
    print("Municipalizado: R$ {} valor · R$ {} empenhado · R$ {} pago.".format(
        brl(tot["valor"]), brl(tot["empenhado"]), brl(tot["pago"])))
    print("Total do estado: R$ {} valor ({:.1f}% municipalizável — o resto é ONG/órgão "
          "estadual).".format(brl(estado["valor"]), meta["coberturaValor"] * 100))
    print("OK — seed em {}".format(out))

    if args.write_mongo:
        write_mongo(args, docs)


if __name__ == "__main__":
    main()
