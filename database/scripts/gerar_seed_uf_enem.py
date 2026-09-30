#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o seed estadual da PONTUAÇÃO MÉDIA DO ENEM na Paraíba (cubo INEP_enem).

    python3 database/scripts/gerar_seed_uf_enem.py [--offline]

O QUE ESTA MÉDIA É — E O QUE ELA NÃO É
    O cubo expõe quatro medidas de nota: `Math`, `Languages`, `Natural Sciences` e
    `Social Sciences`. **Não há medida de redação.** A média servida aqui é portanto
    a média simples das QUATRO ÁREAS OBJETIVAS, não a nota final do ENEM, que o INEP
    compõe com a redação. Chamar isso de "pontuação média do ENEM" sem a ressalva
    superestimaria o que o dado cobre — por isso a ressalva está no `label`, na
    `description` e no `breakdown`.

    A média é simples, não ponderada pelo nº de participantes por área: o cubo já
    devolve cada área como média por participante da UF.

SEM THRESHOLD
    O INEP não publica faixa de "bom/atenção/alerta" para média de UF. Como todos os
    indicadores estaduais, este entra sem régua — ver `database/setup.mongodb.js`.
    A nota é escala, então a posição entre UFs compara direto, sem normalizar.
"""
from __future__ import annotations

import argparse

import _tesseract as tq

CUBE = "INEP_enem"
AREAS = ("Math", "Languages", "Natural Sciences", "Social Sciences")
ROTULOS = {"Math": "Matemática", "Languages": "Linguagens e Códigos",
           "Natural Sciences": "Ciências da Natureza", "Social Sciences": "Ciências Humanas"}
SNAPSHOT = "uf_enem_pb.json"
SCRIPT = "gerar_seed_uf_enem.py"
SEED = "indicador-uf-enem.mongodb.js"
INDICATOR_ID = "uf-enem-media"

FONTE = ("INEP — Microdados do ENEM (cubo INEP_enem), via API Tesseract pública do "
         "Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br). "
         "Média das quatro áreas objetivas; não inclui redação")


def media_por_uf(rows, ano):
    out = {}
    for r in tq.ufs_validas(rows):
        if r.get("Year") != ano:
            continue
        notas = [r.get(a) for a in AREAS]
        if any(n is None for n in notas):
            continue
        out[r["State ID"]] = sum(float(n) for n in notas) / len(AREAS)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed estadual da média do ENEM (PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo")
    args = ap.parse_args()

    if args.offline:
        rows = tq.ler_snapshot(SNAPSHOT)
        print(f"[offline] snapshot de {SNAPSHOT}")
    else:
        print(f"[online] consultando o cubo {CUBE} (27 UFs, série completa)...")
        rows = tq.consultar(CUBE, "State,Year", ",".join(AREAS) + ",Students")
        print(f"[online] snapshot salvo em {tq.salvar_snapshot(SNAPSHOT, rows)}")

    anos = sorted({r["Year"] for r in tq.ufs_validas(rows) if r.get("Year") is not None})
    if not anos:
        raise SystemExit("resposta sem anos válidos.")
    ref = max(anos)
    pb = {r["Year"]: r for r in rows if r.get("State ID") == tq.UF_PB}
    serie = {a: sum(float(pb[a][x]) for x in AREAS) / len(AREAS) for a in pb if a in pb}
    print(f"série {min(anos)}–{ref}; PB {ref} = {serie[ref]:.1f}")

    valores = []
    for ano in anos:
        if ano not in pb:
            continue
        r = pb[ano]
        # nota é escala: compara direto entre UFs, sem normalizar
        pos = tq.posicao(media_por_uf(rows, ano), True)
        d = {
            "uf": tq.PB, "indicatorId": INDICATOR_ID,
            "rawValue": tq.br_dec(serie[ano], 1), "numericValue": round(serie[ano], 2),
            "referenceYear": str(ano), "source": FONTE, "isFictional": False,
            "breakdown": {
                "porArea": {ROTULOS[a]: round(float(r[a]), 1) for a in AREAS},
                "participantes": int(round(float(r["Students"]))) if r.get("Students") else None,
                "composicao": "media simples das 4 areas objetivas — NAO inclui redacao, que o cubo nao expoe",
                "posicao": pos,
            },
        }
        anterior = ano - 1
        if anterior in serie and serie[anterior]:
            d["variation"] = {
                "deltaPct": round((serie[ano] - serie[anterior]) / serie[anterior] * 100, 2),
                "previousValue": round(serie[anterior], 2),
                "previousYear": str(anterior), "basis": "yoy",
            }
        valores.append(d)

    indicadores = [{
        "_id": INDICATOR_ID, "label": "Pontuação média no ENEM (áreas objetivas)",
        "referenceYear": str(ref), "unit": "pontos",
        "description": ("Média simples das notas das quatro áreas objetivas do ENEM "
                        "(Matemática, Linguagens, Ciências da Natureza e Ciências Humanas) "
                        "entre os participantes da Paraíba. Não inclui a nota de redação, "
                        "que a fonte não disponibiliza neste recorte."),
        "source": FONTE, "sourceDataset": "inep_enem_observatorio_sebrae",
        "placements": [{"section": "estadual", "order": 6}],
    }]
    comentario = """
    numericValue = media simples das 4 areas OBJETIVAS. NAO e a nota final do ENEM:
    o cubo nao expoe redacao. O label e a description carregam a ressalva.
    A nota e escala, entao a posicao entre UFs nao e normalizada.
    """
    print(f"\nOK — {len(valores)} docs. Seed: {tq.emitir_seed(SCRIPT, SEED, indicadores, valores, comentario)}")


if __name__ == "__main__":
    main()
