#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador **Tempo de abertura da empresa** (`tempo-abertura`)
da agenda "Simplificação e digitalização" da OPP, a partir dos microdados da Redesim.

Fonte: Portal de Estatística da Redesim (Mapa de Empresas), API REST pública
(sem autenticação) em https://estatistica.redesim.gov.br/tempos-abertura-redesim/
  - GET /periodos-disponiveis                              -> anos/meses disponíveis (2019+)
  - GET /exportar/solicitacoes/{UF}?mes=&ano=              -> XLSX (1 linha por solicitação)
  - GET /percentual-solicitacoes-abertura/{UF}?ano=&mes=  -> agregado UF (cross-check)

Janela: **últimos 12 meses** disponíveis (decisão do projeto jun/2026), acumulados para
dar amostra aos municípios pequenos (1 mês cobre ~43% dos 223; 12 meses ~84%).

INDICADOR: `tempo-abertura` = **tempo total de abertura** = viabilidade + validação
cadastral + registro/inscrição no CNPJ (colunas QTDE HH 11 + 17 + 24 do XLSX), em horas
úteis. NÃO inclui tempo do usuário, nem licenças/alvará de funcionamento.

> O irmão `tempo-viabilidade` (só a etapa de viabilidade) tem seu **próprio** gerador
> `gerar_seed_tempo_viabilidade.py` — mesma fonte, scripts independentes (um indicador não
> depende do outro), seguindo o padrão "uma fonte → um script → um seed" do projeto.

METODOLOGIA OFICIAL (validada contra o endpoint de agregado da própria Redesim):
  - `numericValue` = **marco de 75%** = percentil 75 do tempo (horas úteis) do município.
    É o que o painel oficial usa para colorir o ente ("a cor é a posição alcançada no
    marco de 75% dos processos") — equivale à faixa que contém o P75.
  - Faixas oficiais (1 dia = 24 horas úteis): 🟢 ≤72h (≤3d) · 🟡 72–120h (3–5d) ·
    🟠 120–168h (5–7d) · 🔴 >168h (>7d). Reproduz o oficial PB mai/2026 (95/3/1/1) e a
    média "0 dias 19 horas".

THRESHOLD (faixa oficial → semáforo OPP de 3 níveis): a régua oficial tem 4 faixas; o
semáforo da OPP tem 3 (success/warning/alert). Mapeamento que preserva os extremos:
  🟢 → success (Bom) ; 🟡+🟠 → warning (Atenção) ; 🔴 → alert (Crítico).
  => lower-better, success=72, warning=168 (horas úteis). Documentado no README.

Cobertura: os 223 municípios da PB. Municípios sem nenhuma abertura na janela (n=0)
entram com numericValue null / rawValue "—" / confiabilidade "sem-dados". Municípios
com n<30 entram com o valor calculado + flag de confiabilidade "baixa" (decisão jun/2026:
"publicar todos, marcar confiabilidade").

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-tempo-abertura.mongodb.js   (catálogo + valores)
  - database/data/tempo_abertura_pb.json                (snapshot versionado dos agregados)

Uso:
  python3 database/scripts/gerar_seed_tempo_abertura.py            # online (baixa 12 XLSX)
  python3 database/scripts/gerar_seed_tempo_abertura.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import statistics as st
import sys
import unicodedata
import urllib.request
from io import BytesIO
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"

# ---- identidade deste indicador (o que muda entre os geradores irmãos) ----
INDICATOR_ID = "tempo-abertura"
ORDER = 2  # posição na agenda simplificacao (espelha catalog.ts)
LABEL = "Tempo de abertura da empresa — marco 75% (h)"
DESCRIPTION = (
    "Tempo total de abertura da empresa (viabilidade + validação cadastral + "
    "registro/inscrição no CNPJ), em horas úteis, no marco de 75% dos processos "
    "(metodologia oficial da Redesim). Não inclui licenças nem alvará de funcionamento."
)
# Colunas (0-based) do XLSX somadas para o tempo deste indicador — ver aba "dicionario".
#   11 = QTDE. HH VIABILIDADE TOTAL ; 17 = QTDE. HH. LIBERAÇÃO DBE (validação cadastral) ;
#   24 = QTDE. HORAS DEFERIMENTO (registro/inscrição)
COLS_TEMPO = (11, 17, 24)
CROSSCHECK_ENDPOINT = "percentual-solicitacoes-abertura"
SNAPSHOT = DATA_DIR / "tempo_abertura_pb.json"
SEED_FILE = SEED_DIR / "indicador-tempo-abertura.mongodb.js"

# ---- constantes da fonte/metodologia (iguais nos dois geradores) ----
API_BASE = "https://estatistica.redesim.gov.br/tempos-abertura-redesim"
UF = "PB"
JANELA_MESES = 12
COL_MUNICIPIO = 26
SOURCE_BASE = "Redesim — Mapa de Empresas (estatistica.redesim.gov.br), microdados de tempo de abertura"
SOURCE_DATASET = "redesim_tempos_abertura"

# Municípios da PB renomeados (nome no XLSX -> slug do seed atual).
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
N_CONFIAVEL = 30  # n mínimo para confiabilidade "alta"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


# ---------- util ----------

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()


def br_num(value: float, casas: int = 1) -> str:
    return f"{value:.{casas}f}".replace(".", ",")


def _get(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"Accept": "*/*", "User-Agent": "opp-seed/1.0"})
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def p75(xs: list[float]) -> float:
    """Percentil 75 (marco de 75%) — quartil superior, método inclusivo."""
    if len(xs) == 1:
        return float(xs[0])
    return float(st.quantiles(sorted(xs), n=4, method="inclusive")[2])


def faixa_de(horas: float) -> int:
    if horas <= BANDA_VERDE:
        return 0
    if horas <= BANDA_AMARELO:
        return 1
    if horas <= BANDA_LARANJA:
        return 2
    return 3


# ---------- cobertura: os 223 municípios da PB ----------

def municipios_canonicos() -> tuple[list[str], dict[str, str]]:
    """Retorna (lista de IBGE ordenada, mapa slug->IBGE) do seed de municípios."""
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    # robusto a campos extras após o slug (ex.: rfCode): casa _id e slug no mesmo
    # objeto sem depender da chave de fechamento ([^}] não cruza a borda do doc).
    pares = re.findall(r'"_id":\s*"(\d{7})"[^}]*?"slug":\s*"([^"]*)"', text)
    if not pares:
        sys.exit(f"Não consegui ler os municípios de {MUNICIPIOS_SEED}.")
    codes = sorted({c for c, _ in pares})
    slug2ibge = {s: c for c, s in pares}
    return codes, slug2ibge


# ---------- download + agregação ----------

def janela_periodos() -> list[tuple[int, int]]:
    per = json.loads(_get(f"{API_BASE}/periodos-disponiveis", timeout=40))
    pares = sorted({(int(e["ano"]), int(m)) for e in per for m in e["meses"]}, reverse=True)
    janela = sorted(pares[:JANELA_MESES])
    if len(janela) < JANELA_MESES:
        print(f"[aviso] só {len(janela)} períodos disponíveis (esperado {JANELA_MESES}).")
    return janela


def _parse_xlsx(blob: bytes, slug2ibge: dict[str, str], acc: dict[str, list],
                unmatched: dict[str, int]) -> int:
    import openpyxl  # import tardio: só o caminho online precisa
    wb = openpyxl.load_workbook(BytesIO(blob), data_only=True)  # NÃO read_only (dims furadas)
    ws = wb["dados"]
    n = 0
    for row in ws.iter_rows(min_row=3, values_only=True):
        nome = row[COL_MUNICIPIO]
        if nome is None:
            continue
        n += 1
        sl = slugify(nome)
        sl = ALIAS_SLUG.get(sl, sl)
        ibge = slug2ibge.get(sl)
        if not ibge:
            unmatched[str(nome)] = unmatched.get(str(nome), 0) + 1
            continue
        total = sum(row[c] if isinstance(row[c], (int, float)) else 0.0 for c in COLS_TEMPO)
        acc.setdefault(ibge, []).append(total)
    wb.close()
    return n


def fetch() -> dict:
    """Baixa os 12 XLSX, agrega por município e devolve o dicionário de snapshot."""
    _codes, slug2ibge = municipios_canonicos()
    janela = janela_periodos()
    acc: dict[str, list] = {}
    unmatched: dict[str, int] = {}
    por_mes: dict[str, int] = {}
    for ano, mes in janela:
        blob = _get(f"{API_BASE}/exportar/solicitacoes/{UF}?mes={mes}&ano={ano}")
        n = _parse_xlsx(blob, slug2ibge, acc, unmatched)
        por_mes[f"{ano}-{mes:02d}"] = n
        print(f"  {ano}-{mes:02d}: {n} registros")
    if unmatched:
        print(f"[aviso] municípios não casados (fora dos 223): {unmatched}")

    aggregates: dict[str, dict] = {}
    for ibge, xs in acc.items():
        marco = p75(xs)
        aggregates[ibge] = {
            "n": len(xs),
            "marco75Horas": round(marco, 2),
            "mediaHoras": round(st.mean(xs), 2),
            "medianaHoras": round(st.median(xs), 2),
            "faixa": faixa_de(marco),
        }

    crosscheck = _crosscheck(janela[-1])

    return {
        "indicatorId": INDICATOR_ID,
        "uf": UF,
        "janela": [f"{a}-{m:02d}" for a, m in janela],
        "janelaLabel": f"{janela[0][0]}-{janela[0][1]:02d} a {janela[-1][0]}-{janela[-1][1]:02d}",
        "registrosPorMes": por_mes,
        "totalRegistros": sum(por_mes.values()),
        "naoCasados": unmatched,
        "crosscheckOficial": crosscheck,
        "aggregates": aggregates,
    }


def _crosscheck(periodo: tuple[int, int]) -> dict:
    """Compara as faixas calculadas com o agregado oficial do último mês (sanidade)."""
    ano, mes = periodo
    try:
        oficial = json.loads(_get(f"{API_BASE}/{CROSSCHECK_ENDPOINT}/{UF}?ano={ano}&mes={mes}", timeout=40))
        return {"periodo": f"{ano}-{mes:02d}", "oficialUF": oficial}
    except Exception as e:  # noqa: BLE001
        return {"periodo": f"{ano}-{mes:02d}", "erro": str(e)}


# ---------- build dos valores ----------

def build_values(snapshot: dict) -> list[dict]:
    codes, _ = municipios_canonicos()
    ref_year = snapshot["janela"][-1].split("-")[0]
    janela_label = snapshot["janelaLabel"]
    aggr = snapshot["aggregates"]
    source = f"{SOURCE_BASE} — {DESCRIPTION.split('.')[0]} (últimos 12 meses: {janela_label})"
    valores = []
    for code in codes:
        a = aggr.get(code)
        if not a:  # sem nenhuma abertura na janela
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": ref_year,
                "source": source, "isFictional": False,
                "breakdown": {"n": 0, "confiabilidade": "sem-dados", "mesesAbrangidos": janela_label},
            })
            continue
        n = a["n"]
        marco = a["marco75Horas"]
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": f"{br_num(marco)}h", "numericValue": marco,
            "referenceYear": ref_year, "source": source, "isFictional": False,
            "breakdown": {
                "n": n,
                "confiabilidade": "alta" if n >= N_CONFIAVEL else "baixa",
                "marco75Horas": marco,
                "marco75Dias": round(marco / 24, 2),
                "mediaHoras": a["mediaHoras"],
                "medianaHoras": a["medianaHoras"],
                "faixaOficial": a["faixa"],
                "faixaLabel": FAIXA_LABEL[a["faixa"]],
                "mesesAbrangidos": janela_label,
            },
        })
    return valores


# ---------- emissão do mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_tempo_abertura.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict], ref_year: str, janela_label: str) -> Path:
    # threshold oficial (faixas Redesim -> semáforo 3 níveis): lower-better 72/168 horas úteis.
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        "threshold": {"kind": "lower-better", "success": BANDA_VERDE, "warning": BANDA_LARANJA},
        "updatedAt": ref_year,
        "description": DESCRIPTION,
        "source": SOURCE_BASE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "agenda", "agendaId": "simplificacao", "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append(f"// --- 1) Catálogo: o indicador {INDICATOR_ID} (agenda simplificacao) ---")
    lines.append("// threshold = faixas OFICIAIS da Redesim (🟢≤72h/3d · 🟡🟠 72–168h · 🔴>168h/7d)")
    lines.append("// no semáforo de 3 níveis da OPP. numericValue = marco de 75% (horas úteis).")
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({INDICATOR_ID}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), janela {janela_label} ---")
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
    lines.append(f"print(`indicatorValues({INDICATOR_ID}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)")
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


# ---------- main ----------

def main() -> None:
    ap = argparse.ArgumentParser(description=f"Gera o seed do indicador {INDICATOR_ID} (Redesim).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem baixar da Redesim")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] snapshot {snapshot['janelaLabel']} — {snapshot['totalRegistros']} registros.")
    else:
        snapshot = fetch()
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {snapshot['totalRegistros']} registros; snapshot salvo em {SNAPSHOT}")

    values = build_values(snapshot)
    ref_year = snapshot["janela"][-1].split("-")[0]
    out = emit(values, ref_year, snapshot["janelaLabel"])

    com = [v for v in values if v["numericValue"] is not None]
    alta = sum(1 for v in com if v["breakdown"]["confiabilidade"] == "alta")
    faixas: dict[int, int] = {}
    for v in com:
        f = v["breakdown"]["faixaOficial"]
        faixas[f] = faixas.get(f, 0) + 1
    print(f"\nCross-check oficial (último mês): {json.dumps(snapshot['crosscheckOficial'], ensure_ascii=False)}")
    print(f"{INDICATOR_ID}: {len(com)}/223 com dado (alta conf. n≥30: {alta}); faixas {dict(sorted(faixas.items()))}")
    print(f"OK — seed em {out}")


if __name__ == "__main__":
    main()
