#!/usr/bin/env python3
"""
⚠️ FALLBACK/REFERÊNCIA (jul/2026): a coleta oficial do `crescimento-mpe` foi CONSOLIDADA em
`gerar_seed_negocios_rfb_lake.py` (mesma rodada do `negocios-abertos`, fonte = RF Estabelecimentos
do data lake — ver MAPEAMENTO §14). Este gerador (fonte = API Tesseract do Observatório Sebrae, online)
fica no repo como referência e fallback, mas NÃO é mais a fonte do seed em produção. Rodá-lo
sobrescreve `seed/indicador-crescimento-mpe.mongodb.js` com os valores do Observatório — que podem
DISCORDAR do `negocios-abertos` (ex.: João Pessoa 2025 = +23,2% Observatório vs +19,1% lake).

Gera o seed (mongosh) do indicador **Crescimento de MPE formalizadas** (`crescimento-mpe`)
da agenda "Ecossistemas de Inovação" da OPP.

Fonte: **Observatório Setorial Territorial do Sebrae** (observatorio.sebrae.com.br,
plataforma Datawheel), que expõe uma **API Tesseract OLAP pública sem autenticação**:
  base = https://apiv2-observatorio.sebrae.com.br/tesseract
  - GET /cubes                                  -> catálogo de 59 cubos
  - GET /members?cube=RF&level=<nível>          -> membros de uma dimensão
  - GET /data.jsonrecords?cube=RF&drilldowns=&measures=&<Nível>=<chaves>  -> dados

Cubo: **RF** (Receita Federal — tabela Estabelecimentos). Medida `Establishments`.
Dimensões usadas:
  - Geography / Municipality  -> chave = código IBGE (7 díg.); recorte State=25 (PB)
  - Open Activity Year        -> ano de abertura/registro do estabelecimento
  - Company Size Sebrae       -> 3=EPP, 4=ME, 5=MEI, 9=Outros

== Ressalva semântica (importante) ==
O catálogo da OPP chama este indicador de "Crescimento de MPE formalizadas **nos ELI**"
(Ecossistemas Locais de Inovação — programa do Sebrae). Esse recorte programático **não
existe em fonte aberta**: o cubo RF tem flags de jornadas/territórios Sebrae (Cidade
Empreendedora, Sala do Empreendedor, Território Empreendedor…), mas **nenhum "ELI"**.
Por decisão do projeto (jun/2026) adota-se o **proxy municipal**: crescimento das MPE
formalizadas no município (RFB). O `_id` foi renomeado de `mpe-eli-sebrae` para `crescimento-mpe`, no slot
do catálogo; label/description/source deixam claro que é o proxy municipal RFB, não o
recorte ELI interno do Sebrae.

== Métrica (decisão do projeto: fluxo de novas aberturas/ano) ==
Para cada ano Y, conta-se o nº de estabelecimentos MPE (Company Size Sebrae = MEI+ME+EPP)
com **Open Activity Year = Y**, em **todas as situações cadastrais** (a base RFB mantém as
baixadas → não há viés de sobrevivência: conta a formalização efetiva daquele ano).
  - `numericValue` = variação % a.a. = (fluxo[refYear] − fluxo[refYear−1]) / fluxo[refYear−1] × 100
  - refYear = **último ano civil completo** (o ano corrente é parcial → excluído do cálculo).
  - `breakdown` guarda a série anual, o split MEI/ME/EPP do refYear, os fluxos comparados,
    o ano corrente parcial e `confiabilidade` (baixa quando o fluxo-base é pequeno).

MPE aqui = "pequenos negócios" no sentido Sebrae (MEI + ME + EPP). O split por porte fica
no `breakdown` para quem quiser a definição estrita ME+EPP.

== SEM threshold (semáforo) ==
Não há faixa oficial de "bom/atenção/alerta" para taxa de crescimento de MPE. Seguindo a
regra do projeto (não inventar cortes — ver memory feedback_verify_primary_sources e o
precedente `ranking-redesim`), o indicador entra **sem `threshold`**. O corte
`higher-better 8/3` que estava em src/data/indicators/thresholds.ts era inventado.

Cobertura: os 223 municípios da PB. Municípios sem fluxo no ano-base entram com
`numericValue: null` (não há como calcular variação).

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/indicador-crescimento-mpe.mongodb.js   (catálogo + valores)
  - database/data/crescimento_mpe_pb.json              (snapshot versionado da resposta)

Uso:
  python3 database/scripts/gerar_seed_crescimento_mpe.py            # online (consulta a API)
  python3 database/scripts/gerar_seed_crescimento_mpe.py --offline  # usa o snapshot salvo
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "crescimento_mpe_pb.json"
SEED_FILE = SEED_DIR / "indicador-crescimento-mpe.mongodb.js"

API_BASE = "https://apiv2-observatorio.sebrae.com.br/tesseract"
CUBE = "RF"
PB_STATE_KEY = "25"                  # Paraíba na dimensão Geography/State
SIZE_KEYS = {5: "MEI", 4: "ME", 3: "EPP"}  # Company Size Sebrae: MPE = MEI+ME+EPP
ANO_MIN_SERIE = 2016                 # série guardada no breakdown a partir daqui
CONF_BAIXA = 30                      # fluxo-base < 30 → confiabilidade baixa

INDICATOR_ID = "crescimento-mpe"      # mantém o slot do catálogo (agenda inovacao)
ORDER = 3
LABEL = "Crescimento de MPE formalizadas no município"
DESCRIPTION = (
    "Variação percentual anual no número de micro e pequenas empresas (MEI+ME+EPP) "
    "formalizadas no município, por ano de abertura na Receita Federal. Proxy municipal "
    "aberto para o indicador de MPE nos ELI (o recorte por Ecossistemas Locais de Inovação "
    "é dado interno do Sebrae e não está em fonte aberta)."
)
SOURCE = (
    "Receita Federal (cubo RF — Estabelecimentos), via API Tesseract pública do "
    "Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br) — "
    "fluxo de aberturas de MPE por ano, todas as situações cadastrais"
)
SOURCE_DATASET = "rfb_estabelecimentos_observatorio_sebrae"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


def _get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "opp-seed/1.0"})
    with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
        return r.read()


def municipios_canonicos() -> list[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if not codes:
        sys.exit(f"Não consegui ler os códigos IBGE de {MUNICIPIOS_SEED}.")
    return codes


def fetch() -> dict:
    """Baixa o fluxo de aberturas de MPE por município × ano × porte (PB, todas situações)."""
    params = {
        "cube": CUBE,
        "drilldowns": "Municipality,Open Activity Year,Company Size Sebrae",
        "measures": "Establishments",
        "Company Size Sebrae": ",".join(str(k) for k in SIZE_KEYS),
        "State": PB_STATE_KEY,
    }
    url = f"{API_BASE}/data.jsonrecords?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    rows = json.loads(_get(url)).get("data", [])
    if not rows:
        sys.exit("API retornou 0 linhas — verifique o cubo/recorte.")
    return {
        "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
        "cube": CUBE,
        "url": url,
        "rows": rows,
    }


def _series_por_municipio(rows: list[dict]) -> dict[str, dict[int, dict[int, float]]]:
    """mun(str) -> {ano:int -> {sizeId:int -> establishments}}"""
    serie: dict[str, dict[int, dict[int, float]]] = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    for r in rows:
        mid = str(r["Municipality ID"])
        ano = r["Open Activity Year"]
        sid = r["Company Size Sebrae ID"]
        if not isinstance(ano, int):
            continue
        serie[mid][ano][sid] += r["Establishments"]
    return serie


def _anos_referencia(rows: list[dict]) -> tuple[int, int, int]:
    """(refYear, prevYear, anoCorrente). refYear = último ano civil completo."""
    ano_corrente = datetime.now().year
    anos = sorted({r["Open Activity Year"] for r in rows if isinstance(r["Open Activity Year"], int)})
    completos = [a for a in anos if a < ano_corrente]
    if len(completos) < 2:
        sys.exit("Série anual insuficiente para calcular crescimento.")
    ref = completos[-1]
    return ref, ref - 1, ano_corrente


def build_values(snapshot: dict) -> tuple[list[dict], dict]:
    rows = snapshot["rows"]
    serie = _series_por_municipio(rows)
    codes = municipios_canonicos()
    extra = set(serie) - set(codes)
    if extra:
        sys.exit("Códigos IBGE fora da lista dos 223 da PB: " + ", ".join(sorted(extra))[:400])

    ref_year, prev_year, ano_corrente = _anos_referencia(rows)
    source = f"{SOURCE} (ano-ref {ref_year} vs {prev_year}; ano corrente {ano_corrente} parcial)"

    valores: list[dict] = []
    pb = defaultdict(float)  # cross-check estadual: ano -> total
    for code in codes:
        por_ano = serie.get(code, {})
        tot = {a: sum(s.values()) for a, s in por_ano.items()}
        for a, v in tot.items():
            pb[a] += v
        fluxo_ref = tot.get(ref_year, 0.0)
        fluxo_prev = tot.get(prev_year, 0.0)

        serie_anual = {str(a): int(tot[a]) for a in sorted(tot) if a >= ANO_MIN_SERIE and a <= ref_year}
        split = por_ano.get(ref_year, {})
        por_porte = {nome: int(split.get(sid, 0)) for sid, nome in SIZE_KEYS.items()}
        parcial = {"ano": ano_corrente, "aberturas": int(tot.get(ano_corrente, 0)), "nota": "ano corrente parcial"}

        if not fluxo_prev:  # sem base → não dá pra calcular variação
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ref_year),
                "source": source, "isFictional": False,
                "breakdown": {
                    "semBase": True, "anoBase": prev_year, "aberturasAnoBase": int(fluxo_prev),
                    "aberturasRef": int(fluxo_ref), "serieAnual": serie_anual,
                    "porPorteRef": por_porte, "anoCorrenteParcial": parcial,
                },
            })
            continue

        crescimento = (fluxo_ref - fluxo_prev) / fluxo_prev * 100.0
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": f"{crescimento:+.0f}%", "numericValue": round(crescimento, 1),
            "referenceYear": str(ref_year), "source": source, "isFictional": False,
            "breakdown": {
                "aberturasRef": int(fluxo_ref),         # MPE abertas no ano-ref
                "aberturasAnoBase": int(fluxo_prev),     # MPE abertas no ano anterior
                "anoRef": ref_year, "anoBase": prev_year,
                "porPorteRef": por_porte,                # split MEI/ME/EPP no ano-ref
                "serieAnual": serie_anual,               # série de aberturas/ano
                "anoCorrenteParcial": parcial,
                "confiabilidade": "baixa" if fluxo_prev < CONF_BAIXA else "normal",
                "metrica": "fluxo de novas aberturas por ano (todas as situações cadastrais)",
            },
        })

    meta = {"refYear": ref_year, "prevYear": prev_year, "anoCorrente": ano_corrente, "pbPorAno": dict(pb)}
    return valores, meta


HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_crescimento_mpe.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict], ref_year: int) -> Path:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: não há faixa oficial p/ taxa de crescimento de MPE (não inventamos cortes).
        "referenceYear": str(ref_year),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "unit": "% a.a.",
        "placements": [{"section": "agenda", "agendaId": "inovacao", "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append(f"// --- 1) Catálogo: o indicador {INDICATOR_ID} (agenda inovacao) ---")
    lines.append("// Proxy MUNICIPAL (RFB): crescimento das MPE formalizadas no município.")
    lines.append("// O recorte 'nos ELI' (Ecossistemas Locais de Inovação) é dado interno do Sebrae,")
    lines.append("// inexistente em fonte aberta — ver docstring do gerador e o MAPEAMENTO.")
    lines.append("// SEM threshold: não há faixa oficial de crescimento de MPE (não inventamos cortes).")
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    # replaceOne, não $set: o documento vira exatamente o que este seed declara,
    # então campo removido do seed some do banco (ver CLAUDE.md, armadilhas).
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {")
    lines.append("  filter: { _id: i._id }, replacement: i, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({INDICATOR_ID}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), ano-ref {ref_year} vs {ref_year - 1} ---")
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
    ap = argparse.ArgumentParser(description=f"Gera o seed do indicador {INDICATOR_ID} (crescimento de MPE — RFB/Observatório Sebrae).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consultar a API")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] snapshot {snapshot.get('fetchedAt')} — {len(snapshot['rows'])} linhas.")
    else:
        snapshot = fetch()
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[online] {len(snapshot['rows'])} linhas; snapshot salvo em {SNAPSHOT}")

    values, meta = build_values(snapshot)
    out = emit(values, meta["refYear"])

    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    pb = meta["pbPorAno"]
    ref, prev = meta["refYear"], meta["prevYear"]
    pb_cresc = (pb.get(ref, 0) - pb.get(prev, 0)) / pb.get(prev, 1) * 100 if pb.get(prev) else 0
    print(f"{INDICATOR_ID}: {len(com)}/223 com crescimento calculável; média={media:+.1f}% "
          f"(ano-ref {ref} vs {prev}).")
    print(f"Cross-check PB: aberturas {prev}={int(pb.get(prev,0))} -> {ref}={int(pb.get(ref,0))} ({pb_cresc:+.1f}%).")
    print(f"OK — seed em {out}")


if __name__ == "__main__":
    main()
