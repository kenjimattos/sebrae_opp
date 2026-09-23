#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grava a régua relativa (tercis entre os 223 municípios da PB) nos seeds.

    python3 database/scripts/aplicar_tercis.py            # relatório, não escreve
    python3 database/scripts/aplicar_tercis.py --escrever # aplica aos seeds

POR QUE É UM PASSO À PARTE, E NÃO CÓDIGO DENTRO DE CADA GERADOR
    O tercil é uma conta ENTRE municípios, e a normalização atravessa
    indicadores: `trabalhadores-medio-completo` precisa da população, que vive no
    breakdown do `pib-per-capita`; `negocios-extintos` precisa do estoque de
    `empresas-ativas`. Nenhum `gerar_seed_*.py` enxerga o que outro produziu — ele
    busca a sua fonte e escreve o seu arquivo. Pôr a conta dentro de cada um
    exigiria que oito geradores soubessem ler o seed de dois outros, e obrigaria
    a rodar tudo (com VPN, com BigQuery) para mexer num corte.

    Como passo posterior, roda sobre o que os geradores já produziram, é
    idempotente e re-executável sem rede.

    **Consequência a não esquecer:** rodar um gerador reescreve o bloco de
    catálogo com `replaceOne`, e isso APAGA o threshold derivado. Depois de
    qualquer `gerar_seed_*.py` dos 11 indicadores da lista, rode este script de
    novo. O RUNBOOK_ETL.md registra isso na ordem das etapas.
"""

from __future__ import annotations

import argparse
import re
import sys

import _seeds
import _tercis


def coletar(indicator_id, derivado, populacoes):
    """municipality_id -> normalizado | None (None = sem base de comparação)."""
    valores = _seeds.valores_por_municipio(indicator_id, indicator_id)
    fora = {}
    for mid, doc in valores.items():
        bruto = doc.get('numericValue')
        breakdown = doc.get('breakdown') or {}
        # Sem número é sem medida — o mesmo que o servidor já faz. E o portão do
        # próprio indicador vem antes da normalização: se o município não tem base
        # de comparação, não há conta a fazer.
        if bruto is None or (derivado.sem_base and derivado.sem_base(breakdown)):
            fora[mid] = None
            continue
        fora[mid] = derivado.normalizacao.aplicar(bruto, mid, breakdown)
    return fora


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--escrever', action='store_true', help='aplica aos seeds (sem isto, só relata)')
    args = ap.parse_args()

    populacoes = _seeds.populacoes()
    ativas = _seeds.empresas_ativas()
    print('denominadores: população %d municípios · empresas ativas %d municípios\n'
          % (len(populacoes), len(ativas)))

    catalogo = _tercis.catalogo_derivados(populacoes, ativas)
    aceitos, recusados = [], []

    for indicator_id, derivado in sorted(catalogo.items()):
        normalizados = coletar(indicator_id, derivado, populacoes)
        if not normalizados:
            recusados.append((indicator_id, 'seed sem valores'))
            continue
        try:
            threshold = _tercis.avaliar(indicator_id, derivado, normalizados)
        except _tercis.Recusa as e:
            recusados.append((indicator_id, str(e)))
            continue

        dist = _tercis.distribuicao(derivado, threshold, normalizados)
        unidade = derivado.normalizacao.unit or ''
        # Imprime na direção em que a régua se lê, senão um lower-better sai com
        # os cortes em ordem decrescente e parece defeito.
        sinal = '>=' if derivado.kind == 'higher-better' else '<='
        print('%-32s %-13s bom %s %s%s · atenção %s %s%s' % (
            indicator_id, derivado.kind,
            sinal, _tercis._fmt(threshold['success']), unidade,
            sinal, _tercis._fmt(threshold['warning']), unidade))
        print('%-32s alerta %3d · atenção %3d · bom %3d · sem base %3d%s' % (
            '', dist['alert'], dist['warning'], dist['success'], dist['none'],
            ('   (%s)' % derivado.nota) if derivado.nota else ''))
        aceitos.append((indicator_id, derivado, threshold, normalizados))

    if recusados:
        print('\nRECUSADOS — seguem sem semáforo:')
        for indicator_id, motivo in recusados:
            print('  %-30s %s' % (indicator_id, motivo))

    if not args.escrever:
        print('\n(dry-run — nada foi escrito. Use --escrever para aplicar.)')
        return 0

    for indicator_id, derivado, threshold, normalizados in aceitos:
        escrever(indicator_id, threshold, normalizados)
    print('\n%d seeds atualizados.' % len(aceitos))
    return 0


def escrever(indicator_id, threshold, normalizados):
    """Grava o threshold no catálogo e o normalizedValue em cada valor."""
    caminho = _seeds.caminho_seed(indicator_id)
    _anotar(caminho, indicator_id, threshold, normalizados)
    alteracoes = {}

    for linha, doc in _seeds.ler_docs(caminho, _seeds.eh_catalogo):
        if doc['_id'] != indicator_id:
            continue
        # Reconstrói a ordem das chaves para o threshold cair logo após `label`,
        # onde ele já está nos 6 seeds oficiais — o diff fica comparável.
        novo = {}
        for chave, valor in doc.items():
            if chave == 'threshold':
                continue
            novo[chave] = valor
            if chave == 'label':
                novo['threshold'] = threshold
        alteracoes[linha] = novo

    for linha, doc in _seeds.ler_docs(caminho, _seeds.eh_valor):
        if doc.get('indicatorId') != indicator_id:
            continue
        novo = {}
        for chave, valor in doc.items():
            if chave == 'normalizedValue':
                continue
            novo[chave] = valor
            if chave == 'numericValue':
                novo['normalizedValue'] = normalizados.get(doc['municipalityId'])
        alteracoes[linha] = novo

    _seeds.escrever_docs(caminho, alteracoes)


BANNER = '// RÉGUA RELATIVA aplicada por database/scripts/aplicar_tercis.py.'


def _remover_anotacao(texto):
    """Tira a anotação de uma passada anterior, para o script ser idempotente.

    Por linha, e não por regex sobre o texto todo: a anotação é um bloco de
    comentários seguido de `const indicators`, e um `.*?` com lookahead em `//`
    para na primeira linha de comentário do próprio bloco — removia o banner e
    deixava o resto, que a passada seguinte duplicava. Delimitar pelas duas
    pontas é o que torna a remoção exata.
    """
    linhas = texto.split('\n')
    try:
        inicio = linhas.index(BANNER)
    except ValueError:
        return texto
    fim = inicio
    while fim < len(linhas) and linhas[fim].startswith('//'):
        fim += 1
    return '\n'.join(linhas[:inicio] + linhas[fim:])


def _anotar(caminho, indicator_id, threshold, normalizados):
    """Escreve no seed de onde veio a régua — e que rodar o gerador a apaga.

    O bloco de catálogo é gravado com `replaceOne`: o documento vira exatamente o
    que o gerador declara. Como nenhum `gerar_seed_*.py` conhece os tercis, rodar
    um deles remove o threshold do banco em silêncio — o seed imprime `ok` e o
    campo some. Foi assim que o `trabalhadores-ct` classificou 219 municípios em
    `alert` por sete semanas. O aviso fica no arquivo que a pessoa vai ter aberto.

    Aproveita para corrigir os comentários do gerador que dizem "sem threshold",
    que a partir daqui são falsos. Corrige a FRASE, não apaga a linha: o que elas
    explicam — por que a fonte não publica faixa oficial — continua verdadeiro e
    é a justificativa de o indicador ter caído na régua relativa.
    """
    with open(caminho, 'r') as fh:
        texto = fh.read()

    texto = _remover_anotacao(texto)

    # "sem threshold" era sinônimo de "sem faixa oficial" quando a única régua
    # possível era a da fonte. Agora são coisas diferentes: o indicador segue sem
    # faixa oficial e passou a ter threshold.
    for alvo, troca in (
        ('SEM threshold no catálogo -> sem classificação', 'SEM faixa oficial da fonte'),
        ('Sem threshold no catálogo -> sem classificação', 'Sem faixa oficial da fonte'),
        ('Sem threshold -> sem semáforo', 'Sem faixa oficial da fonte'),
        ('SEM threshold (sem faixa oficial)', 'SEM faixa oficial da fonte'),
        ('SEM threshold:', 'SEM faixa oficial da fonte:'),
        ('SEM threshold.', 'SEM faixa oficial da fonte.'),
    ):
        texto = texto.replace(alvo, troca)

    sem_base = sum(1 for v in normalizados.values() if v is None)
    unidade = threshold.get('basis', {}).get('label', 'valor exibido')
    anotacao = (
        '\n%s\n'
        '// Tercis entre os %d municípios da PB, sobre %s — NÃO é faixa oficial da\n'
        '// fonte, e a UI é obrigada a dizer isso (threshold.provenance).\n'
        '// %d municípios sem base de comparação (normalizedValue: null, != zero).\n'
        '// ATENÇÃO: o bloco de catálogo usa replaceOne. Rodar o gerador deste seed\n'
        '// APAGA o threshold abaixo — rode aplicar_tercis.py de novo depois.\n'
        % (BANNER, _tercis.TOTAL_MUNICIPIOS, unidade, sem_base)
    )
    texto = texto.replace('\nconst indicators = [', anotacao + 'const indicators = [', 1)

    with open(caminho, 'w') as fh:
        fh.write(texto)


if __name__ == '__main__':
    sys.exit(main())
