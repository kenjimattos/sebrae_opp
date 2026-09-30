#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o seed do grão ESTADUAL a partir do cubo RAIS_workers (Tesseract/Observatório).

    python3 database/scripts/gerar_seed_uf_rais.py            # online
    python3 database/scripts/gerar_seed_uf_rais.py --offline   # usa o snapshot salvo

QUATRO INDICADORES, UM SCRIPT — POR QUE
    O padrão do repo é um gerador por **fonte × consulta**, não por indicador
    (`gerar_seed_negocios_rfb_lake.py` emite 8; `isdel`, `escolaridade`, `ideb_lake` e
    `tempo_abertura_lake` emitem 2 cada). Os quatro daqui saem de variações da mesma
    chamada ao mesmo cubo, mudando só o `drilldowns`:

      uf-empregados ......... Workers, sem recorte
      uf-remuneracao-media .. Remuneration Avg Nominal, sem recorte
      uf-emprego-porte ...... Workers × Establishment Size, SÓ ME e EPP
      uf-emprego-setor ...... Workers × Sector (10 categorias)

O CORTE QUE MUDA 28% DO NÚMERO
    `Workers` conta **vínculos**, e por padrão soma os encerrados durante o ano. Sem
    `Active worker indicator = 1` a PB sai com 1.268.617 vínculos em 2025 em vez de
    914.955 — o primeiro é fluxo, o segundo é o estoque de emprego formal em 31/12,
    que é a leitura de "número de empregados". Todas as consultas aqui aplicam o corte.

SÓ PEQUENOS NEGÓCIOS NO INDICADOR DE PORTE
    `uf-emprego-porte` fica restrito a ME + EPP por decisão de produto (set/2026):
    o indicador é "emprego nas MPE da Paraíba", partido nas duas faixas. Médias e
    grandes ficam FORA do valor — são 522.490 vínculos em 2024, ~64% do total, e a
    soma deste indicador portanto não fecha com `uf-empregados`. O `breakdown`
    registra o total do estado para quem precisar auditar a diferença.

SEM THRESHOLD
    Nenhum dos quatro leva régua — ver `database/setup.mongodb.js` (coleção
    `stateValues`) para o motivo medido. No lugar da cor, o `breakdown` traz a
    posição da PB entre as 27 UFs e entre as 9 do Nordeste.
"""
from __future__ import annotations

import argparse

import _tesseract as tq

CUBE = "RAIS_workers"
ATIVOS = {"Active worker indicator": "1"}
SNAPSHOT = "uf_rais_pb.json"
SCRIPT = "gerar_seed_uf_rais.py"
SEED = "indicador-uf-rais.mongodb.js"

FONTE = (
    "RAIS (Relação Anual de Informações Sociais), cubo RAIS_workers — vínculos ativos "
    "em 31/12 —, via API Tesseract pública do Observatório Setorial Territorial do "
    "Sebrae (observatorio.sebrae.com.br)"
)
SOURCE_DATASET = "rais_vinculos_observatorio_sebrae"
PORTES_MPE = ("Microempresa (ME)", "Empresa de Pequeno Porte (EPP)")


def baixar() -> dict:
    """Uma consulta por recorte. Todas trazem as 27 UFs e a série inteira de anos:
    o recorte por UF é feito aqui, e é o que permite calcular a posição da PB sem
    uma segunda ida à API.

    As populações entram no snapshot junto com os dados — é o que faz `--offline`
    ser offline de verdade (ver `_tesseract.coletar_populacoes`).
    """
    dados = {
        "totais": tq.consultar(CUBE, "State,Year", "Workers,Remuneration Avg Nominal", **ATIVOS),
        "porte": tq.consultar(CUBE, "State,Year,Establishment Size", "Workers", **ATIVOS),
        "setor": tq.consultar(CUBE, "State,Year,Sector", "Workers", **ATIVOS),
    }
    dados["populacoes"] = tq.coletar_populacoes(anos_de(dados["totais"]))
    return dados


def anos_de(rows: list[dict]) -> list[int]:
    return sorted({r["Year"] for r in tq.ufs_validas(rows) if r.get("Year") is not None})


def pb_por_ano(rows: list[dict], measure: str, filtro=None) -> dict[int, float]:
    """ano -> valor da PB, somando as categorias que passarem por `filtro`."""
    out: dict[int, float] = {}
    for r in rows:
        if r.get("State ID") != tq.UF_PB:
            continue
        if filtro and not filtro(r):
            continue
        v = r.get(measure)
        if v is None:
            continue
        out[r["Year"]] = out.get(r["Year"], 0.0) + float(v)
    return out


def variacao(serie: dict[int, float], ano: int) -> dict | None:
    """yoy vs. o ano anterior da série. None quando não há ano anterior."""
    anterior = ano - 1
    if anterior not in serie or not serie[anterior]:
        return None
    return {
        "deltaPct": round((serie[ano] - serie[anterior]) / serie[anterior] * 100, 2),
        "previousValue": round(serie[anterior], 2),
        "previousYear": str(anterior),
        "basis": "yoy",
    }


def doc(indicator_id: str, ano: int, raw: str, num: float, breakdown: dict,
        variation: dict | None) -> dict:
    d = {
        "uf": tq.PB,
        "indicatorId": indicator_id,
        "rawValue": raw,
        "numericValue": num,
        "referenceYear": str(ano),
        "source": FONTE,
        "isFictional": False,
        "breakdown": breakdown,
    }
    if variation:
        d["variation"] = variation
    return d


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed estadual do cubo RAIS_workers.")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem consumir a API")
    args = ap.parse_args()

    if args.offline:
        bruto = tq.ler_snapshot(SNAPSHOT)
        print(f"[offline] snapshot de {SNAPSHOT}")
    else:
        print(f"[online] consultando o cubo {CUBE} (3 recortes, 27 UFs, série completa)...")
        bruto = baixar()
        caminho = tq.salvar_snapshot(SNAPSHOT, bruto)
        print(f"[online] snapshot salvo em {caminho}")

    totais, porte, setor = bruto["totais"], bruto["porte"], bruto["setor"]
    anos = anos_de(totais)
    if not anos:
        raise SystemExit("resposta sem anos válidos — verifique o cubo/recorte.")
    ref = max(anos)
    print(f"série {min(anos)}–{ref}; ano de referência {ref}")

    # denominador das posições per capita, por ano — vem do snapshot, não da rede
    pops = {a: tq.pops_do_snapshot(bruto.get("populacoes"), a) for a in anos}

    # --- séries da PB ---
    s_empregados = pb_por_ano(totais, "Workers")
    s_remun = pb_por_ano(totais, "Remuneration Avg Nominal")
    s_mpe = pb_por_ano(porte, "Workers", lambda r: r.get("Establishment Size") in PORTES_MPE)
    s_setor_total = pb_por_ano(setor, "Workers")

    valores: list[dict] = []

    for ano in anos:
        pop = pops.get(ano, {})

        # 1) nº de empregados — posição per capita (contagem bruta mediria o tamanho da UF)
        if ano in s_empregados:
            pos = tq.posicao(tq.somar_por_uf(totais, "Workers", ano), True, pop)
            valores.append(doc(
                "uf-empregados", ano, tq.br_int(s_empregados[ano]), int(round(s_empregados[ano])),
                {"corte": "Active worker indicator = 1 (vínculos ativos em 31/12)", "posicao": pos},
                variacao(s_empregados, ano),
            ))

        # 2) remuneração média — é razão, compara direto, sem normalizar
        if ano in s_remun:
            pos = tq.posicao(tq.somar_por_uf(totais, "Remuneration Avg Nominal", ano), True)
            valores.append(doc(
                "uf-remuneracao-media", ano, "R$ " + tq.br_dec(s_remun[ano]), round(s_remun[ano], 2),
                {"nominal": True,
                 "nota": "valor NOMINAL do ano, nao deflacionado — nao comparar anos distantes sem indice de precos",
                 "posicao": pos},
                variacao(s_remun, ano),
            ))

        # 3) emprego em MPE (ME + EPP) — o total do estado fica no breakdown
        if ano in s_mpe:
            faixas = {
                r["Establishment Size"]: int(round(r["Workers"]))
                for r in porte
                if r.get("State ID") == tq.UF_PB and r.get("Year") == ano
                and r.get("Establishment Size") in PORTES_MPE
            }
            por_uf_mpe = tq.somar_por_uf(
                [r for r in porte if r.get("Establishment Size") in PORTES_MPE], "Workers", ano
            )
            pos = tq.posicao(por_uf_mpe, True, pop)
            valores.append(doc(
                "uf-emprego-porte", ano, tq.br_int(s_mpe[ano]), int(round(s_mpe[ano])),
                {"porFaixa": faixas,
                 "totalEstadoTodosOsPortes": int(round(s_empregados.get(ano, 0))) or None,
                 "recorte": "so ME e EPP — medias e grandes ficam fora do valor",
                 "corte": "Active worker indicator = 1",
                 "posicao": pos},
                variacao(s_mpe, ano),
            ))

        # 4) emprego por setor — distribuição no breakdown, total no valor
        if ano in s_setor_total:
            por_setor = {}
            for r in setor:
                if r.get("State ID") != tq.UF_PB or r.get("Year") != ano:
                    continue
                por_setor[r["Sector"]] = int(round(r["Workers"]))
            por_setor = dict(sorted(por_setor.items(), key=lambda kv: -kv[1]))
            pos = tq.posicao(tq.somar_por_uf(setor, "Workers", ano), True, pop)
            valores.append(doc(
                "uf-emprego-setor", ano, tq.br_int(s_setor_total[ano]), int(round(s_setor_total[ano])),
                {"porSetor": por_setor,
                 "nSetores": len(por_setor),
                 "corte": "Active worker indicator = 1",
                 "posicao": pos},
                variacao(s_setor_total, ano),
            ))

    indicadores = [
        {"_id": "uf-empregados", "label": "Número de empregados",
         "referenceYear": str(ref), "unit": "vínculos",
         "description": ("Vínculos de emprego formal ativos em 31 de dezembro na Paraíba, "
                         "segundo a RAIS. Conta vínculos, não pessoas: quem tem dois empregos "
                         "formais aparece duas vezes."),
         "source": FONTE, "sourceDataset": SOURCE_DATASET,
         "placements": [{"section": "estadual", "order": 1}]},
        {"_id": "uf-remuneracao-media", "label": "Remuneração média por trabalhador",
         "referenceYear": str(ref), "unit": "R$",
         "description": ("Remuneração média nominal dos vínculos ativos na Paraíba, segundo a "
                         "RAIS. Valor nominal do ano de referência, sem correção pela inflação."),
         "source": FONTE, "sourceDataset": SOURCE_DATASET,
         "placements": [{"section": "estadual", "order": 2}]},
        {"_id": "uf-emprego-porte", "label": "Emprego em micro e pequenas empresas",
         "referenceYear": str(ref), "unit": "vínculos",
         "description": ("Vínculos ativos em microempresas (ME) e empresas de pequeno porte "
                         "(EPP) na Paraíba. Médias e grandes empresas não entram neste número; "
                         "o total do estado fica registrado à parte."),
         "source": FONTE, "sourceDataset": SOURCE_DATASET,
         "placements": [{"section": "estadual", "order": 3}]},
        {"_id": "uf-emprego-setor", "label": "Empregados por setor econômico",
         "referenceYear": str(ref), "unit": "vínculos",
         "description": ("Distribuição dos vínculos ativos na Paraíba pelos setores econômicos "
                         "da RAIS. O valor exibido é o total; a divisão por setor acompanha o "
                         "indicador."),
         "source": FONTE, "sourceDataset": SOURCE_DATASET,
         "placements": [{"section": "estadual", "order": 4}]},
    ]

    comentario = """
    Vínculos ATIVOS em 31/12 (Active worker indicator = 1) — sem esse corte o número
    inclui vínculos encerrados no ano e sobe ~28%.
    breakdown.posicao = onde a PB está entre as 27 UFs e as 9 do Nordeste. É comparação,
    não classificação: nenhum destes indicadores tem threshold.
    uf-emprego-porte cobre SÓ ME e EPP, então não soma com uf-empregados.
    """
    caminho = tq.emitir_seed(SCRIPT, SEED, indicadores, valores, comentario)

    print(f"\nOK — {len(valores)} docs em stateValues, {len(indicadores)} indicadores.")
    print(f"Seed: {caminho}")
    for iid, serie in (("uf-empregados", s_empregados), ("uf-remuneracao-media", s_remun),
                       ("uf-emprego-porte", s_mpe), ("uf-emprego-setor", s_setor_total)):
        print(f"  {iid:<22} {ref}: {serie.get(ref)}")


if __name__ == "__main__":
    main()
