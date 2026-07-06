#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador **Tempo de licenciamento** (`tempo-licenciamento`)
da agenda "Simplificação e digitalização" da OPP.

Fonte: Ranking Municipal do Ambiente de Negócios da Redesim/PB, via a API REST pública
(sem autenticação) do portal Mapa de Empresas/PB (app Next.js):
  base = https://www.redesim.pb.gov.br/api/mapa-empresas-service
  - GET /ranking-periodo
  - GET /ranking-municipal?periodoInicial=YYYY-MM-01&periodoFinal=YYYY-MM-01&indicador=K
        com K = "1|3" (Alvará de Localização — Tempo de Análise) e "2|3" (Alvará Sanitário —
        Tempo de Análise). Devolve, por município (com IBGE), o campo `tempo` = pontuação do
        **Índice de Tempo** daquele alvará na janela.

LIMITE DA FONTE (importante): as **horas brutas** de alvará só existem no nível ESTADUAL
(`ranking-panorama-estado`); por município a API publica apenas a **pontuação** do Índice
de Tempo (derivada das faixas oficiais de horas — Alvará Localização: 10 pts ≤72h … 1 pt
>264h; Sanitário: 10 pts ≤96h … 1 pt >312h). Por isso este indicador é a **pontuação**, não
horas cruas (decisão jun/2026).

INDICADOR: `tempo-licenciamento`. `numericValue` = **soma** das pontuações do Índice de
Tempo de Alvará de Localização + Alvará Sanitário na janela de 6 meses (escala teórica
0–120 = 60+60; **maior = mais rápido**). O `breakdown` separa as duas componentes.

SEM THRESHOLD (semáforo): a fonte não publica uma faixa oficial de bom/atenção/alerta para
a pontuação combinada dos alvarás (as faixas oficiais são por documento e em horas; aqui o
valor é um score agregado). Seguindo a regra do projeto (não inventar cortes), entra **sem
`threshold`**. (O corte `lower-better 15/25` que estava em src/data/indicators/thresholds.ts
era inventado e pressupunha horas, que não temos por município.)

Cobertura: os 223 municípios da PB (a API devolve os 223; valida contra a lista canônica).
Obs.: pontuação 0 pode significar "sem alvarás emitidos na janela" (não necessariamente
"muito lento") — o breakdown expõe as duas componentes para deixar isso transparente.

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-tempo-licenciamento.mongodb.js   (catálogo + valores)
  - database/data/tempo_licenciamento_pb.json                (snapshot versionado)

Uso:
  python3 database/scripts/gerar_seed_tempo_licenciamento.py            # online
  python3 database/scripts/gerar_seed_tempo_licenciamento.py --offline  # do snapshot
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "tempo_licenciamento_pb.json"
SEED_FILE = SEED_DIR / "indicador-tempo-licenciamento.mongodb.js"

API_BASE = "https://www.redesim.pb.gov.br/api/mapa-empresas-service"
JANELA_MESES = 6
# indicadores do ranking (key -> rótulo); TA = Tempo de Análise. '|' vira %7C na URL.
IND_LOCALIZACAO = "1|3"   # Alvará de Localização — Tempo de Análise (máx 60 na janela)
IND_SANITARIO = "2|3"     # Alvará Sanitário — Tempo de Análise (máx 60 na janela)
SCORE_MAX = 120           # 60 (Localização) + 60 (Sanitário), teórico

INDICATOR_ID = "tempo-licenciamento"
ORDER = 4  # posição na agenda simplificacao (espelha catalog.ts)
LABEL = "Tempo de licenciamento"
DESCRIPTION = (
    "Pontuação do Índice de Tempo de licenciamento do município (Alvará de Localização + "
    "Alvará Sanitário) no Ranking da Redesim/PB, na janela de 6 meses. Escala 0–120; "
    "maior = licenciamento mais rápido. Derivada das faixas oficiais de horas (a fonte não "
    "publica horas brutas por município)."
)
SOURCE = ("Ranking Municipal do Ambiente de Negócios — Redesim Paraíba "
          "(redesim.pb.gov.br), Índice de Tempo de alvará (Localização + Sanitário)")
SOURCE_DATASET = "redesim_pb_ranking_municipal"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


def _get(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "opp-seed/1.0"})
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def municipios_canonicos() -> list[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


def janela() -> tuple[str, str]:
    per = json.loads(_get(f"{API_BASE}/ranking-periodo"))
    ano_f, mes_f = max((e["ano"], e["meses"]["fim"]) for e in per)
    idx = ano_f * 12 + (mes_f - 1) - (JANELA_MESES - 1)
    ano_i, mes_i = divmod(idx, 12)
    mes_i += 1
    return f"{ano_i}-{mes_i:02d}-01", f"{ano_f}-{mes_f:02d}-01"


def _ranking_por_indicador(ini: str, fim: str, key: str) -> dict[str, int]:
    """{IBGE -> pontuação do Índice de Tempo} para um indicador de alvará."""
    url = (f"{API_BASE}/ranking-municipal?periodoInicial={ini}&periodoFinal={fim}"
           f"&indicador={key.replace('|', '%7C')}")
    rows = json.loads(_get(url))
    if not isinstance(rows, list) or not rows:
        sys.exit(f"ranking-municipal (indicador={key}) não devolveu lista.")
    return {str(r["cod_municipio"]): int(r["tempo"]) for r in rows}


def fetch() -> dict:
    ini, fim = janela()
    loc = _ranking_por_indicador(ini, fim, IND_LOCALIZACAO)
    san = _ranking_por_indicador(ini, fim, IND_SANITARIO)
    return {
        "periodoInicial": ini,
        "periodoFinal": fim,
        "janelaLabel": f"{ini[:7]} a {fim[:7]}",
        "scoreMax": SCORE_MAX,
        "localizacao": loc,
        "sanitario": san,
    }


def build_values(snapshot: dict) -> list[dict]:
    loc = snapshot["localizacao"]
    san = snapshot["sanitario"]
    codes = municipios_canonicos()
    extra = (set(loc) | set(san)) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: " + ", ".join(sorted(extra))[:400])
    ref_year = snapshot["periodoFinal"][:4]
    janela_label = snapshot["janelaLabel"]
    source = f"{SOURCE} — últimos 6 meses ({janela_label})"
    valores = []
    for code in codes:
        l = loc.get(code)
        s = san.get(code)
        if l is None and s is None:  # município ausente nas duas consultas
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": ref_year,
                "source": source, "isFictional": False,
                "breakdown": {"semDados": True, "mesesAbrangidos": janela_label},
            })
            continue
        l = int(l or 0)
        s = int(s or 0)
        score = l + s
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": str(score), "numericValue": score,
            "referenceYear": ref_year, "source": source, "isFictional": False,
            "breakdown": {
                "alvaraLocalizacao": l,       # Índice de Tempo Alvará Localização (0–60)
                "alvaraSanitario": s,         # Índice de Tempo Alvará Sanitário (0–60)
                "scoreMaximo": SCORE_MAX,     # 120 (teórico)
                "semEmissaoAlvara": score == 0,  # 0 pode ser "sem alvarás emitidos na janela"
                "mesesAbrangidos": janela_label,
            },
        })
    return valores


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_tempo_licenciamento.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict], ref_year: str, janela_label: str) -> Path:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: a fonte não publica faixa oficial p/ a pontuação combinada de alvará.
        "referenceYear": ref_year,
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "pontos (0–120)",
        "placements": [{"section": "agenda", "agendaId": "simplificacao", "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append(f"// --- 1) Catálogo: o indicador {INDICATOR_ID} (agenda simplificacao) ---")
    lines.append("// SEM threshold: a fonte não publica horas brutas por município nem faixa oficial")
    lines.append("// p/ a pontuação combinada de alvará. numericValue = Índice de Tempo (0–120, maior=+rápido).")
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


def main() -> None:
    ap = argparse.ArgumentParser(description=f"Gera o seed do indicador {INDICATOR_ID} (Redesim/PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] snapshot {snapshot['janelaLabel']} — {len(snapshot['localizacao'])} municípios.")
    else:
        snapshot = fetch()
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(snapshot['localizacao'])} municípios; snapshot salvo em {SNAPSHOT}")

    values = build_values(snapshot)
    ref_year = snapshot["periodoFinal"][:4]
    out = emit(values, ref_year, snapshot["janelaLabel"])

    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    sem = sum(1 for v in com if v["breakdown"].get("semEmissaoAlvara"))
    print(f"{INDICATOR_ID}: {len(com)}/223 com dado; score médio={media:.0f}/120; "
          f"{sem} com pontuação 0 (possível sem emissão). Janela {snapshot['janelaLabel']}.")
    print(f"OK — seed em {out}")


if __name__ == "__main__":
    main()
