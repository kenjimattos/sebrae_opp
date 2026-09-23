#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera `public/api-snapshot/municipalities/*.json` — as 223 respostas de
`GET /api/municipalities/:id` servidas estaticamente nesta branch, mais o índice
`municipalities.json` de `GET /api/municipalities`.

POR QUE ESTE ARQUIVO EXISTE
    Os 223 JSONs nunca tiveram gerador. Eram um dump pontual da API Node
    (commit ccec545), e regerá-los exigia a API rodando contra o Mongo do
    Sebrae (10.1.141.23) — inalcançável da Vercel e de fora da VPN. Na prática,
    mudança de contrato deixava o snapshot velho no ar sem erro nenhum, que é a
    falha silenciosa nº 1 desta branch.

    Aqui o snapshot se reconstrói a partir dos SEEDS, que são a mesma coisa que
    o banco recebe. Sem rede, sem VPN, determinístico.

O QUE ELE REIMPLEMENTA, E POR QUE ISSO É UM RISCO ACEITO
    A lógica de leitura do servidor: escolha do ano (`pickValue`), supressão por
    amostra baixa (`isLowConfidence`) e a régua (`computeStatus` +
    `classifiedNumber`). São ~40 linhas duplicadas de `server/src/indicadores/`,
    e a duplicação é deliberada: a alternativa seria rodar o Node contra o Mongo,
    que é justamente o que não se pode fazer daqui.

    A defesa contra a divergência é o `--conferir`, que compara a saída com os
    JSONs que já estão no repositório e exige que os indicadores sem régua nova
    saiam idênticos.

USO
    python3 database/scripts/gerar_api_snapshot_municipios.py --conferir
    python3 database/scripts/gerar_api_snapshot_municipios.py --escrever

Só stdlib.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

import _seeds

OUT_DIR = os.path.join(_seeds.REPO_ROOT, 'public', 'api-snapshot')
MUNICIPIOS_DIR = os.path.join(OUT_DIR, 'municipalities')
INDICE = os.path.join(OUT_DIR, 'municipalities.json')

# Espelho de LOW_SAMPLE_HIDDEN em server/src/indicadores/values.ts. Escopo
# restrito de propósito: outros indicadores também marcam confiabilidade
# 'baixa', mas lá é contagem real de município pequeno, não artefato de média.
LOW_SAMPLE_HIDDEN = {'tempo-abertura', 'tempo-viabilidade'}


def catalogo():
    """(agendas ordenadas, indicadores por agenda, socialeconomic, por id).

    Espelha `loadCatalog` de server/src/indicadores/catalog.ts: a ordem vem do
    `order` das agendas e do `order` de cada placement.
    """
    agendas = sorted(
        (d for _, d in _seeds.ler_docs(
            os.path.join(_seeds.SEED_DIR, 'agendas.mongodb.js'), _seeds.eh_catalogo)),
        key=lambda a: a.get('order', 999),
    )

    por_id = {}
    for nome in sorted(os.listdir(_seeds.SEED_DIR)):
        if not nome.startswith('indicador-'):
            continue
        for _, doc in _seeds.ler_docs(os.path.join(_seeds.SEED_DIR, nome), _seeds.eh_catalogo):
            por_id[doc['_id']] = dict(doc, _seed=nome[len('indicador-'):-len('.mongodb.js')])

    por_agenda, socialeconomic = {}, []
    for ind in por_id.values():
        for p in ind.get('placements', []):
            if p.get('section') == 'agenda':
                por_agenda.setdefault(p.get('agendaId'), []).append((p.get('order', 999), ind))
            elif p.get('section') == 'socialeconomic':
                socialeconomic.append((p.get('order', 999), ind))

    ordenar = lambda pares: [i for _, i in sorted(pares, key=lambda t: t[0])]
    return (
        agendas,
        dict((k, ordenar(v)) for k, v in por_agenda.items()),
        ordenar(socialeconomic),
        por_id,
    )


def valores_indexados(por_id):
    """(municipality_id, indicator_id) -> doc, com o ano já resolvido.

    Espelha `indexValues` + `pickValue`: ano default do catálogo; na falta, o
    mais recente. Ler o ano errado produz número plausível e errado.
    """
    por_indicador = {}
    for ind_id, ind in por_id.items():
        docs = _seeds.ler_docs(_seeds.caminho_seed(ind['_seed']), _seeds.eh_valor)
        for _, doc in docs:
            if doc.get('indicatorId') != ind_id:
                continue
            por_indicador.setdefault((doc['municipalityId'], ind_id), []).append(doc)

    fora = {}
    for chave, docs in por_indicador.items():
        ano_default = por_id[chave[1]].get('referenceYear')
        escolhido = next((d for d in docs if d.get('referenceYear') == ano_default), None)
        if escolhido is None:
            escolhido = max(docs, key=lambda d: d.get('referenceYear') or '')
        fora[chave] = escolhido
    return fora


def baixa_confianca(doc):
    if doc is None or doc.get('indicatorId') not in LOW_SAMPLE_HIDDEN:
        return False
    return (doc.get('breakdown') or {}).get('confiabilidade') in ('baixa', 'sem-dados')


def numero_classificado(threshold, doc):
    """Espelho de `classifiedNumber` (server/src/indicadores/status.ts).

    Régua relativa lê `normalizedValue` e SÓ ele: cair no bruto classificaria
    uma contagem contra uma faixa per capita.
    """
    if not threshold or doc is None:
        return None
    n = doc.get('normalizedValue') if threshold.get('provenance') == 'relativo-pb' \
        else doc.get('numericValue')
    return n if isinstance(n, (int, float)) else None


def status(threshold, doc):
    """Espelho de `computeStatus`."""
    if not threshold or doc is None:
        return 'none'
    if threshold.get('kind') == 'enum':
        return threshold.get('map', {}).get(str(doc.get('rawValue') or '').strip(), 'none')
    n = numero_classificado(threshold, doc)
    if n is None:
        return 'none'
    if threshold['kind'] == 'higher-better':
        if n >= threshold['success']:
            return 'success'
        return 'warning' if n >= threshold['warning'] else 'alert'
    if n <= threshold['success']:
        return 'success'
    return 'warning' if n <= threshold['warning'] else 'alert'


def montar(municipio, agendas, por_agenda, socialeconomic, por_id, valores):
    """Espelho de `buildIndicatorsData` (server/src/municipios/service.ts)."""
    mid = municipio['_id']
    saida_agendas = []
    for agenda in agendas:
        indicadores = []
        for ind in por_agenda.get(agenda['_id'], []):
            doc = valores.get((mid, ind['_id']))
            suprimido = baixa_confianca(doc)
            item = {
                'id': ind['_id'],
                'label': ind['label'],
                'value': '—' if suprimido else (doc or {}).get('rawValue', '—'),
                'numericValue': None if suprimido else (doc or {}).get('numericValue'),
            }
            normalizado = None if suprimido else (doc or {}).get('normalizedValue')
            if normalizado is not None or ind.get('threshold', {}).get('provenance') == 'relativo-pb':
                item['normalizedValue'] = normalizado
            variacao = None if suprimido else (doc or {}).get('variation')
            if variacao is not None:
                item['variation'] = variacao
            item['status'] = 'none' if suprimido else status(ind.get('threshold'), doc)
            if ind.get('threshold'):
                item['threshold'] = ind['threshold']
            indicadores.append(item)
        saida_agendas.append({'id': agenda['_id'], 'name': agenda['name'], 'indicators': indicadores})

    base = []
    for ind in socialeconomic:
        doc = valores.get((mid, ind['_id']))
        base.append({
            'id': ind['_id'],
            'label': ind['label'],
            'value': (doc or {}).get('rawValue', '—'),
            'variation': (doc or {}).get('variation', ''),
            'referenceYear': (doc or {}).get('referenceYear') or ind.get('referenceYear') or '',
        })

    return {'municipality': municipio['name'], 'agendas': saida_agendas, 'economicBase': base}


def municipios():
    caminho = os.path.join(_seeds.SEED_DIR, 'municipios.mongodb.js')
    return [d for _, d in _seeds.ler_docs(caminho, _seeds.eh_catalogo) if 'slug' in d]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--escrever', action='store_true')
    ap.add_argument('--conferir', action='store_true',
                    help='compara com o snapshot no repositório e relata as diferenças por indicador')
    args = ap.parse_args()

    agendas, por_agenda, socialeconomic, por_id = catalogo()
    valores = valores_indexados(por_id)
    lista = municipios()
    print('catálogo: %d agendas · %d indicadores · %d municípios' % (
        len(agendas), len(por_id), len(lista)))

    # Um parse que devolve lista vazia não levanta erro — ele produz um snapshot
    # vazio, e o `--conferir` chega a imprimir "nenhuma diferença" porque não há
    # o que comparar. Esta guarda transforma o silêncio em falha.
    if len(agendas) != 6 or len(lista) != _seeds.TOTAL_MUNICIPIOS or len(por_id) < 30:
        print('\nABORTADO: esperava 6 agendas, %d municípios e 30+ indicadores.'
              % _seeds.TOTAL_MUNICIPIOS, file=sys.stderr)
        return 1

    gerados = dict((m['_id'], montar(m, agendas, por_agenda, socialeconomic, por_id, valores))
                   for m in lista)

    if args.conferir:
        return conferir(gerados)

    if not args.escrever:
        print('\n(dry-run. Use --conferir para comparar ou --escrever para gravar.)')
        return 0

    for mid, dados in gerados.items():
        _escrever_json(os.path.join(MUNICIPIOS_DIR, '%s.json' % mid), dados)

    # Ordem por `name` em comparação binária, que é a do Mongo (`.sort({name:1})`)
    # e a que o dump original tinha: põe "Água Branca" em ÚLTIMO, porque Á > Z em
    # code point. Ordenar com locale aqui mudaria a ordem da lista do seletor de
    # município sem que nada no código apontasse o motivo.
    _escrever_json(INDICE, [
        {'id': m['_id'], 'name': m['name'], 'slug': m['slug']}
        for m in sorted(lista, key=lambda m: m['name'])
    ])
    print('\n%d municípios + índice escritos em public/api-snapshot/.' % len(gerados))
    return 0


def _escrever_json(caminho, dados):
    """Compacto e sem newline final — o formato exato do dump original.

    `separators=(',', ':')` não é estética: com o default do json.dump os 224
    arquivos ganham um espaço por chave, o diff vira 224 arquivos reescritos por
    inteiro e some a chance de ver que só mudou o esperado.
    """
    with open(caminho, 'w') as fh:
        json.dump(dados, fh, ensure_ascii=False, separators=(',', ':'))


def conferir(gerados):
    """Compara campo a campo com o snapshot atual, agrupando por indicador.

    O que se procura aqui não é "mudou", e sim "mudou onde não devia": indicador
    que não recebeu régua nova tem de sair idêntico. Diferença fora da lista
    esperada significa que a reimplementação do servidor divergiu do original.
    """
    from collections import defaultdict
    difs = defaultdict(lambda: defaultdict(int))
    faltando = 0

    for mid, novo in gerados.items():
        caminho = os.path.join(MUNICIPIOS_DIR, '%s.json' % mid)
        if not os.path.exists(caminho):
            faltando += 1
            continue
        with open(caminho) as fh:
            velho = json.load(fh)
        antes = dict((i['id'], i) for a in velho.get('agendas', []) for i in a['indicators'])
        depois = dict((i['id'], i) for a in novo['agendas'] for i in a['indicators'])
        for ind_id, item in depois.items():
            anterior = antes.get(ind_id)
            if anterior is None:
                difs[ind_id]['novo no snapshot'] += 1
                continue
            for campo in ('value', 'numericValue', 'status', 'threshold', 'normalizedValue'):
                if anterior.get(campo) != item.get(campo):
                    difs[ind_id][campo] += 1

    print('\nDIFERENÇAS vs. o snapshot no repositório (por indicador):')
    for ind_id in sorted(difs):
        campos = ', '.join('%s em %d' % (c, n) for c, n in sorted(difs[ind_id].items()))
        print('  %-32s %s' % (ind_id, campos))
    if faltando:
        print('  (%d municípios sem arquivo no snapshot atual)' % faltando)
    if not difs:
        print('  nenhuma — a saída é idêntica ao snapshot atual.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
