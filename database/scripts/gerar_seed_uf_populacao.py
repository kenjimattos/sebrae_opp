#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o seed estadual da POPULAÇÃO TOTAL da Paraíba (cubo IBGE, Tesseract).

    python3 database/scripts/gerar_seed_uf_populacao.py [--offline]

POR QUE O CUBO `IBGE` E NÃO O `DATASUS_Estimativas_Populacionais`
    Os dois trazem população por UF. O do DATASUS para em **2021**; o cubo `IBGE`
    (PIB Municipal — PIB e Impostos) tem a medida `Population` de 2001 a 2025.
    Medido antes de escolher: DATASUS 2021 = 4.059.905; IBGE 2025 = 4.164.468.

    Este mesmo cubo é o denominador das posições per capita dos outros geradores
    (`_tesseract.populacoes_uf`), então usar outra fonte aqui faria a população
    exibida discordar da que normaliza os demais indicadores.

A POSIÇÃO AQUI É TAMANHO, NÃO DESEMPENHO
    População é a única dos 8 em que a posição bruta é o próprio sentido do dado —
    e por isso ela NÃO é normalizada. 14º de 27 significa "14ª UF mais populosa",
    não "vai razoavelmente bem". Sem threshold, como todos os estaduais.
"""
from __future__ import annotations

import argparse

import _tesseract as tq

CUBE = "IBGE"
SNAPSHOT = "uf_populacao_pb.json"
SCRIPT = "gerar_seed_uf_populacao.py"
SEED = "indicador-uf-populacao.mongodb.js"
INDICATOR_ID = "uf-populacao"

FONTE = ("IBGE — estimativas populacionais (cubo IBGE, PIB Municipal), via API Tesseract "
         "pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed estadual da população total (PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo")
    args = ap.parse_args()

    if args.offline:
        rows = tq.ler_snapshot(SNAPSHOT)
        print(f"[offline] snapshot de {SNAPSHOT}")
    else:
        print(f"[online] consultando o cubo {CUBE} (27 UFs, série completa)...")
        rows = tq.consultar(CUBE, "State,Year", "Population")
        print(f"[online] snapshot salvo em {tq.salvar_snapshot(SNAPSHOT, rows)}")

    anos = sorted({r["Year"] for r in tq.ufs_validas(rows) if r.get("Year") is not None})
    if not anos:
        raise SystemExit("resposta sem anos válidos.")
    ref = max(anos)
    serie = {r["Year"]: float(r["Population"]) for r in rows if r.get("State ID") == tq.UF_PB}
    print(f"série {min(anos)}–{ref}; PB {ref} = {tq.br_int(serie[ref])}")

    valores = []
    for ano in anos:
        if ano not in serie:
            continue
        # sem denominador de propósito: a posição aqui é ordem de tamanho
        pos = tq.posicao(tq.somar_por_uf(rows, "Population", ano), True)
        d = {
            "uf": tq.PB, "indicatorId": INDICATOR_ID,
            "rawValue": tq.br_int(serie[ano]), "numericValue": int(round(serie[ano])),
            "referenceYear": str(ano), "source": FONTE, "isFictional": False,
            "breakdown": {
                "posicao": pos,
                "nota": "posicao e ordem de TAMANHO (14o = 14a UF mais populosa), nao desempenho",
            },
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
        "_id": INDICATOR_ID, "label": "População total",
        "referenceYear": str(ref), "unit": "habitantes",
        "description": ("População residente estimada na Paraíba. Serve também de "
                        "denominador para as comparações per capita dos demais "
                        "indicadores estaduais."),
        "source": FONTE, "sourceDataset": "ibge_populacao_observatorio_sebrae",
        "placements": [{"section": "estadual", "order": 5}],
    }]
    comentario = """
    breakdown.posicao aqui e ordem de tamanho entre as 27 UFs, nao classificacao —
    e por isso nao e normalizada. Sem threshold, como todos os indicadores estaduais.
    """
    print(f"\nOK — {len(valores)} docs. Seed: {tq.emitir_seed(SCRIPT, SEED, indicadores, valores, comentario)}")


if __name__ == "__main__":
    main()
