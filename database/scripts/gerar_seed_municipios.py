#!/usr/bin/env python3
"""
Gera o seed (mongosh) dos 223 municípios da Paraíba — coleção `municipalities` do banco da OPP.

Cada doc: { _id: código IBGE (7 díg), name, slug, rfCode }.
  - name/slug: do GeoJSON do IBGE (src/data/geo/paraiba.json).
  - rfCode: código de município da Receita Federal (id_municipio_rf) — identificador alternativo
    do município, usado pelo ETL do lake (RF Estabelecimentos) para casar o `MUNICIPIO` do
    estabelecimento (que é o código RFB, não o IBGE) ao municipalityId da OPP. Insumo:
    database/data/municipios_rf_pb.json (origem: basedosdados.br_bd_diretorios_brasil.municipio,
    UF=PB) — referência estática de build, como o próprio GeoJSON.

Saídas (idempotentes, próprias para o NoSQLBooster):
  - database/seed/municipios.mongodb.js

Uso:
  python3 database/scripts/gerar_seed_municipios.py

Sem rede: lê só arquivos locais do repositório.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GEOJSON = REPO_ROOT / "src" / "data" / "geo" / "paraiba.json"
RF_DEPARA = REPO_ROOT / "database" / "data" / "municipios_rf_pb.json"
SEED_DIR = REPO_ROOT / "database" / "seed"
SEED_FILE = SEED_DIR / "municipios.mongodb.js"

HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_municipios.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def load_municipios() -> list[dict]:
    rf_by_ibge = json.loads(RF_DEPARA.read_text(encoding="utf-8")).get("rfByIbge", {})
    gj = json.loads(GEOJSON.read_text(encoding="utf-8"))
    muns, faltando = [], []
    for ft in gj["features"]:
        p = ft["properties"]
        rf = rf_by_ibge.get(p["id"])
        if rf is None:
            faltando.append(p["id"])
        muns.append({"_id": p["id"], "name": p["name"], "slug": slugify(p["name"]), "rfCode": rf})
    if faltando:
        sys.exit(f"Sem rfCode (de-para {RF_DEPARA.name}) p/ {len(faltando)} municípios: "
                 + ", ".join(faltando[:10]))
    muns.sort(key=lambda m: m["_id"])
    return muns


def emit(muns: list[dict]) -> None:
    lines = [HEADER, "", f"// {len(muns)} municípios da Paraíba (name/slug: IBGE/GeoJSON; rfCode: Receita Federal)."]
    lines.append("const municipios = [")
    for m in muns:
        lines.append(f"  {js(m)},")
    lines.append("]")
    lines.append("")
    lines.append("const ops = municipios.map(m => ({ updateOne: {")
    lines.append("  filter: { _id: m._id },")
    lines.append("  update: { $set: { name: m.name, slug: m.slug, rfCode: m.rfCode } },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.municipalities.bulkWrite(ops, { ordered: false })")
    lines.append("print(`municipalities -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)")
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    muns = load_municipios()
    emit(muns)
    print(f"OK — {len(muns)} municípios (com rfCode) -> {SEED_FILE.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
