#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador IGMA do banco da OPP.

Fonte: Índice de Gestão Municipal Áquila (IGMA), da Áquila. A API pública
(sem autenticação) expõe, por município, o IGMA consolidado (0-100), a posição
no ranking nacional, a classificação (Crítico / Em desenvolvimento / Desenvolvido)
e os 6 pilares que compõem o índice:

    GET https://data-igma-api.aquila.com.br/api/v1/structures/
        get_params_indicators_ranking?business_id=1&id=<id_aquila>

⚠️  Cada município tem um `id` Áquila próprio (não é o código IBGE). Os ids são
    organizados em blocos por estado, em ordem alfabética. O bloco da Paraíba são
    os ids 1991..2212 (222 municípios, de "Água Branca" a "Zabelê"); a capital
    João Pessoa fica num bloco separado de capitais (id 745). Total = 223.
    Detalhes do protocolo em database/MAPEAMENTO_BASE_DOS_DADOS.md §7.

Cobertura: os 223 municípios da Paraíba. A API só publica a versão 2026 (sem
série histórica), então referenceYear = "2026".

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-igma.mongodb.js
  - database/data/igma_pb.json   (snapshot versionado da raspagem, já com IBGE)

Uso:
  python3 database/scripts/gerar_seed_igma.py            # online (consome a API)
  python3 database/scripts/gerar_seed_igma.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "igma_pb.json"

SOURCE = "Índice de Gestão Municipal Áquila (IGMA) — Áquila (data-igma-api.aquila.com.br)"
SOURCE_DATASET = "igma_aquila_api"
INDICATOR_ID = "igma"
LABEL = "Índice de Gestão Municipal Áquila (IGMA)"
# Faixas OFICIAIS da Áquila (escala 0-100): Crítico 0-50 · Em desenvolvimento 50-65 ·
# Desenvolvido 65-80 · Excelente 80-100. Mapeadas para o semáforo: success = 65
# (Desenvolvido/Excelente = verde) · warning = 50 (Em desenvolvimento = amarelo) ·
# < 50 = Crítico (vermelho). Bate com a `classificacao` que a API devolve por município.
THRESHOLD = {"kind": "higher-better", "success": 65, "warning": 50}
# descrição espelha src/data/indicators/descriptions/indicators.ts ('igma').
DESCRIPTION = (
    "Avaliação multidimensional da gestão municipal desenvolvida pela Áquila, "
    "combinando indicadores de eficiência administrativa, fiscal e social."
)
REFERENCE_YEAR = "2026"

# ---- API IGMA Áquila ----
API = ("https://data-igma-api.aquila.com.br/api/v1/structures/"
       "get_params_indicators_ranking?business_id=1&id={id}")
# Bloco PB (alfabético, "Água Branca".."Zabelê") + capital João Pessoa (bloco de capitais).
PB_IDS = list(range(1991, 2213))  # 1991..2212 = 222 municípios
JOAO_PESSOA_ID = 745
ALL_IDS = PB_IDS + [JOAO_PESSOA_ID]

# pillar_id (API) -> chave no breakdown. 7 = IGMA consolidado (main_pillar).
PILLAR_KEY = {
    1: "governanca",       # Governança, Eficiência Fiscal e Transparência
    2: "educacao",         # Educação
    3: "saude",            # Saúde e Bem-Estar
    4: "infraestrutura",   # Infraestrutura e Sustentabilidade
    5: "seguranca",        # Segurança Pública
    6: "socioeconomico",   # Desenvolvimento Socioeconômico
}
IGMA_PILLAR_ID = 7

# business_range abreviado (API) -> classificação por extenso (doc §7).
CLASSIFICACAO = {
    "Crítico": "Crítico",
    "Em desen.": "Em desenvolvimento",
    "Desen.": "Desenvolvido",
}


def br(value: float) -> str:
    """Formata em padrão BR com 2 casas (escala 0-100): 57.51712 -> '57,52'."""
    return f"{value:.2f}".replace(".", ",")


# ---------- consumo da API ----------

def _get(url: str, tries: int = 3) -> dict:
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read())
        except Exception as exc:  # noqa: BLE001 — rede/JSON; tenta de novo
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"falha em {url}: {last}")


def _extract(d: dict) -> dict | None:
    """Extrai o registro do município do payload da API. None se não tiver IGMA 2026."""
    code = d.get("code")
    if not code:
        return None
    pillars = {}
    igma = posicao = classificacao = None
    for pv in d.get("pillar_values", []):
        if pv.get("version", {}).get("name") != REFERENCE_YEAR:
            continue
        pid = pv.get("pillar_id")
        idx = pv.get("pillar_index")
        if pid == IGMA_PILLAR_ID:
            igma = idx
            posicao = pv.get("position")
            raw = (pv.get("business_range") or {}).get("name")
            classificacao = CLASSIFICACAO.get(raw, raw)
        elif pid in PILLAR_KEY and idx is not None:
            pillars[PILLAR_KEY[pid]] = round(float(idx), 3)
    if igma is None:
        return None
    return {
        "ibge": str(code),
        "nome": d.get("name", "").replace(" - PB", ""),
        "igma": round(float(igma), 3),
        "posicao": posicao,
        "classificacao": classificacao,
        **pillars,
    }


def fetch_all() -> list[dict]:
    out = []
    total = len(ALL_IDS)
    for n, aquila_id in enumerate(ALL_IDS, 1):
        rec = _extract(_get(API.format(id=aquila_id)))
        if rec:
            out.append(rec)
        if n % 25 == 0 or n == total:
            print(f"  ... {n}/{total} ids consultados ({len(out)} com IGMA)")
    return out


# ---------- validação de cobertura ----------

def canonical_ibge() -> set[str]:
    """Conjunto dos 223 códigos IBGE da PB, lido do seed de municípios (fonte única)."""
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    return set(re.findall(r'"_id":\s*"(\d{7})"', text))


def validate(recs: list[dict]) -> None:
    got = {r["ibge"] for r in recs}
    expected = canonical_ibge()
    if not expected:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    missing = expected - got
    extra = got - expected
    if missing:
        sys.exit(f"{len(missing)} municípios da PB sem IGMA: "
                 + ", ".join(sorted(missing))[:400])
    if extra:
        sys.exit(f"Códigos IBGE fora da lista dos 223 da PB: "
                 + ", ".join(sorted(extra))[:400])
    if len(got) != len(recs):
        sys.exit(f"Códigos IBGE duplicados na raspagem ({len(recs)} recs, {len(got)} únicos).")


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_igma.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(recs: list[dict]) -> None:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        "threshold": THRESHOLD,
        "updatedAt": REFERENCE_YEAR,  # ano exibido por padrão (única versão da API)
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "agenda", "agendaId": "governanca", "order": 4}],
    }
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador IGMA (agenda governanca) ---"]
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(igma) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(recs)} docs), IGMA {REFERENCE_YEAR} ---")
    lines.append("// status/tone derivam do threshold do indicador. breakdown = 6 pilares")
    lines.append("// do IGMA + posição no ranking nacional + classificação (faixa Áquila).")
    lines.append("const values = [")
    for r in sorted(recs, key=lambda x: x["ibge"]):
        value = {
            "municipalityId": r["ibge"],
            "indicatorId": INDICATOR_ID,
            "rawValue": br(float(r["igma"])),
            "numericValue": round(float(r["igma"]), 3),
            "referenceYear": REFERENCE_YEAR,
            "source": SOURCE,
            "isFictional": False,
            "breakdown": {
                "governanca": r.get("governanca"),
                "educacao": r.get("educacao"),
                "saude": r.get("saude"),
                "infraestrutura": r.get("infraestrutura"),
                "seguranca": r.get("seguranca"),
                "socioeconomico": r.get("socioeconomico"),
                "posicao": r.get("posicao"),
                "classificacao": r.get("classificacao"),
            },
        }
        lines.append(f"  {js(value)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append("print(`indicatorValues(igma) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-igma.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador IGMA.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consumir a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        recs = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] {len(recs)} registros do snapshot.")
    else:
        print(f"[online] consultando a API IGMA Áquila para {len(ALL_IDS)} ids...")
        recs = fetch_all()
        SNAPSHOT.write_text(json.dumps(recs, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(recs)} registros; snapshot salvo em {SNAPSHOT}")

    validate(recs)
    emit(recs)
    print(f"OK — {len(recs)} municípios, IGMA {REFERENCE_YEAR}. Seed em {SEED_DIR / 'indicador-igma.mongodb.js'}")


if __name__ == "__main__":
    main()
