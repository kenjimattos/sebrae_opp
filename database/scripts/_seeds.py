# -*- coding: utf-8 -*-
"""Leitura e reescrita dos seeds `.mongodb.js` sem passar pelo Mongo.

Os seeds são JS gerado, mas cada documento ocupa **uma linha** e é JSON puro —
saída de `json.dumps(obj, ensure_ascii=False)`. Isso os torna legíveis por
máquina sem interpretar JavaScript, e é o que permite a este repositório
calcular os tercis e regerar o snapshot **sem acesso ao banco do Sebrae**, que
não é alcançável da Vercel nem de fora da VPN.

A alternativa seria ler os 223 JSONs de `public/api-snapshot/`, e ela não serve:
o snapshot não carrega `breakdown`, e é justamente no breakdown que vivem os
denominadores (`populacao`, `vinculosTotal`) e as flags que separam um zero
medido de uma ausência (`semEmissaoAlvara`). Seed é a fonte; snapshot é derivado.
"""

from __future__ import annotations

import json
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SEED_DIR = os.path.join(REPO_ROOT, 'database', 'seed')

# Os 223 da Paraíba. Serve de guarda contra parse que devolve lista vazia.
TOTAL_MUNICIPIOS = 223

# Uma linha de documento: indentação, o objeto JSON, vírgula opcional.
_LINHA_DOC = re.compile(r'^(\s*)(\{.*\})(,?)\s*$')


def caminho_seed(nome):
    return os.path.join(SEED_DIR, 'indicador-%s.mongodb.js' % nome)


def ler_docs(caminho, filtro=None):
    """Todos os documentos JSON de um seed, na ordem, com o nº da linha.

    `filtro` recebe o dict e diz se ele interessa — é assim que se separa o
    bloco de catálogo (`_id`) do bloco de valores (`municipalityId`) sem
    depender da posição no arquivo.
    """
    docs = []
    with open(caminho, 'r') as fh:
        for i, linha in enumerate(fh):
            m = _LINHA_DOC.match(linha)
            if not m:
                continue
            try:
                doc = json.loads(m.group(2))
            except ValueError:
                continue
            if not isinstance(doc, dict):
                continue
            if filtro and not filtro(doc):
                continue
            docs.append((i, doc))
    return docs


def eh_catalogo(doc):
    """Documento de catálogo: indicador, agenda ou município.

    O teste é `_id`, e não a presença de `label`: só o indicador tem `label` —
    agenda e município têm `name`. Filtrar por `label` devolvia lista vazia para
    os dois, o que não dá erro nenhum, só um resultado vazio que passa despercebido.
    """
    return '_id' in doc


def eh_valor(doc):
    return 'municipalityId' in doc and 'indicatorId' in doc


def ano_do_catalogo(nome_seed, indicator_id):
    """O `referenceYear` default do indicador, como o servidor o lê."""
    for _, doc in ler_docs(caminho_seed(nome_seed), eh_catalogo):
        if doc['_id'] == indicator_id:
            return doc.get('referenceYear')
    return None


def valores_por_municipio(nome_seed, indicator_id=None, reference_year=None):
    """municipality_id -> doc de valor, de um indicador e de um ano.

    Um seed pode carregar mais de um indicador (o do ISDEL traz duas dimensões)
    e mais de um ano — o ISDEL tem a série 2015–2023, nove docs por município.
    Quando há série, o ano vem do `referenceYear` do catálogo, que é a mesma
    regra do `pickValue` do servidor.

    Sem isso, pegar "o último doc lido" devolveria um ano arbitrário e a conta
    sairia plausível e errada: o ISDEL de 2023 é ~100% zerado, e foi justamente
    por isso que o indicador exibe 2021. Um tercil calculado sobre o ano errado
    não tem como ser notado olhando o resultado.
    """
    docs = ler_docs(caminho_seed(nome_seed), eh_valor)
    if indicator_id:
        docs = [(i, d) for i, d in docs if d.get('indicatorId') == indicator_id]

    anos = set(d.get('referenceYear') for _, d in docs)
    if len(anos) > 1:
        ano = reference_year or ano_do_catalogo(nome_seed, indicator_id)
        if ano not in anos:
            raise RuntimeError(
                'seed %s tem os anos %s e o catálogo pede %r — resolva o ano '
                'explicitamente antes de calcular qualquer coisa sobre esta série'
                % (nome_seed, sorted(a for a in anos if a), ano)
            )
        docs = [(i, d) for i, d in docs if d.get('referenceYear') == ano]

    return dict((d['municipalityId'], d) for _, d in docs)


def escrever_docs(caminho, alteracoes):
    """Reescreve linhas de documento, preservando tudo o mais byte a byte.

    `alteracoes` mapeia nº da linha -> dict novo. Reescrever o arquivo inteiro a
    partir dos objetos perderia os comentários que os geradores escrevem — e são
    eles que documentam cada seed. Aqui só as linhas tocadas mudam, então o diff
    mostra exatamente o que mudou e nada além.
    """
    with open(caminho, 'r') as fh:
        linhas = fh.readlines()

    for i, doc in alteracoes.items():
        m = _LINHA_DOC.match(linhas[i])
        if not m:
            raise RuntimeError('linha %d de %s não é documento' % (i + 1, caminho))
        indentacao, _, virgula = m.groups()
        linhas[i] = '%s%s%s\n' % (indentacao, json.dumps(doc, ensure_ascii=False), virgula)

    with open(caminho, 'w') as fh:
        fh.writelines(linhas)


def populacoes():
    """municipality_id -> população (IBGE 2023, via breakdown do pib-per-capita).

    É o denominador de tudo que classifica per capita. Vem de `pib-per-capita`
    porque é o único seed com população nos 223 — o `idsc` também a traz, mas o
    PIB é quem a usa como insumo do próprio cálculo, então é a cópia autoritativa.
    """
    fora = {}
    for mid, doc in valores_por_municipio('pib-per-capita').items():
        pop = (doc.get('breakdown') or {}).get('populacao')
        if pop:
            fora[mid] = pop
    return fora


def empresas_ativas():
    """municipality_id -> estoque de empresas ativas. Denominador da taxa de extinção."""
    fora = {}
    for mid, doc in valores_por_municipio('empresas-ativas').items():
        n = doc.get('numericValue')
        if n:
            fora[mid] = n
    return fora
