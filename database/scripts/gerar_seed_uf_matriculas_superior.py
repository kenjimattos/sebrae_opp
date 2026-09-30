#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o seed estadual das MATRÍCULAS NO ENSINO SUPERIOR na PB (cubo INEP_censo).

    python3 database/scripts/gerar_seed_uf_matriculas_superior.py [--offline]

CUIDADO COM O NOME DO CUBO
    `INEP_censo` é o **Censo da Educação Superior**; `INEP_Censo_Ed_Basica` é o da
    educação básica, e também tem uma medida `Enrollments`. Trocar um pelo outro
    troca 188 mil matrículas por um número de outra ordem, sem erro nenhum.

POR QUE A POSIÇÃO É PER CAPITA
    Contagem de matrículas entre UFs mede o tamanho do estado. Medido: a PB é 14ª de
    27 per capita, mas **1ª do Nordeste** — e essa é a informação que interessa a
    quem lê. É a mesma razão pela qual o grão municipal tem `normalizedValue`.

SEM THRESHOLD, como todos os estaduais (ver `database/setup.mongodb.js`).
"""
from __future__ import annotations

import argparse

import _tesseract as tq

CUBE = "INEP_censo"
SNAPSHOT = "uf_matriculas_superior_pb.json"
SCRIPT = "gerar_seed_uf_matriculas_superior.py"
SEED = "indicador-uf-matriculas-superior.mongodb.js"
INDICATOR_ID = "uf-matriculas-superior"

FONTE = ("INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública "
         "do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed estadual das matrículas no ensino superior (PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo")
    args = ap.parse_args()

    if args.offline:
        bruto = tq.ler_snapshot(SNAPSHOT)
        print(f"[offline] snapshot de {SNAPSHOT}")
    else:
        print(f"[online] consultando o cubo {CUBE} (27 UFs, série completa)...")
        rows = tq.consultar(CUBE, "State,Year", "Enrollments")
        anos_resp = sorted({r["Year"] for r in tq.ufs_validas(rows) if r.get("Year") is not None})
        # população junto no snapshot: é o que faz --offline dispensar a rede
        bruto = {"rows": rows, "populacoes": tq.coletar_populacoes(anos_resp)}
        print(f"[online] snapshot salvo em {tq.salvar_snapshot(SNAPSHOT, bruto)}")

    rows = bruto["rows"]
    anos = sorted({r["Year"] for r in tq.ufs_validas(rows) if r.get("Year") is not None})
    if not anos:
        raise SystemExit("resposta sem anos válidos.")
    ref = max(anos)
    serie = {r["Year"]: float(r["Enrollments"]) for r in rows if r.get("State ID") == tq.UF_PB}
    print(f"série {min(anos)}–{ref}; PB {ref} = {tq.br_int(serie[ref])}")

    valores = []
    for ano in anos:
        if ano not in serie:
            continue
        pos = tq.posicao(tq.somar_por_uf(rows, "Enrollments", ano), True,
                         tq.pops_do_snapshot(bruto.get("populacoes"), ano))
        d = {
            "uf": tq.PB, "indicatorId": INDICATOR_ID,
            "rawValue": tq.br_int(serie[ano]), "numericValue": int(round(serie[ano])),
            "referenceYear": str(ano), "source": FONTE, "isFictional": False,
            "breakdown": {"posicao": pos,
                          "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"},
        }
        anterior = ano - 1
        if anterior in serie and serie[anterior]:
            d["variation"] = {
                "deltaPct": round((serie[ano] - serie[anterior]) / serie[anterior] * 100, 2),
                "previousValue": int(round(serie[anterior])),
                "previousYear": str(anterior), "basis": "yoy",
            }
        valores.append(d)

    indicadores = [{
        "_id": INDICATOR_ID, "label": "Matrículas no ensino superior",
        "referenceYear": str(ref), "unit": "matrículas",
        "description": ("Matrículas em cursos de graduação na Paraíba, segundo o Censo da "
                        "Educação Superior do INEP. Inclui a rede pública e a privada."),
        "source": FONTE, "sourceDataset": "inep_censo_superior_observatorio_sebrae",
        "placements": [{"section": "estadual", "order": 7}],
    }]
    comentario = """
    Censo da Educacao SUPERIOR (cubo INEP_censo) — nao confundir com INEP_Censo_Ed_Basica,
    que tem uma medida Enrollments com o mesmo nome e outra ordem de grandeza.
    A posicao e per capita: contagem bruta entre UFs mede o tamanho do estado.
    """
    print(f"\nOK — {len(valores)} docs. Seed: {tq.emitir_seed(SCRIPT, SEED, indicadores, valores, comentario)}")


if __name__ == "__main__":
    main()
