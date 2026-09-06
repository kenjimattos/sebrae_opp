#!/usr/bin/env python3
"""
Gera o script de seed (mongosh) do indicador IDSC (Índice de Desenvolvimento
Sustentável das Cidades — Brasil) do banco da OPP.

Fonte:
  - IDSC-BR 2025: API pública do Instituto Cidades Sustentáveis, que alimenta o
    mapa oficial (idsc.cidadessustentaveis.org.br/map). Base REST:
        https://www.cidadessustentaveis.org.br/api/idsc-br/
    Endpoint usado:
        buscarAllPerfilCidadePorSiglaEstado/PB
    Retorna os 223 municípios da PB com a pontuação geral (0-100), a
    classificação nacional e a população. Sem autenticação.

    Variação: além do score 2025, o gerador busca a série por município
    (buscarSeriePontuacaoIdscPorCidade/{ibge}) e calcula a variação vs. a
    edição anterior (2025 vs 2024), gravada no campo `variation` de cada doc.
    Ressalva: as edições do IDSC-BR não são 100% comparáveis metodologicamente.

  Outros endpoints da mesma API (não usados aqui — coletamos só o score geral):
    - buscarInfoOdsPorCidade/{ibge}            -> os 17 ODS da cidade
    - buscarSeriePontuacaoIdscPorCidade/{ibge} -> série (2015/2022/2023/2024/2025)
    - buscarAllPerfilCidadeDetalhes            -> tudo (5570 cidades + ODS, ~95MB)

Saídas (idempotentes, próprias para rodar no NoSQLBooster):
  - database/seed/indicador-idsc.mongodb.js
  - database/data/idsc_pb_2025.json  (snapshot versionado da consulta)

Sem semáforo: a metodologia do IDSC classifica a distância da meta por ODS
(verde/amarelo/laranja/vermelho), não o score agregado. Não há faixa oficial
para o índice composto, então o indicador entra sem threshold (não inventamos).

Uso:
  python3 database/scripts/gerar_seed_idsc.py            # online (consulta a API)
  python3 database/scripts/gerar_seed_idsc.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
SNAPSHOT = DATA_DIR / "idsc_pb_2025.json"

ANO_IDSC = "2025"
API_BASE = "https://www.cidadessustentaveis.org.br/api/idsc-br"
ENDPOINT = f"{API_BASE}/buscarAllPerfilCidadePorSiglaEstado/PB"
# Série histórica por município (2015/2022/2023/2024/2025) — usada só para a
# variação vs. a edição anterior; o endpoint por estado não carrega o ano.
SERIE_ENDPOINT = f"{API_BASE}/buscarSeriePontuacaoIdscPorCidade"
SOURCE = (
    "Índice de Desenvolvimento Sustentável das Cidades – Brasil (IDSC-BR 2025), "
    "Instituto Cidades Sustentáveis — API cidadessustentaveis.org.br"
)
SOURCE_DATASET = "idsc-br"
UF = "PB"
ESPERADO_PB = 223
# O servidor recusa (403) requisições sem User-Agent de navegador.
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

DESC_IDSC = (
    "Índice de Desenvolvimento Sustentável das Cidades — mede, numa escala de 0 a "
    "100, o avanço do município rumo aos 17 Objetivos de Desenvolvimento "
    "Sustentável (Agenda 2030). Quanto mais próximo de 100, menor a distância "
    "para o desempenho ótimo nos ODS."
)

# Indicador único IDSC, exibido nos cards do Panorama (base econômica). É listado
# antes do IDH-M na tabela de base econômica do MAPEAMENTO -> order 0.
INDICATORS = [
    {
        "_id": "idsc",
        "label": "IDSC",
        "referenceYear": ANO_IDSC,
        "description": DESC_IDSC,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        # sem threshold: índice composto não tem faixa oficial de semáforo.
        "unit": "índice (0–100)",
        "placements": [
            {"section": "socialeconomic", "order": 0},
        ],
    },
]


def br(value: float) -> str:
    """Formata em padrão brasileiro com 2 casas: 52.03 -> '52,03'."""
    return f"{value:.2f}".replace(".", ",")


def _get_json(url: str, retries: int = 2):
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except Exception as e:  # noqa: BLE001 — API instável; tenta de novo
            last = e
            time.sleep(0.5 * (attempt + 1))
    assert last is not None
    raise last


def fetch_idsc() -> list[dict]:
    rows = _get_json(ENDPOINT)
    if not rows:
        sys.exit("API retornou 0 linhas — verifique o endpoint.")
    rows = [r for r in rows if r.get("siglaEstado") == UF and r.get("pontuacao") is not None]
    rows.sort(key=lambda r: str(r["id"]))
    if len(rows) != ESPERADO_PB:
        print(f"[aviso] esperava {ESPERADO_PB} municípios da PB, recebi {len(rows)}", file=sys.stderr)

    # 2ª passada: série por município para o valor da edição anterior (variação).
    # O endpoint por estado só devolve a edição corrente (sem ano); a série traz
    # todos os anos, de onde tiramos a edição imediatamente anterior à atual.
    print(f"[idsc] buscando série de {len(rows)} municípios (variação vs. edição anterior)...", file=sys.stderr)
    for i, r in enumerate(rows, 1):
        try:
            serie = _get_json(f"{SERIE_ENDPOINT}/{r['id']}")
        except Exception as e:  # noqa: BLE001
            print(f"[aviso] série falhou p/ {r['id']}: {e}", file=sys.stderr)
            serie = []
        anos = {
            int(s["ano"]): float(s["pontuacao"])
            for s in serie
            if s.get("ano") is not None and s.get("pontuacao") is not None
        }
        atual = max(anos) if anos else None
        anteriores = [a for a in anos if atual is not None and a < atual]
        anterior = max(anteriores) if anteriores else None
        r["pontuacaoAnterior"] = anos.get(anterior) if anterior is not None else None
        r["anoAnterior"] = str(anterior) if anterior is not None else None
        time.sleep(0.12)
        if i % 50 == 0:
            print(f"[idsc] série {i}/{len(rows)}", file=sys.stderr)
    return rows


# ---------- emissão do script mongosh ----------

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_idsc.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    """Serializa em JS/JSON compacto e estável (ordem de chaves preservada)."""
    return json.dumps(obj, ensure_ascii=False)


def emit_indicador_idsc(rows: list[dict]) -> None:
    lines = [HEADER, "", "// --- 1) Catálogo: o indicador IDSC (card do Panorama / base econômica) ---"]
    lines.append("// Sem threshold: índice composto 0-100 não tem faixa oficial de semáforo.")
    lines.append("const indicators = [")
    for ind in INDICATORS:
        lines.append(f"  {js(ind)},")
    lines.append("]")
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append("print(`indicators(idsc) -> ok (${indicators.length} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(rows)} docs), IDSC {ANO_IDSC} ---")
    lines.append("// Um doc por município. numericValue = pontuação geral 0-100 (sem semáforo).")
    lines.append("// variation = variação vs. edição anterior do IDSC (2025 vs 2024), ou null se faltar.")
    lines.append("const values = [")
    for r in rows:
        pont = float(r["pontuacao"])
        prev = r.get("pontuacaoAnterior")
        ano_prev = r.get("anoAnterior")
        # variação vs. edição anterior do IDSC (pontos percentuais relativos).
        variation = None
        if prev is not None and float(prev) != 0:
            variation = {
                "deltaPct": round((pont - float(prev)) / float(prev) * 100, 1),
                "previousValue": round(float(prev), 2),
                "previousYear": ano_prev,
                "basis": "edicao-anterior",
            }
        value = {
            "municipalityId": str(r["id"]),
            "indicatorId": "idsc",
            "rawValue": br(pont),
            "numericValue": round(pont, 2),
            "referenceYear": ANO_IDSC,
            "source": SOURCE,
            "isFictional": False,
            "variation": variation,
            "breakdown": {
                "classificacaoNacional": r.get("classificacao"),
                "populacao": r.get("populacao"),
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
    lines.append("print(`indicatorValues(idsc) -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    (SEED_DIR / "indicador-idsc.mongodb.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Gera o seed do indicador IDSC do banco da OPP.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        rows = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] {len(rows)} registros do snapshot.")
    else:
        rows = fetch_idsc()
        SNAPSHOT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(rows)} registros consultados; snapshot salvo em {SNAPSHOT}")

    emit_indicador_idsc(rows)
    print(f"OK — {len(rows)} valores de IDSC. Script em {SEED_DIR / 'indicador-idsc.mongodb.js'}")


if __name__ == "__main__":
    main()
