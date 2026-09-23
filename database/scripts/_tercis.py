# -*- coding: utf-8 -*-
"""Régua relativa por tercis — a fonte única dos cortes derivados.

Até jul/2026 o semáforo só existia onde a fonte publicava faixa oficial: 6
indicadores de agenda em 22. Os outros 16 chegavam sem classificação nenhuma.
Aqui se calcula a régua que falta, comparando o município com os 223 da Paraíba.

POR QUE TERCIL, E NÃO MÉDIA
    Semáforo tem três cores, e uma média (ou mediana) dá um corte só — duas
    faixas. Tercil dá os dois cortes que o contrato `{success, warning}` já
    espera, sem inventar shape novo.

    E a média, especificamente, não serve: medida nos 223, a razão
    média/mediana chega a 41x (`trabalhadores-ct`: média 123, mediana 3, porque
    João Pessoa tem 19.760). A média de uma distribuição assim é o retrato da
    capital, não do estado.

POR QUE NORMALIZAR
    Contagem bruta não compara municípios — mede o tamanho deles. Normalizada
    por 1.000 habitantes, a razão média/mediana de `trabalhadores-medio-completo`
    cai de 8,15 para 1,24, e a de `empresas-ativas` de 4,67 para 1,10. O valor
    EXIBIDO segue bruto; só a classificação usa o normalizado.

O QUE ESTE MÓDULO SE RECUSA A FAZER
    O portão (`avaliar`) recusa a faixa quando ela seria mentira, e **imprime o
    motivo**. Foi um threshold fantasma silencioso — o do `trabalhadores-ct`,
    removido de um seed que ainda usava `$set` — que deixou 219 dos 223
    municípios em `alert` por sete semanas sem ninguém notar. Recusa registrada
    em log é a diferença entre uma decisão e um acidente.

Consumido por `aplicar_tercis.py` (que escreve nos seeds) e por
`gerar_api_snapshot_municipios.py`. Os dois têm de emitir o MESMO objeto
`threshold`, senão a `main` e a `preview/snapshot` divergem em silêncio.
"""

from __future__ import annotations

TOTAL_MUNICIPIOS = 223

# Abaixo disto a faixa deixa de ser "comparação entre os 223 municípios da PB" e
# vira comparação entre um subconjunto que ninguém declarou. `credito-financiamento`
# (47 municípios com agência bancária, 21%) é o caso que o corte exclui.
COBERTURA_MINIMA = 0.50


class Normalizacao(object):
    """Como transformar o valor exibido no número que classifica.

    `denominador` recebe (municipality_id, breakdown) e devolve o divisor, ou
    None quando não há base de comparação para aquele município.
    """

    def __init__(self, unit=None, label=None, denominator=None, fator=1.0, divisor=None):
        self.unit = unit
        self.label = label
        self.denominator = denominator
        self.fator = fator
        self.divisor = divisor

    @property
    def identidade(self):
        return self.divisor is None

    def basis(self):
        """O objeto `threshold.basis`, ou None quando a unidade não muda."""
        if self.identidade:
            return None
        return {'unit': self.unit, 'label': self.label, 'denominator': self.denominator}

    def aplicar(self, valor, municipio_id, contexto):
        if self.identidade:
            return valor
        div = self.divisor(municipio_id, contexto)
        if not div:
            return None
        # Mesma casa decimal dos cortes (`_arredondar`): gravar
        # 9.216007477723014 nos 223 municípios × 11 indicadores incha o seed e o
        # snapshot com dígitos que nenhuma fonte tem, e torna o diff ilegível.
        # Valor e régua arredondados juntos mantêm a classificação reprodutível.
        return _arredondar(valor * self.fator / div)


IDENTIDADE = Normalizacao()


def por_1k_habitantes(populacoes):
    """Vínculos/empresas por 1.000 habitantes.

    População vem de `breakdown.populacao` do `pib-per-capita` (2023, 223/223).
    Não é indicador próprio e `breakdown` nem é exposto pela API — por isso a
    normalização mora no ETL, não no servidor.
    """
    return Normalizacao(
        unit='/1k hab.',
        label='por 1.000 habitantes',
        denominator='populacao@pib-per-capita:2023',
        fator=1000.0,
        divisor=lambda mid, _ctx: populacoes.get(mid),
    )


def por_empresas_ativas(ativas):
    """Taxa de extinção: extintos como % das empresas ativas.

    Aqui per capita seria pior que errado — seria injusto ao contrário. O
    município que quase não tem empresa também quase não tem extinção, e ganharia
    verde por não ter o que fechar. Dividido pelo estoque, a distribuição fica a
    mais bem-comportada do conjunto (razão média/mediana 1,01).
    """
    return Normalizacao(
        unit='% das ativas',
        label='% das empresas ativas',
        denominator='empresas-ativas',
        fator=100.0,
        divisor=lambda mid, _ctx: ativas.get(mid),
    )


class Derivado(object):
    """Um indicador que recebe régua relativa.

    `sem_base` responde, pelo breakdown do próprio indicador, se aquele município
    tem base de comparação. É o que separa um zero MEDIDO de um zero que é
    ausência — os dois chegam como `numericValue: 0` e são indistinguíveis sem
    olhar o breakdown. Errar aqui pinta de vermelho quem não foi medido.
    """

    def __init__(self, kind, normalizacao=IDENTIDADE, sem_base=None, piso_zero=False, nota=''):
        self.kind = kind
        self.normalizacao = normalizacao
        self.sem_base = sem_base
        # Zero é o pior caso possível, medido, e os tercis se calculam só sobre os
        # positivos. Sem isto, uma distribuição com muitos zeros empata o terço
        # inferior no próprio zero, e o corte de `warning` vira 0 — como `n >= 0`
        # é sempre verdade, NINGUÉM fica em alerta. `trabalhadores-tic` produzia
        # 148 amarelos e zero vermelhos: o semáforo existia e não alertava nada.
        self.piso_zero = piso_zero
        self.nota = nota


def catalogo_derivados(populacoes, empresas_ativas):
    """Quais indicadores recebem régua relativa, e como cada um classifica.

    Tabela explícita, revisada a olho, e não inferência: errar o `kind` inverte o
    mapa inteiro sem quebrar nada. Atenção a `ranking-redesim` — o `numericValue`
    é a PONTUAÇÃO 0–600, não a posição, então é `higher-better`.

    Quem NÃO está aqui e por quê (medido nos 223, ver o CHANGELOG):
      bndes-operacoes ........... 213 dos 223 em zero; p33 == p67 == 0
      compras-publicas-inovacao . proxy que admite não captar CPSI nem encomenda
                                  tecnológica — o zero pode ser cegueira do proxy,
                                  e marcaria 85 prefeituras de vermelho por um
                                  critério inventado duas vezes
      credito-financiamento ..... só 47 dos 223 têm agência bancária
      isdel-educacao-emp ........ mediana 0,01; o tercil separaria 0,003 de 0,009,
                                  que é ruído. E é subdimensão sem faixa própria
      bolsa-familia ............. direção ambígua: a queda de 2,7% na PB é o
                                  pente-fino do Novo BF, não inserção no mercado
                                  de trabalho. Classificar é afirmação política
    """
    por_1k = por_1k_habitantes(populacoes)
    return {
        # --- classificam sobre o próprio valor (escala já comparável) ---
        'ranking-redesim': Derivado('higher-better'),
        'crescimento-mpe': Derivado('higher-better'),
        'mpe-compras-publicas': Derivado(
            'higher-better',
            nota='73 municípios sem contrato público a PJ entram sem base (numericValue null)',
        ),
        # Os 109 zeros são TODOS `semEmissaoAlvara: true` — não houve processo de
        # alvará na janela de 6 meses. Zero aqui é ausência de medida, não pior
        # desempenho: tratá-lo como piso pintaria metade do estado de vermelho
        # por algo que não foi medido nele.
        'tempo-licenciamento': Derivado(
            'higher-better',
            sem_base=lambda bd: bd.get('semEmissaoAlvara') is True,
            nota='zeros = sem emissão de alvará na janela',
        ),
        # Caso oposto: todo zero tem `vinculosTotal > 0`, ou seja, o município tem
        # emprego formal e nada dele em TIC/criativa/P&D. O zero é medido, e o
        # piso em `alert` é honesto — são 92 municípios.
        'trabalhadores-tic': Derivado(
            'higher-better',
            sem_base=lambda bd: not bd.get('vinculosTotal'),
            piso_zero=True,
            nota='zeros são medidos (há vínculos, nenhum em TIC) e viram o piso',
        ),
        # --- contagem bruta: exibe o bruto, classifica per capita ---
        'trabalhadores-ct': Derivado('higher-better', por_1k),
        'trabalhadores-medio-completo': Derivado('higher-better', por_1k),
        'trabalhadores-superior-completo': Derivado('higher-better', por_1k),
        'empresas-ativas': Derivado('higher-better', por_1k),
        'negocios-abertos': Derivado('higher-better', por_1k),
        'negocios-extintos': Derivado(
            'lower-better',
            por_empresas_ativas(empresas_ativas),
            nota='taxa de extinção; per capita premiaria quem não tem empresa para fechar',
        ),
    }


def tercis(valores):
    """(p33, p67) por interpolação linear, como numpy/pandas fazem por padrão."""
    ordenados = sorted(valores)
    return _percentil(ordenados, 1.0 / 3.0), _percentil(ordenados, 2.0 / 3.0)


def _percentil(ordenados, p):
    if not ordenados:
        return None
    k = (len(ordenados) - 1) * p
    baixo = int(k)
    if baixo + 1 >= len(ordenados):
        return ordenados[baixo]
    return ordenados[baixo] + (k - baixo) * (ordenados[baixo + 1] - ordenados[baixo])


class Recusa(Exception):
    pass


def avaliar(indicador_id, derivado, normalizados):
    """Calcula a faixa, ou levanta `Recusa` com o motivo por extenso.

    `normalizados` mapeia municipality_id -> float | None (None = sem base).
    """
    com_base = [v for v in normalizados.values() if v is not None]
    cobertura = len(com_base) / float(TOTAL_MUNICIPIOS)

    if not com_base:
        raise Recusa('nenhum município com base de comparação')

    if cobertura < COBERTURA_MINIMA:
        raise Recusa(
            'cobertura de %d/%d (%.0f%%) — abaixo de %.0f%%, não é comparação entre os 223'
            % (len(com_base), TOTAL_MUNICIPIOS, cobertura * 100, COBERTURA_MINIMA * 100)
        )

    # Com o zero declarado como piso, ele fica FORA da conta dos tercis e cai em
    # alerta por ser menor que qualquer corte positivo. Incluí-lo empataria o
    # terço inferior no próprio zero e anularia a faixa de alerta.
    base_calculo = [v for v in com_base if v > 0] if derivado.piso_zero else com_base
    if not base_calculo:
        raise Recusa('todos os valores são zero')

    p33, p67 = tercis(base_calculo)

    # Cortes empatados não separam nada: todo mundo cai do mesmo lado. É o caso
    # do `bndes-operacoes`, com 213 dos 223 em zero — a faixa pintaria os 223
    # municípios de verde e pareceria funcionar.
    if p33 == p67:
        raise Recusa(
            'p33 == p67 == %s — a régua não separa ninguém (%d dos %d valores são iguais ao corte)'
            % (_fmt(p33), sum(1 for v in base_calculo if v == p33), len(base_calculo))
        )

    # Um corte em zero num higher-better é indistinguível de "sem corte": `n >= 0`
    # é sempre verdade. Se isto disparar, o indicador tem zeros demais e a
    # pergunta — piso ou ausência? — não foi respondida.
    if derivado.kind == 'higher-better' and p33 <= 0:
        raise Recusa(
            'p33 == %s: o corte de alerta não separaria ninguém. Declare `piso_zero` '
            '(zero é o pior caso medido) ou `sem_base` (zero é ausência de medida)' % _fmt(p33)
        )

    if derivado.kind == 'higher-better':
        success, warning = p67, p33
    else:
        success, warning = p33, p67

    threshold = {
        'kind': derivado.kind,
        'success': _arredondar(success),
        'warning': _arredondar(warning),
        'provenance': 'relativo-pb',
    }
    basis = derivado.normalizacao.basis()
    if basis:
        threshold['basis'] = basis
    return threshold


def distribuicao(derivado, threshold, normalizados):
    """Quantos municípios em cada cor — o número que se confere a olho."""
    contagem = {'alert': 0, 'warning': 0, 'success': 0, 'none': 0}
    for v in normalizados.values():
        if v is None:
            contagem['none'] += 1
        elif derivado.kind == 'higher-better':
            if v >= threshold['success']:
                contagem['success'] += 1
            elif v >= threshold['warning']:
                contagem['warning'] += 1
            else:
                contagem['alert'] += 1
        else:
            if v <= threshold['success']:
                contagem['success'] += 1
            elif v <= threshold['warning']:
                contagem['warning'] += 1
            else:
                contagem['alert'] += 1
    return contagem


def _arredondar(v):
    """Casas suficientes para o corte discriminar, sem ruído de float.

    Os cortes oficiais discriminam na casa que o arredondamento de exibição come
    (IGM 5,008 exibe "5,01" e o corte é 5,01) — ver o comentário de
    `server/src/indicadores/status.ts`. Aqui a régua é nossa, mas a aritmética é
    a mesma: guardar 0.5800000000000001 no seed seria ruído sem informação.
    """
    arred = round(v, 3)
    return int(arred) if arred == int(arred) else arred


def _fmt(v):
    return ('%g' % v) if v is not None else '—'
