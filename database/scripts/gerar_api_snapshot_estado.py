#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o snapshot estático de `GET /api/estado` a partir dos SEEDS.

    python3 database/scripts/gerar_api_snapshot_estado.py --conferir
    python3 database/scripts/gerar_api_snapshot_estado.py --escrever

POR QUE LÊ OS SEEDS, E NÃO O BANCO
    Esta branch (`preview/snapshot`) faz deploy na Vercel, que não alcança o Mongo
    do Sebrae. Os seeds são a mesma coisa que o banco tem depois do
    `aplicar_seeds.sh`, e são versionados — então o snapshot se reconstrói aqui sem
    VPN. É a mesma escolha de `gerar_api_snapshot_municipios.py`.

O QUE ISTO REIMPLEMENTA — E O RISCO
    `server/src/estado/service.ts` (buildStateData): filtrar a seção 'estadual' do
    catálogo, escolher o ano (`pickByYear`) e montar a série ordenada. São poucas
    linhas, mas são uma SEGUNDA implementação da mesma regra: se o serviço mudar e
    isto não, o preview passa a mostrar outro ano que a produção — sem erro nenhum.
    `--conferir` é a defesa: rode antes de `--escrever` e confira que a diferença
    é só a que você causou.

MENOS REGRA QUE O DE MUNICÍPIOS, DE PROPÓSITO
    Aqui não há supressão por confiabilidade nem cálculo de status: nenhum
    indicador estadual tem `threshold`. Se algum dia um tiver, esta função precisa
    aprender a régua junto com o serviço — e a asserção no fim avisa.
"""
from __future__ import print_function

import argparse
import json
import os
import sys

import _seeds

OUT = os.path.join(_seeds.REPO_ROOT, 'public', 'api-snapshot', 'estado.json')
UF = '25'
UF_NOME = {'25': 'Paraíba'}  # espelha UF_NAMES em server/src/estado/service.ts


def eh_valor_estadual(doc):
    """Documento de `stateValues`. A chave é `uf`, não `municipalityId` — por isso
    `_seeds.eh_valor` não serve aqui."""
    return 'uf' in doc and 'indicatorId' in doc


def ler_seeds():
    """(catálogo da seção estadual, valores por indicador), varrendo os seeds."""
    catalogo = {}
    valores = {}
    for nome in sorted(os.listdir(_seeds.SEED_DIR)):
        if not nome.startswith('indicador-') or not nome.endswith('.mongodb.js'):
            continue
        caminho = os.path.join(_seeds.SEED_DIR, nome)
        for _, doc in _seeds.ler_docs(caminho, _seeds.eh_catalogo):
            if any(p.get('section') == 'estadual' for p in doc.get('placements') or []):
                catalogo[doc['_id']] = doc
        for _, doc in _seeds.ler_docs(caminho, eh_valor_estadual):
            if doc.get('uf') != UF:
                continue
            valores.setdefault(doc['indicatorId'], []).append(doc)
    return catalogo, valores


def ordem(ind):
    for p in ind.get('placements') or []:
        if p.get('section') == 'estadual':
            return p.get('order', 999)
    return 999


def escolher_ano(docs, ano_default):
    """Espelha `pickByYear` (server/src/indicadores/values.ts): o ano default do
    catálogo se existir, senão o mais recente."""
    if ano_default:
        for d in docs:
            if d.get('referenceYear') == ano_default:
                return d
    return max(docs, key=lambda d: d.get('referenceYear') or '')


def montar():
    catalogo, valores = ler_seeds()
    indicadores = []
    for iid in sorted(catalogo, key=lambda i: (ordem(catalogo[i]), i)):
        ind = catalogo[iid]
        docs = valores.get(iid)
        if not docs:
            continue  # indicador sem valor não é servido — igual ao serviço
        assert 'threshold' not in ind, (
            '%s tem threshold: o grão estadual nao classifica. Se isso mudou de '
            'proposito, este gerador precisa aprender a regua junto com '
            'server/src/estado/service.ts.' % iid
        )
        escolhido = escolher_ano(docs, ind.get('referenceYear'))
        serie = sorted(
            ({'referenceYear': d['referenceYear'],
              'value': d['rawValue'],
              'numericValue': d.get('numericValue')} for d in docs),
            key=lambda p: p['referenceYear'],
        )
        item = {'id': iid, 'label': ind['label']}
        for chave in ('unit', 'description', 'source'):
            if ind.get(chave):
                item[chave] = ind[chave]
        item['value'] = escolhido['rawValue']
        item['numericValue'] = escolhido.get('numericValue')
        if escolhido.get('variation'):
            item['variation'] = escolhido['variation']
        item['referenceYear'] = escolhido['referenceYear']
        if escolhido.get('breakdown'):
            item['breakdown'] = escolhido['breakdown']
        item['series'] = serie
        indicadores.append(item)

    if not indicadores:
        sys.exit('nenhum indicador estadual nos seeds — rode os gerar_seed_uf_*.py primeiro.')
    return {'uf': UF, 'name': UF_NOME.get(UF, UF), 'indicators': indicadores}


def conferir(gerado):
    if not os.path.exists(OUT):
        print('snapshot ainda não existe: %s' % OUT)
        print('(nada a comparar — use --escrever)')
        return 0
    with open(OUT) as fh:
        atual = json.load(fh)
    if atual == gerado:
        print('nenhuma diferença — o snapshot já está em dia.')
        return 0
    antes = {i['id']: i for i in atual.get('indicators', [])}
    depois = {i['id']: i for i in gerado['indicators']}
    print('DIFERENÇAS por indicador:')
    for iid in sorted(set(antes) | set(depois)):
        a, d = antes.get(iid), depois.get(iid)
        if a == d:
            continue
        if a is None:
            print('  + %-24s novo (%s = %s)' % (iid, d['referenceYear'], d['value']))
        elif d is None:
            print('  - %-24s saiu' % iid)
        else:
            campos = sorted(k for k in set(a) | set(d) if a.get(k) != d.get(k))
            print('  ~ %-24s %s' % (iid, ', '.join(campos)))
            if 'value' in campos or 'referenceYear' in campos:
                print('      %s = %s  ->  %s = %s'
                      % (a.get('referenceYear'), a.get('value'),
                         d.get('referenceYear'), d.get('value')))
    print('\nIndicador que você não mexeu tem de sair idêntico. Se apareceu aqui, a '
          'reimplementação divergiu de server/src/estado/service.ts.')
    return 1


def main():
    ap = argparse.ArgumentParser(description='Snapshot estático de GET /api/estado.')
    ap.add_argument('--escrever', action='store_true', help='grava o snapshot')
    ap.add_argument('--conferir', action='store_true',
                    help='compara com o snapshot atual e agrupa as diferenças por indicador')
    args = ap.parse_args()

    gerado = montar()
    print('%d indicadores, %d pontos de série'
          % (len(gerado['indicators']), sum(len(i['series']) for i in gerado['indicators'])))

    if args.conferir:
        return conferir(gerado)
    if not args.escrever:
        print('\n(dry-run. Use --conferir para comparar ou --escrever para gravar.)')
        return 0

    pasta = os.path.dirname(OUT)
    if not os.path.isdir(pasta):
        os.makedirs(pasta)
    with open(OUT, 'w') as fh:
        # separators sem espaço: o snapshot é servido como está, e o espaço do
        # default do json.dump só engorda o download.
        json.dump(gerado, fh, ensure_ascii=False, separators=(',', ':'))
    print('\nescrito: %s (%.1f KB)' % (OUT, os.path.getsize(OUT) / 1024.0))
    return 0


if __name__ == '__main__':
    sys.exit(main())
