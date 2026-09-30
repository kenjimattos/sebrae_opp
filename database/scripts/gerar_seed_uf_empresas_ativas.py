#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o seed estadual das EMPRESAS ATIVAS na Paraíba (cubo RF — Estabelecimentos).

    python3 database/scripts/gerar_seed_uf_empresas_ativas.py [--offline]

ESTOQUE SEM ANO — E O QUE ISSO OBRIGA
    Ao contrário dos outros quatro geradores estaduais, este NÃO tem série temporal:
    o cubo RF é a base de Estabelecimentos da Receita Federal, e a consulta por
    `Registration Status` devolve o **estoque no momento da carga**, sem dimensão de
    ano. As dimensões de data que existem (`Status Date`, `Open Activity Date`) são a
    data em que o status foi atribuído e a de abertura — nenhuma das duas é a safra
    do retrato.

    Consequência: `referenceYear` aqui é o **ano da coleta**, não um vintage
    estatístico, e `breakdown.coletadoEm` guarda a data exata. O mesmo recurso que
    `emendas` usa para a mesma ambiguidade. Rodar o gerador em outro ano cria um doc
    novo em vez de atualizar o anterior — é o comportamento desejado: o retrato velho
    continua auditável.

CUIDADO AO COMPARAR COM O `empresas-ativas` MUNICIPAL
    O grão municipal vem da RF Estabelecimentos **do data lake do Sebrae**
    (`gerar_seed_negocios_rfb_lake.py`), com outra data de carga. A soma dos 223
    municípios não tem de fechar com este número, e divergir não é defeito de nenhum
    dos dois — são retratos de dias diferentes. Documentado em MAPEAMENTO §14.

SEM THRESHOLD, como todos os estaduais (ver `database/setup.mongodb.js`).
"""
from __future__ import annotations

import argparse
from datetime import date

import _tesseract as tq

CUBE = "RF"
ATIVA = "2"  # Registration Status: 1=Nula 2=Ativa 3=Suspensa 4=Inapta 8=Baixada
SNAPSHOT = "uf_empresas_ativas_pb.json"
SCRIPT = "gerar_seed_uf_empresas_ativas.py"
SEED = "indicador-uf-empresas-ativas.mongodb.js"
INDICATOR_ID = "uf-empresas-ativas"

FONTE = ("Receita Federal — base de Estabelecimentos (cubo RF), situação cadastral Ativa, "
         "via API Tesseract pública do Observatório Setorial Territorial do Sebrae "
         "(observatorio.sebrae.com.br)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed estadual das empresas ativas (PB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo")
    args = ap.parse_args()

    if args.offline:
        bruto = tq.ler_snapshot(SNAPSHOT)
        print(f"[offline] snapshot de {SNAPSHOT}")
    else:
        print(f"[online] consultando o cubo {CUBE} (estoque por situação cadastral)...")
        bruto = {
            # ativas nas 27 UFs -> valor + posição
            "ativas": tq.consultar(CUBE, "State", "Establishments", **{"Registration Status": ATIVA}),
            # todas as situações, só PB -> contexto no breakdown
            "situacoes": tq.consultar(CUBE, "State,Registration Status", "Establishments", State=tq.PB),
        }
        bruto["coletadoEm"] = date.today().isoformat()
        # população junto no snapshot: é o que faz --offline dispensar a rede
        # o ano da coleta (2026) está fora da série de população (termina em 2025),
        # então normaliza pelo ano mais recente disponível — e registra qual foi
        ano_pop, pops = tq.populacoes_uf_recente()
        bruto["populacoes"] = {ano_pop: {str(uf): v for uf, v in pops.items()}}
        bruto["anoPopulacao"] = ano_pop
        print(f"[online] snapshot salvo em {tq.salvar_snapshot(SNAPSHOT, bruto)}")

    ativas, situacoes = bruto["ativas"], bruto["situacoes"]
    coletado = bruto.get("coletadoEm") or date.today().isoformat()
    ano = coletado[:4]

    por_uf = tq.somar_por_uf(ativas, "Establishments")
    if tq.UF_PB not in por_uf:
        raise SystemExit("a PB não veio na resposta — verifique o cubo/recorte.")
    valor = por_uf[tq.UF_PB]
    ano_pop = bruto.get("anoPopulacao") or ano
    pos = tq.posicao(por_uf, True, tq.pops_do_snapshot(bruto.get("populacoes"), ano_pop))
    print(f"PB = {tq.br_int(valor)} ativas; coleta {coletado}")

    por_situacao = {
        r["Registration Status"]: int(round(r["Establishments"]))
        for r in situacoes if r.get("State ID") == tq.UF_PB
    }
    por_situacao = dict(sorted(por_situacao.items(), key=lambda kv: -kv[1]))

    valores = [{
        "uf": tq.PB, "indicatorId": INDICATOR_ID,
        "rawValue": tq.br_int(valor), "numericValue": int(round(valor)),
        "referenceYear": ano, "source": FONTE, "isFictional": False,
        "breakdown": {
            "porSituacaoCadastral": por_situacao,
            "coletadoEm": coletado,
            "anoPopulacaoNormalizacao": ano_pop,
            "referenceYearE": "ano da COLETA, nao vintage estatistico — o cubo RF nao tem dimensao de ano para o estoque",
            "comparacaoMunicipal": "nao soma com o empresas-ativas municipal (fonte = data lake, outra data de carga)",
            "posicao": pos,
        },
    }]

    indicadores = [{
        "_id": INDICATOR_ID, "label": "Empresas ativas",
        "referenceYear": ano, "unit": "estabelecimentos",
        "description": ("Estabelecimentos com situação cadastral Ativa na Receita Federal, "
                        "sediados na Paraíba. É um retrato do estoque na data da coleta, não "
                        "um dado anual."),
        "source": FONTE, "sourceDataset": "rfb_estabelecimentos_observatorio_sebrae",
        "placements": [{"section": "estadual", "order": 8}],
    }]
    comentario = """
    ESTOQUE sem dimensao de ano: referenceYear e o ano da COLETA e breakdown.coletadoEm
    guarda a data exata. Rodar em outro ano cria doc novo, mantendo o retrato antigo auditavel.
    Nao soma com o empresas-ativas municipal — aquele vem do data lake, com outra data de carga.
    """
    print(f"\nOK — {len(valores)} doc. Seed: {tq.emitir_seed(SCRIPT, SEED, indicadores, valores, comentario)}")


if __name__ == "__main__":
    main()
