#!/usr/bin/env python3
"""
Gera os seeds (mongosh) de DOIS indicadores de escolaridade da força de trabalho
formal, no banco da OPP:

    - trabalhadores-medio-completo    "Trabalhadores formais com Ensino Médio Completo"
    - trabalhadores-superior-completo "Trabalhadores formais com Ensino Superior Completo"

Os dois saem do MESMO campo de escolaridade da RAIS, então é UMA consulta que
produz os DOIS seeds.

------------------------------------------------------------------------------
FONTE: este é o primeiro indicador que vem DIRETO da base RAIS do Sebrae (Mongo
acessado por túnel SSH), e NÃO da basedosdados/BigQuery. É o piloto do fluxo
"Sebrae -> OPP". O princípio é o mesmo dos demais gerar_seed_*.py: a agregação
(90M+ vínculos -> 223 linhas) roda NA ORIGEM (aggregation pipeline server-side),
e só o resultado pequeno desce. Nunca replicamos os microdados crus.

  base origem:  Mongo do Sebrae, db `RAIS`, uma coleção por ano: `2024_VINC`
                (VINC = vínculos). Cada doc = 1 vínculo empregatício.
  agregação:    $match PB + vínculo ativo 31/12  ->  $group por município×escolaridade
  destino:      database/seed/indicador-trabalhadores-{medio,superior}-completo.mongodb.js

------------------------------------------------------------------------------
GOTCHAS da RAIS crua (≠ basedosdados, que já harmoniza):

  1. MUNICÍPIO em 6 dígitos = código IBGE SEM o dígito verificador. Os 223
     códigos canônicos da OPP têm 7 dígitos; casamos pelos 6 primeiros
     (id_7dig[:6] == rais_6dig). PB => prefixo "25".

  2. ESCOLARIDADE = código 1..11 (layout RAIS "Escolaridade após 2005"):
       1 Analfabeto · 2 Até 5ª inc. · 3 5ª compl. · 4 6ª a 9ª · 5 Fund. compl.
       6 Médio inc. · 7 MÉDIO COMPLETO · 8 Superior inc. · 9 SUPERIOR COMPLETO
       10 Mestrado · 11 Doutorado
     -> Médio Completo = {7};  Superior Completo = {9}.
     mestrado/doutorado (10/11) NÃO entram no numericValue de "superior completo"
     (que é estritamente cód. 9), mas ficam no breakdown p/ uma eventual leitura
     "superior ou mais".

  3. NOMES DOS CAMPOS variam conforme como o Sebrae carregou o dump. NÃO dá pra
     adivinhar — rode `--inspect` UMA vez, confira o doc de exemplo + a
     distribuição de escolaridade, e ajuste as constantes CAMPO_* abaixo (ou via
     env RAIS_CAMPO_*). Só então rode de verdade.

SEM CLASSIFICAÇÃO (semáforo): contagem bruta da RAIS, sem faixa oficial
bom/atenção/alerta (mesma decisão de trabalhadores-ct). Entra SEM `threshold`.
O breakdown carrega o denominador (total de vínculos) e o percentual, então o
front pode exibir como share se quiser — mais comparável entre municípios de
portes diferentes que a contagem absoluta.

Cobertura: 223 municípios da PB (lista canônica vem do seed de municípios).
Municípios sem vínculo na faixa entram com 0.

------------------------------------------------------------------------------
Uso:

  # 0) abra o túnel SSH num terminal (mantém aberto):
  ssh -L 27017:localhost:27017 usr_RAIS@HOST_DO_SEBRAE
  #    ou deixe o script abrir o túnel: passe --ssh-host/--ssh-user/--ssh-key

  # 1) CALIBRE: veja um doc e a distribuição de escolaridade
  python3 database/scripts/gerar_seed_escolaridade.py --inspect \
      --mongo-user usr_RAIS --mongo-pass '***' --collection 2024_VINC

  # 2) ajuste as constantes CAMPO_* se o --inspect mostrar nomes diferentes

  # 3) RODE: agrega na origem, salva snapshot e emite os 2 seeds
  python3 database/scripts/gerar_seed_escolaridade.py \
      --mongo-user usr_RAIS --mongo-pass '***' --collection 2024_VINC

  # 4) offline: regenera os seeds a partir do snapshot, sem reconsultar
  python3 database/scripts/gerar_seed_escolaridade.py --offline

Requer:  pip install pymongo   (e sshtunnel, se for o script a abrir o túnel)
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import List  # 3.6: o host do ETL (10.1.141.23) só tem Python 3.6, sem `list[...]`

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
SNAPSHOT = DATA_DIR / "escolaridade_pb_2024.json"

# Lake do Sebrae: mesmo IP p/ conexão direta (da 10.1.141.23) e p/ remote_bind do túnel.
# Cada base tem credencial usr_<BASE>:usr_<BASE> (authSource admin) — derivada no main().
LAKE_HOST = "10.19.4.174"

ANO = "2024"  # última RAIS consolidada; muda junto com --collection (ex.: 2024_VINC)
SOURCE = (
    "RAIS — vínculos formais ativos em 31/12/{ano}, por grau de instrução "
    "(layout 'Escolaridade após 2005') — base RAIS do Sebrae (acesso direto)"
)
SOURCE_DATASET = "sebrae_rais"

# --- nomes dos campos na coleção crua do Sebrae --------------------------------
# Confirmados num doc de exemplo da RAIS.2024_VINC (jun/2026): MAIÚSCULAS, sem
# acento. Sobrescreva por env RAIS_CAMPO_* se a coleção de outro ano divergir.
# Bônus: a coleção tem CBO_OCUPACAO_2002 -> dá pra refazer trabalhadores-ct aqui.
CAMPO_MUNICIPIO = env("RAIS_CAMPO_MUNICIPIO", "MUNICIPIO")           # int, 6 díg (IBGE s/ DV)
CAMPO_ESCOLARIDADE = env("RAIS_CAMPO_ESCOLARIDADE", "ESCOLARIDADE_APOS_2005")  # int 1..11
CAMPO_VINCULO_ATIVO = env("RAIS_CAMPO_VINCULO_ATIVO", "VINCULO_ATIVO_31_12")   # 1 = ativo
# valor que marca vínculo ativo em 31/12 (1 = ativo). Deixe None p/ não filtrar.
VINCULO_ATIVO_VALOR = 1

# --- códigos de escolaridade (layout "Escolaridade após 2005") ----------------
COD_MEDIO_COMPLETO = 7
COD_SUPERIOR_COMPLETO = 9
COD_MESTRADO = 10
COD_DOUTORADO = 11

# --- definição dos dois indicadores -------------------------------------------
IND_MEDIO = {
    "id": "trabalhadores-medio-completo",
    "label": "Trabalhadores formais com Ensino Médio Completo",
    "description": (
        "Número de trabalhadores com vínculo formal ativo em 31/12 cujo grau de "
        "instrução é Ensino Médio Completo (RAIS)."
    ),
    "agenda_order": 2,  # educacao: 1=isdel-educacao-emp, 2=médio, 3=superior
}
IND_SUPERIOR = {
    "id": "trabalhadores-superior-completo",
    "label": "Trabalhadores formais com Ensino Superior Completo",
    "description": (
        "Número de trabalhadores com vínculo formal ativo em 31/12 cujo grau de "
        "instrução é Ensino Superior Completo (RAIS). Mestrado e doutorado ficam "
        "no breakdown, fora da contagem estrita de 'superior completo'."
    ),
    "agenda_order": 3,
}
AGENDA_ID = "educacao"  # casa natural; ajuste se preferir outra agenda


# ============================================================================
# 1) ORIGEM: agrega na base RAIS do Sebrae (Mongo via túnel SSH)
# ============================================================================

def _build_match() -> dict:
    """Filtro server-side: só PB (município começa em 25) e, se configurado,
    vínculo ativo em 31/12. Roda na origem antes do $group."""
    match: dict = {
        # PB: 6-dig começa em "25". Compara como string (campo pode ser int).
        "$expr": {"$eq": [{"$substr": [{"$toString": f"${CAMPO_MUNICIPIO}"}, 0, 2]}, "25"]},
    }
    if VINCULO_ATIVO_VALOR is not None:
        # aceita o valor como int OU string (dumps variam no tipo)
        match[CAMPO_VINCULO_ATIVO] = {"$in": [VINCULO_ATIVO_VALOR, str(VINCULO_ATIVO_VALOR)]}
    return match


def _esc_int() -> dict:
    """Expressão que lê a escolaridade como int (robusta a tipo/ausência)."""
    return {"$convert": {"input": f"${CAMPO_ESCOLARIDADE}", "to": "int", "onError": -1, "onNull": -1}}


def _conta(codigo: int) -> dict:
    """$sum condicional: conta vínculos cuja escolaridade == `codigo`."""
    return {"$sum": {"$cond": [{"$eq": [_esc_int(), codigo]}, 1, 0]}}


def _pipeline() -> List[dict]:
    """UMA linha por município (6-dig), faixas de escolaridade como colunas.
    Resultado: até 223 linhas, minúsculo. Bucketing feito na origem."""
    muni6 = {"$substr": [{"$toString": f"${CAMPO_MUNICIPIO}"}, 0, 6]}
    return [
        {"$match": _build_match()},
        {"$group": {
            "_id": muni6,
            "total": {"$sum": 1},
            "medio": _conta(COD_MEDIO_COMPLETO),
            "superior": _conta(COD_SUPERIOR_COMPLETO),
            "mestrado": _conta(COD_MESTRADO),
            "doutorado": _conta(COD_DOUTORADO),
        }},
        {"$project": {"_id": 0, "muni6": "$_id", "total": 1,
                      "medio": 1, "superior": 1, "mestrado": 1, "doutorado": 1}},
        {"$sort": {"muni6": 1}},
    ]


def fetch(args) -> List[dict]:
    """Conecta no Mongo do Sebrae (direto ou via túnel SSH), roda o pipeline e
    devolve 1 linha por município {muni6, total, medio, superior, mestrado, doutorado}.
    A redução 87M->~223 acontece no servidor."""
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
        print(f"[ssh] túnel aberto -> {args.ssh_host}, mongo em 127.0.0.1:{port}")

    try:
        client = MongoClient(
            host=host, port=port,
            username=args.mongo_user or None, password=args.mongo_pass or None,
            authSource=args.auth_db or args.mongo_db,  # lake usa usuários por base
            serverSelectionTimeoutMS=15000,
        )
        coll = client[args.mongo_db][args.collection]

        if args.inspect:
            _inspect(coll)
            sys.exit(0)

        print(f"[origem] agregando {args.mongo_db}.{args.collection} (pode levar minutos)…")
        rows = [
            {k: (r["muni6"] if k == "muni6" else int(r[k]))
             for k in ("muni6", "total", "medio", "superior", "mestrado", "doutorado")}
            for r in coll.aggregate(_pipeline(), allowDiskUse=True)
        ]
        if not rows:
            sys.exit("Agregação retornou 0 linhas — confira os nomes dos campos com --inspect.")
        return rows
    finally:
        if tunnel:
            tunnel.stop()


def _inspect(coll) -> None:
    """Modo calibração: 1 doc de exemplo + distribuição de escolaridade (PB).
    Use a saída pra conferir/ajustar as constantes CAMPO_* no topo do arquivo."""
    sample = coll.find_one()
    print("\n=== 1 documento de exemplo (chaves disponíveis) ===")
    if sample:
        for k, v in sample.items():
            print(f"  {k!r}: {v!r}  ({type(v).__name__})")
    print("\n=== checagem dos campos configurados ===")
    for nome, campo in [("município", CAMPO_MUNICIPIO), ("escolaridade", CAMPO_ESCOLARIDADE),
                        ("vínculo ativo", CAMPO_VINCULO_ATIVO)]:
        existe = sample and campo in sample
        print(f"  {nome:14s} -> {campo!r}  {'OK' if existe else 'NÃO ENCONTRADO — ajuste a constante'}")
    print("\n=== distribuição de escolaridade na PB (amostra do pipeline) ===")
    dist = defaultdict(int)
    dist_pipe = [{"$match": _build_match()}, {"$group": {"_id": _esc_int(), "n": {"$sum": 1}}}]
    for r in coll.aggregate(dist_pipe, allowDiskUse=True):
        dist[int(r["_id"])] += int(r["n"])
    rotulos = {7: "MÉDIO COMPLETO", 9: "SUPERIOR COMPLETO", 10: "Mestrado", 11: "Doutorado"}
    for cod in sorted(dist):
        marca = f"  <- {rotulos[cod]}" if cod in rotulos else ""
        print(f"  cód {cod:>3}: {dist[cod]:>12,} vínculos{marca}")
    print("\nSe os códigos 7 e 9 não aparecerem, o campo de escolaridade está errado.")


# ============================================================================
# 2) DESTINO: cruza com os 223 canônicos e emite os seeds
# ============================================================================

def br_int(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def canonical_municipios() -> List[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


_ZERO = {"medio": 0, "superior": 0, "mestrado": 0, "doutorado": 0, "total": 0}


def build_values(rows: List[dict], indicador: dict) -> List[dict]:
    """Monta os 223 docs de indicatorValues para um dos dois indicadores.
    rows = 1 linha por município {muni6, total, medio, superior, mestrado, doutorado}."""
    by6 = {r["muni6"]: r for r in rows}
    codes = canonical_municipios()
    extra = set(by6) - {c[:6] for c in codes}
    if extra:
        sys.exit("Códigos de município (6-dig) fora dos 223 da PB: " + ", ".join(sorted(extra))[:400])

    is_medio = indicador["id"] == IND_MEDIO["id"]
    source = SOURCE.format(ano=ANO)
    values = []
    for code in codes:
        b = by6.get(code[:6], _ZERO)
        count = b["medio"] if is_medio else b["superior"]
        total = b["total"]
        pct = round(100 * count / total, 1) if total else 0.0
        breakdown = {"totalVinculos": total, "percentual": pct}
        if not is_medio:  # superior expõe mestrado/doutorado p/ leitura "superior ou mais"
            breakdown["mestrado"] = b["mestrado"]
            breakdown["doutorado"] = b["doutorado"]
        values.append({
            "municipalityId": code,
            "indicatorId": indicador["id"],
            "rawValue": br_int(count),
            "numericValue": count,
            "referenceYear": ANO,
            "source": source,
            "isFictional": False,
            "breakdown": breakdown,
        })
    return values


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_escolaridade.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def build_indicator(indicador: dict) -> dict:
    """Documento do catálogo (coleção `indicators`). Usado tanto pelo seed quanto
    pelo write_mongo — fonte única do doc de catálogo."""
    return {
        "_id": indicador["id"],
        "label": indicador["label"],
        # sem `threshold`: dado bruto sem faixa oficial -> sem classificação.
        "referenceYear": ANO,
        "description": indicador["description"],
        "source": SOURCE.format(ano=ANO),
        "sourceDataset": SOURCE_DATASET,
        "unit": "vínculos",
        "placements": [{"section": "agenda", "agendaId": AGENDA_ID, "order": indicador["agenda_order"]}],
    }


def emit(indicador: dict, values: List[dict]) -> Path:
    indicator = build_indicator(indicador)
    iid = indicador["id"]
    lines = [HEADER, "", f"// --- 1) Catálogo: {indicador['label']} (agenda {AGENDA_ID}) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({iid}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), RAIS {ANO} ---")
    lines.append("// Contagem de vínculos formais ativos em 31/12 no grau de instrução.")
    lines.append("// Sem threshold -> sem semáforo. breakdown traz total e percentual.")
    lines.append("const values = [")
    for v in values:
        lines.append(f"  {js(v)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append(f"print(`indicatorValues({iid}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)")
    out = SEED_DIR / f"indicador-{iid}.mongodb.js"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


# ============================================================================
# 3) GUARDA-CORPOS + escrita direta no Mongo OPP
# ============================================================================

def validate(rows: List[dict]) -> None:
    """Falha ALTO se o resultado cheira a erro — em vez de gerar seed/escrever lixo.
    Foi assim que pegamos o export truncado em 100 linhas. Schema drift na origem
    não se evita; se detecta aqui e isola (muda 1 constante CAMPO_*, não o fluxo)."""
    munis = {r["muni6"] for r in rows}
    canon6 = {c[:6] for c in canonical_municipios()}
    total = sum(r["total"] for r in rows)
    medio = sum(r["medio"] for r in rows)
    superior = sum(r["superior"] for r in rows)

    problemas = []
    if len(munis) < 200:
        problemas.append(f"só {len(munis)} municípios com dados (esperado ~223) — export truncado/filtro errado?")
    if total < 100_000:
        problemas.append(f"total {br_int(total)} vínculos implausivelmente baixo (PB tem centenas de milhares) — truncado?")
    if medio == 0 or superior == 0:
        problemas.append(f"médio={medio}, superior={superior} — algum zerado sugere campo de escolaridade errado")
    fora = munis - canon6
    if fora:
        problemas.append("municípios fora da PB (6-dig): " + ", ".join(sorted(fora))[:200])
    if problemas:
        sys.exit("VALIDAÇÃO FALHOU (nada foi escrito):\n  - " + "\n  - ".join(problemas))

    ausentes = canon6 - munis
    print(f"[validação] OK — {len(munis)} municípios, {br_int(total)} vínculos "
          f"(médio={br_int(medio)}, superior={br_int(superior)})"
          + (f"; {len(ausentes)} municípios sem vínculo entram com 0" if ausentes else ""))


def write_mongo(args, indicadores: List[dict], values: List[dict]) -> None:
    """Upsert direto no Mongo OPP (indicators + indicatorValues). Mesma lógica de
    chave dos seeds .js — idempotente. Roda na 10.1.141.23, que vê o OPP local."""
    from datetime import datetime, timezone
    from pymongo import MongoClient, UpdateOne

    client = MongoClient(host=args.opp_host, port=args.opp_port,
                         username=args.opp_user or None, password=args.opp_pass or None,
                         authSource=args.opp_auth_db or args.opp_db,
                         serverSelectionTimeoutMS=15000)
    db = client[args.opp_db]

    db.indicators.bulk_write(
        [UpdateOne({"_id": i["_id"]}, {"$set": i}, upsert=True) for i in indicadores],
        ordered=False)
    now = datetime.now(timezone.utc)
    ops = [UpdateOne(
        {"municipalityId": v["municipalityId"], "indicatorId": v["indicatorId"], "referenceYear": v["referenceYear"]},
        {"$set": {**v, "updatedAt": now}}, upsert=True) for v in values]
    res = db.indicatorValues.bulk_write(ops, ordered=False)
    print(f"[write-mongo] OPP {args.opp_host}:{args.opp_port}/{args.opp_db} -> "
          f"indicators={len(indicadores)}, indicatorValues upserted={res.upserted_count} modified={res.modified_count}")


def main() -> None:
    load_dotenv()  # .env auto: dispensa `source` em cada terminal
    ap = argparse.ArgumentParser(description="Gera os seeds de escolaridade (médio/superior completo) da RAIS do Sebrae.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar o Mongo do Sebrae")
    ap.add_argument("--inspect", action="store_true", help="conecta e mostra 1 doc + distribuição de escolaridade; não gera seed")
    ap.add_argument("--query-only", action="store_true", help="só consulta o Sebrae e salva o snapshot; NÃO gera seed (p/ rodar na máquina que tem acesso ao Sebrae, sem o repo)")
    ap.add_argument("--snapshot", default=str(SNAPSHOT), help="caminho do snapshot JSON (default: database/data/escolaridade_pb.json)")
    ap.add_argument("--collection", default="2024_VINC", help="coleção de vínculos do ano (ex.: 2024_VINC)")
    # conexão Mongo ORIGEM = lake Sebrae (10.19.4.174; cada base é um usuário, ex. usr_RAIS:usr_RAIS)
    ap.add_argument("--mongo-host", default=env("RAIS_MONGO_HOST", LAKE_HOST))
    ap.add_argument("--mongo-port", type=int, default=int(env("RAIS_MONGO_PORT", "27018")))  # lake Sebrae em 27018
    ap.add_argument("--mongo-db", default=env("RAIS_MONGO_DB", "RAIS"))
    ap.add_argument("--mongo-user", default=env("RAIS_MONGO_USER", ""))
    ap.add_argument("--mongo-pass", default=env("RAIS_MONGO_PASS", ""))
    ap.add_argument("--auth-db", default=env("RAIS_AUTH_DB", "admin"), help="authSource do lake (usuários por base ficam no admin)")
    # destino OPP (--write-mongo): Mongo OPP, local na 10.1.141.23
    ap.add_argument("--write-mongo", action="store_true", help="além dos seeds, faz upsert direto no Mongo OPP (indicators + indicatorValues)")
    ap.add_argument("--opp-host", default=env("OPP_MONGO_HOST", "127.0.0.1"))
    ap.add_argument("--opp-port", type=int, default=int(env("OPP_MONGO_PORT", "27017")))
    ap.add_argument("--opp-db", default=env("OPP_MONGO_DB", "DadosOPP"))  # banco OPP na 10.1.141.23 (authSource = mesmo nome)
    ap.add_argument("--opp-user", default=env("OPP_MONGO_USER", ""))
    ap.add_argument("--opp-pass", default=env("OPP_MONGO_PASS", ""))
    ap.add_argument("--opp-auth-db", default=env("OPP_AUTH_DB", ""), help="authSource do OPP; vazio = usa --opp-db")
    # túnel SSH (opcional — só se o script for abrir o túnel)
    ap.add_argument("--ssh-host", default=env("RAIS_SSH_HOST", ""))
    ap.add_argument("--ssh-port", type=int, default=int(env("RAIS_SSH_PORT", "22")))
    ap.add_argument("--ssh-user", default=env("RAIS_SSH_USER", ""))
    ap.add_argument("--ssh-key", default=env("RAIS_SSH_KEY", ""))
    ap.add_argument("--ssh-password", default=env("RAIS_SSH_PASSWORD", ""))
    args = ap.parse_args()
    # credencial do lake: padrão usr_<BASE>:usr_<BASE> (cada base tem a sua). Só passe
    # --mongo-user/--mongo-pass (ou RAIS_MONGO_USER/PASS no .env) para sobrescrever.
    args.mongo_user = args.mongo_user or ("usr_" + args.mongo_db)
    args.mongo_pass = args.mongo_pass or ("usr_" + args.mongo_db)

    snapshot = Path(args.snapshot)

    if args.offline:
        if not snapshot.exists():
            sys.exit(f"Snapshot não encontrado: {snapshot}. Rode online (ou --query-only) uma vez primeiro.")
        rows = json.loads(snapshot.read_text(encoding="utf-8"))
        print(f"[offline] {len(rows)} linhas do snapshot {snapshot}.")
    else:
        rows = fetch(args)  # --inspect sai aqui dentro
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} linhas agregadas; snapshot salvo em {snapshot}")

    # --query-only: máquina que só tem acesso ao Sebrae (sem o repo). Para aqui —
    # leve o snapshot pro repo e rode --offline lá pra gerar os seeds.
    if args.query_only:
        print(f"[query-only] pronto. Leve {snapshot} pro repo e rode: "
              f"python3 database/scripts/gerar_seed_escolaridade.py --offline")
        return

    validate(rows)  # guarda-corpos: aborta antes de gerar/escrever se cheirar a erro

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    todos_indicadores, todos_values = [], []
    for indicador in (IND_MEDIO, IND_SUPERIOR):
        values = build_values(rows, indicador)
        out = emit(indicador, values)
        total = sum(v["numericValue"] for v in values)
        print(f"OK — {indicador['id']}: {len(values)} municípios, {br_int(total)} vínculos. -> {out.name}")
        todos_indicadores.append(build_indicator(indicador))
        todos_values.extend(values)

    if args.write_mongo:
        write_mongo(args, todos_indicadores, todos_values)


if __name__ == "__main__":
    main()
