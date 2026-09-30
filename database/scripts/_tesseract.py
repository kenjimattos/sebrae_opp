#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cliente da API Tesseract do Observatório Sebrae + emissão de seeds de `stateValues`.

POR QUE UM MÓDULO COMPARTILHADO, E NÃO CÓDIGO EM CADA GERADOR
    Os geradores do grão estadual (`gerar_seed_uf_*.py`) dividem quatro coisas que
    não são específicas de indicador nenhum: o cliente HTTP da Tesseract, a lista
    canônica das 27 UFs, o cálculo da posição da PB entre pares e o formato do seed
    de `stateValues`. O precedente do repo é este mesmo — `_seeds.py` e `_tercis.py`
    existem pela mesma razão.

A API
    base = https://apiv2-observatorio.sebrae.com.br/tesseract  (pública, sem auth)
      GET /cubes                          -> catálogo de 81 cubos
      GET /members?cube=&level=           -> membros de um nível
      GET /data.jsonrecords?cube=&drilldowns=&measures=&<Nível>=<chaves>

    A resposta NUNCA vem aninhada: é sempre uma linha plana por combinação de
    categorias, com o par `<Nível> ID` / `<Nível>` e a medida. Agrupar é trabalho
    de quem consome — é daqui que sai o `breakdown` das distribuições.

A ARMADILHA DA 28ª UF
    O cubo RAIS_workers devolve **28** unidades no nível `State`, não 27: há um
    `State ID 99 = "Não informado"` (4.113 vínculos em 2025). Ele entrava no cálculo
    de posição e deslocava o ranking em uma casa. `ufs_validas()` filtra pela lista
    canônica do IBGE, então o descarte é por regra e não por caso particular.

POSIÇÃO NÃO É RÉGUA
    `posicao()` devolve onde a PB está entre as 27 UFs e entre as 9 do Nordeste.
    Isso é INFORMAÇÃO, não classificação: nenhum indicador estadual tem `threshold`.
    O motivo está medido em `database/setup.mongodb.js` (coleção `stateValues`) e no
    CHANGELOG — tercilando contra as 27 UFs, 7 dos 8 caem na faixa do meio.
"""
from __future__ import annotations

import json
import ssl
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"

API_BASE = "https://apiv2-observatorio.sebrae.com.br/tesseract"
PB = "25"          # Paraíba na dimensão Geography/State
UF_PB = 25

# As 27 unidades da federação, pelos códigos do IBGE. Serve de filtro: ver a
# armadilha da 28ª UF no topo deste arquivo.
UFS_IBGE = {
    11, 12, 13, 14, 15, 16, 17,          # Norte
    21, 22, 23, 24, 25, 26, 27, 28, 29,  # Nordeste
    31, 32, 33, 35,                      # Sudeste
    41, 42, 43,                          # Sul
    50, 51, 52, 53,                      # Centro-Oeste + DF
}
NORDESTE = {21, 22, 23, 24, 25, 26, 27, 28, 29}

# A Tesseract serve por HTTPS com cadeia que não valida em todo ambiente; os
# geradores que já consomem essa API (gerar_seed_crescimento_mpe.py,
# gerar_seed_bolsa_familia.py) fazem o mesmo. É dado público e agregado.
_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


def _get(url: str, timeout: int = 240) -> bytes:
    req = urllib.request.Request(
        url, headers={"Accept": "application/json", "User-Agent": "opp-seed/1.0"}
    )
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def consultar(cube: str, drilldowns: str, measures: str, **cortes) -> list[dict]:
    """GET /data.jsonrecords. `cortes` são filtros por nível (ex.: State='25').

    Chave com espaço é normal aqui ('Active worker indicator'), então os cortes
    entram como kwargs só quando o nome é identificador válido; o resto vai por
    **{...} no chamador.
    """
    params = {"cube": cube, "drilldowns": drilldowns, "measures": measures}
    params.update({k: v for k, v in cortes.items() if v is not None})
    url = f"{API_BASE}/data.jsonrecords?" + urllib.parse.urlencode(
        params, quote_via=urllib.parse.quote
    )
    payload = json.loads(_get(url))
    return payload.get("data", [])


def ufs_validas(rows: list[dict]) -> list[dict]:
    """Descarta o que não é uma das 27 UFs (ver a armadilha da 28ª no topo)."""
    return [r for r in rows if r.get("State ID") in UFS_IBGE]


def somar_por_uf(rows: list[dict], measure: str, ano: int | None = None) -> dict[int, float]:
    """UF -> soma da medida. Agrega o que o drilldown partiu em categorias."""
    out: dict[int, float] = {}
    for r in ufs_validas(rows):
        if ano is not None and r.get("Year") != ano:
            continue
        v = r.get(measure)
        if v is None:
            continue
        out[r["State ID"]] = out.get(r["State ID"], 0.0) + float(v)
    return out


def posicao(por_uf: dict[int, float], maior_melhor: bool = True,
            denominador: dict[int, float] | None = None) -> dict | None:
    """Onde a PB está entre as 27 UFs e entre as 9 do Nordeste.

    `denominador` normaliza antes de ordenar (tipicamente população): contagem
    bruta entre UFs mede o TAMANHO do estado, não o desempenho — é a mesma
    armadilha que `normalizedValue` resolve no grão municipal. Medido: nº de
    empregados é 16º no bruto e 19º per capita; matrículas no superior é 14º no
    país e 1º do Nordeste per capita.

    Devolve None quando a PB não está na resposta — sem inventar posição.
    """
    vals = dict(por_uf)
    if denominador is not None:
        # Denominador vazio significa que a normalização foi PEDIDA e não pôde ser
        # atendida — normalmente por ano fora da série de população. Cair no ranking
        # bruto aqui seria a mesma degradação silenciosa que `classifiedNumber` evita
        # no grão municipal: sairia um `normalizado: false` com cara de intencional, e
        # o número seria o tamanho da UF em vez do indicador. Melhor quebrar.
        if not denominador:
            raise ValueError(
                'denominador vazio: a normalização foi pedida e não há população para o ano. '
                'Ver populacoes_uf_recente() — não deixe cair no ranking bruto.'
            )
        vals = {
            uf: v / denominador[uf] * 1000
            for uf, v in vals.items()
            if denominador.get(uf)
        }
    if UF_PB not in vals:
        return None

    def ordenar(escopo: dict[int, float]) -> list[int]:
        return sorted(escopo, key=lambda uf: -escopo[uf] if maior_melhor else escopo[uf])

    ne = {uf: v for uf, v in vals.items() if uf in NORDESTE}
    out = {
        "entreUfs": ordenar(vals).index(UF_PB) + 1,
        "totalUfs": len(vals),
        "entreNordeste": ordenar(ne).index(UF_PB) + 1,
        "totalNordeste": len(ne),
        "normalizado": bool(denominador),
    }
    if denominador:
        out["valorNormalizado"] = round(vals[UF_PB], 2)
        out["unidadeNormalizada"] = "/1k hab."
    # Explícito no documento: posição é comparação, não classificação. Quem lê o
    # breakdown no futuro não precisa saber desta conversa para não virar régua.
    out["nota"] = "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"
    return out


def populacoes_uf_recente() -> tuple[str, dict[int, float]]:
    """(ano, {uf: população}) do ano MAIS RECENTE que a série do IBGE tem.

    Para indicadores de estoque sem ano próprio (`uf-empresas-ativas`, coletado em
    2026 quando a série de população termina em 2025). Pedir a população do ano da
    coleta devolvia vazio, e a posição caía no ranking bruto sem avisar.
    """
    rows = consultar("IBGE", "State,Year", "Population")
    anos = sorted({r["Year"] for r in ufs_validas(rows) if r.get("Year") is not None})
    if not anos:
        raise SystemExit("cubo IBGE não devolveu anos — sem denominador para normalizar.")
    ultimo = max(anos)
    return str(ultimo), somar_por_uf(rows, "Population", ultimo)


def coletar_populacoes(anos) -> dict[str, dict[str, float]]:
    """{ano: {uf: população}} pronto para ir DENTRO do snapshot do gerador.

    Existe porque `--offline` tem de ser offline de verdade: as posições per capita
    precisam da população das 27 UFs, e se o gerador a buscasse na hora, o modo
    offline continuaria batendo na API — passando enquanto há rede e quebrando
    exatamente quando ela falta, que é quando o modo serve para algo. Chaves em
    string porque o destino é JSON.
    """
    return {str(a): {str(uf): v for uf, v in populacoes_uf(str(a)).items()} for a in anos}


def pops_do_snapshot(guardado: dict, ano) -> dict[int, float]:
    """Lê de volta o que `coletar_populacoes` gravou, com as chaves de volta a int."""
    return {int(uf): float(v) for uf, v in (guardado or {}).get(str(ano), {}).items()}


def populacoes_uf(ano: str) -> dict[int, float]:
    """UF -> população estimada. Denominador das posições per capita.

    Cubo `IBGE` (PIB Municipal), não `DATASUS_Estimativas_Populacionais`: o do
    DATASUS para em 2021, o do IBGE chega a 2025.
    """
    rows = consultar("IBGE", "State,Year", "Population", Year=ano)
    return somar_por_uf(rows, "Population", int(ano))


# ---------- formatação ----------

def br_int(value: float) -> str:
    """914955 -> '914.955' (padrão BR, sem casas)."""
    return f"{int(round(value)):,}".replace(",", ".")


def br_dec(value: float, casas: int = 2) -> str:
    """3036.4712 -> '3.036,47' (padrão BR)."""
    inteiro, _, frac = f"{value:,.{casas}f}".partition(".")
    return inteiro.replace(",", ".") + ("," + frac if frac else "")


# ---------- snapshot versionado ----------

def salvar_snapshot(nome: str, payload) -> Path:
    """Grava a resposta crua em database/data/, para permitir --offline."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    caminho = DATA_DIR / nome
    caminho.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return caminho


def ler_snapshot(nome: str):
    caminho = DATA_DIR / nome
    if not caminho.exists():
        raise SystemExit(f"Snapshot não encontrado: {caminho}. Rode online uma vez primeiro.")
    return json.loads(caminho.read_text(encoding="utf-8"))


# ---------- emissão do seed ----------

_HEADER = """// ARQUIVO GERADO por database/scripts/{script} — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def _js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emitir_seed(script: str, arquivo: str, indicadores: list[dict], valores: list[dict],
                comentario_valores: str = "") -> Path:
    """Escreve um seed de grão estadual: catálogo em `indicators` + `stateValues`.

    Duas diferenças em relação aos seeds municipais, e as duas importam:
      - os valores vão para **stateValues**, com chave {uf, indicatorId, referenceYear};
      - o catálogo usa `placements: [{section: 'estadual'}]`, seção que o
        `catalog.ts` não conhece — por isso estes indicadores não entram em agenda
        nenhuma nem nas opções do mapa.

    O catálogo vai com `replaceOne`, como os outros 26: o documento vira exatamente
    o que este seed declara, então campo removido daqui some do banco (CLAUDE.md,
    armadilhas). Nenhum destes indicadores declara `threshold`, de propósito.
    """
    ids = ", ".join(i["_id"] for i in indicadores)
    lines = [_HEADER.format(script=script), "", f"// --- 1) Catálogo: {ids} (seção estadual) ---"]
    lines.append("const indicators = [")
    for ind in indicadores:
        assert "threshold" not in ind, f"{ind['_id']}: indicador estadual não leva threshold"
        lines.append(f"  {_js(ind)},")
    lines.append("]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(estadual) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por UF × ano ({len(valores)} docs) ---")
    if comentario_valores:
        for linha in comentario_valores.strip().splitlines():
            lines.append(f"// {linha.strip()}")
    lines.append("const values = [")
    for v in sorted(valores, key=lambda x: (x["indicatorId"], x["referenceYear"])):
        lines.append(f"  {_js(v)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { uf: v.uf, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.stateValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`stateValues -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    caminho = SEED_DIR / arquivo
    caminho.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return caminho
