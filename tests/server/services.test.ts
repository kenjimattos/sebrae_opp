import { describe, expect, it } from 'vitest'
import { buildIndicatorsData, buildMapData } from '../../server/src/services.js'
import type { Threshold } from '../../server/src/types.js'
import {
  AGENDA,
  CAMPINA,
  agendaIndicator,
  makeCatalog,
  socioeconomicIndicator,
  valueDoc,
} from './fixtures.js'

// Testa pela função exportada, de propósito: pickValue, isLowConfidence e
// indexValues são privadas e o que importa é a composição delas — é ela que
// decide o que 223 municípios mostram.

const higher: Threshold = { kind: 'higher-better', success: 10, warning: 5 }

function firstIndicator(data: ReturnType<typeof buildIndicatorsData>) {
  return data.agendas[0]!.indicators[0]!
}

describe('buildIndicatorsData · escolha do ano (pickValue pela costura)', () => {
  it('usa o referenceYear do indicador, não o ano mais recente', () => {
    const catalog = makeCatalog([agendaIndicator('igm', { referenceYear: '2022', threshold: higher })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('igm', '2021', 1),
      valueDoc('igm', '2022', 7),
      valueDoc('igm', '2023', 12),
    ])
    expect(firstIndicator(data)).toMatchObject({ numericValue: 7, status: 'warning' })
  })

  it('referenceYear inexistente nos documentos → cai no mais recente', () => {
    const catalog = makeCatalog([agendaIndicator('igm', { referenceYear: '2025', threshold: higher })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('igm', '2021', 1),
      valueDoc('igm', '2023', 12),
    ])
    expect(firstIndicator(data)).toMatchObject({ numericValue: 12, status: 'success' })
  })

  it('indicador sem referenceYear → mais recente', () => {
    const catalog = makeCatalog([agendaIndicator('igm', { threshold: higher })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('igm', '2023', 12),
      valueDoc('igm', '2021', 1),
    ])
    expect(firstIndicator(data)).toMatchObject({ numericValue: 12, status: 'success' })
  })

  it('ano histórico com valor de fronteira não influencia a resposta', () => {
    // O caso da apuração de 1.3.1: as divergências do banco estavam em anos
    // que a API nunca retorna. Este teste mostra isso sem contar linhas de seed.
    const cfa: Threshold = { kind: 'higher-better', success: 5.01, warning: 4 }
    const catalog = makeCatalog([agendaIndicator('igm-cfa', { referenceYear: '2024', threshold: cfa })])
    const values = [
      valueDoc('igm-cfa', '2021', 5.008, { rawValue: '5,01' }), // fronteira, histórico
      valueDoc('igm-cfa', '2024', 5.2, { rawValue: '5,20' }),
    ]
    expect(firstIndicator(buildIndicatorsData(CAMPINA, catalog, values))).toMatchObject({
      value: '5,20',
      numericValue: 5.2,
      status: 'success',
    })
    const map = buildMapData(catalog, [CAMPINA], values)
    expect(map.municipalities[CAMPINA._id]!.indicators['igm-cfa']).toEqual({
      value: '5,20',
      numericValue: 5.2,
      status: 'success',
    })
  })

  it('escolhe o ano ANTES de suprimir: ano default fraco não resgata um ano anterior forte', () => {
    // Decisão travada: mostrar o ano anterior seria exibir dado velho como
    // atual, e o rótulo do ano não acompanharia.
    const catalog = makeCatalog([agendaIndicator('tempo-abertura', { referenceYear: '2024' })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('tempo-abertura', '2023', 3.5, { breakdown: { confiabilidade: 'alta', n: 40 } }),
      valueDoc('tempo-abertura', '2024', 0.2, { breakdown: { confiabilidade: 'baixa', n: 2 } }),
    ])
    expect(firstIndicator(data)).toMatchObject({ value: '—', numericValue: null, status: 'none' })
  })
})

describe('buildIndicatorsData · supressão por amostra (isLowConfidence pela costura)', () => {
  const lower: Threshold = { kind: 'lower-better', success: 1, warning: 3 }

  it.each([
    ['tempo-abertura', 'baixa'],
    ['tempo-viabilidade', 'sem-dados'],
  ] as const)('%s com confiabilidade %s vira "—" / null / none, sem variação', (id, confiabilidade) => {
    const catalog = makeCatalog([agendaIndicator(id, { threshold: lower })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc(id, '2024', 0.2, {
        breakdown: { confiabilidade, n: 1 },
        variation: { deltaPct: -50, previousValue: 0.4, previousYear: '2023', basis: 'ano' },
      }),
    ])
    const ind = firstIndicator(data)
    expect(ind).toMatchObject({ value: '—', numericValue: null, status: 'none' })
    expect(ind.variation).toBeUndefined()
  })

  it('escopo restrito: crescimento-mpe com confiabilidade baixa NÃO é suprimido', () => {
    // Lá é contagem real de município pequeno, não artefato de média.
    const catalog = makeCatalog([agendaIndicator('crescimento-mpe', { threshold: higher })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('crescimento-mpe', '2024', 12, { breakdown: { confiabilidade: 'baixa', n: 3 } }),
    ])
    expect(firstIndicator(data)).toMatchObject({ value: '12', numericValue: 12, status: 'success' })
  })

  it('confiabilidade alta passa normalmente', () => {
    const catalog = makeCatalog([agendaIndicator('tempo-abertura', { threshold: lower })])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('tempo-abertura', '2024', 0.5, { breakdown: { confiabilidade: 'alta', n: 80 } }),
    ])
    expect(firstIndicator(data)).toMatchObject({ value: '0,5', numericValue: 0.5, status: 'success' })
  })

  it('indicador sem documento fica na lista com "—" / null / none', () => {
    const catalog = makeCatalog([agendaIndicator('igm', { threshold: higher })])
    const data = buildIndicatorsData(CAMPINA, catalog, [])
    expect(firstIndicator(data)).toMatchObject({
      id: 'igm',
      value: '—',
      numericValue: null,
      status: 'none',
      threshold: higher,
    })
  })
})

describe('a assimetria entre o detalhe e o mapa', () => {
  it('mesmo indicador suprimido: o detalhe MANTÉM com "—", o mapa OMITE', () => {
    const catalog = makeCatalog([
      agendaIndicator('tempo-abertura'),
      agendaIndicator('igm', { threshold: higher }),
    ])
    const values = [
      valueDoc('tempo-abertura', '2024', 0.2, { breakdown: { confiabilidade: 'baixa', n: 1 } }),
      valueDoc('igm', '2024', 12),
    ]
    const detail = buildIndicatorsData(CAMPINA, catalog, values)
    expect(detail.agendas[0]!.indicators.map((i) => i.id)).toEqual(['tempo-abertura', 'igm'])
    expect(detail.agendas[0]!.indicators[0]!.value).toBe('—')

    const map = buildMapData(catalog, [CAMPINA], values)
    expect(Object.keys(map.municipalities[CAMPINA._id]!.indicators)).toEqual(['igm'])
  })

  it.each([
    ['null', null],
    ['NaN', Number.NaN],
    ['undefined', undefined],
  ])('o mapa também descarta numericValue %s (segunda supressão, mais ampla)', (_label, n) => {
    const catalog = makeCatalog([agendaIndicator('igm', { threshold: higher })])
    const values = [valueDoc('igm', '2024', n, { rawValue: '12,00' })]
    const map = buildMapData(catalog, [CAMPINA], values)
    expect(map.municipalities[CAMPINA._id]!.indicators).toEqual({})
    // …enquanto o detalhe mantém o texto e classifica como 'none'.
    expect(firstIndicator(buildIndicatorsData(CAMPINA, catalog, values))).toMatchObject({
      value: '12,00',
      status: 'none',
    })
  })

  it('o mapa só conhece indicadores de agenda: socioeconômico não entra nem nas opções', () => {
    const catalog = makeCatalog([
      agendaIndicator('igm', { threshold: higher }),
      socioeconomicIndicator('pib'),
    ])
    const map = buildMapData(catalog, [CAMPINA], [
      valueDoc('igm', '2024', 12),
      valueDoc('pib', '2024', 1_000_000),
    ])
    expect(map.options.map((o) => o.value)).toEqual(['igm'])
    expect(Object.keys(map.municipalities[CAMPINA._id]!.indicators)).toEqual(['igm'])
  })

  it('os dois endpoints classificam pelo mesmo threshold', () => {
    const catalog = makeCatalog([agendaIndicator('igm', { referenceYear: '2024', threshold: higher })])
    const values = [valueDoc('igm', '2024', 7)]
    const detail = firstIndicator(buildIndicatorsData(CAMPINA, catalog, values))
    const map = buildMapData(catalog, [CAMPINA], values).municipalities[CAMPINA._id]!.indicators['igm']!
    expect(detail.status).toBe('warning')
    expect(map.status).toBe(detail.status)
    expect(map.numericValue).toBe(detail.numericValue)
  })
})

describe('buildIndicatorsData · base econômica', () => {
  it('mostra o rawValue cru: sem status, sem supressão, sem threshold', () => {
    // Deliberado: não há faixa oficial na base econômica.
    const catalog = makeCatalog([
      socioeconomicIndicator('pib', { threshold: higher, referenceYear: '2021' }),
    ])
    const data = buildIndicatorsData(CAMPINA, catalog, [
      valueDoc('pib', '2021', 1.5, {
        rawValue: 'R$ 1,5 bi',
        breakdown: { confiabilidade: 'baixa', n: 1 },
      }),
    ])
    expect(data.economicBase).toEqual([
      { id: 'pib', label: 'pib', value: 'R$ 1,5 bi', variation: '', referenceYear: '2021' },
    ])
    expect(data.economicBase[0]).not.toHaveProperty('status')
    expect(data.agendas[0]!.indicators).toEqual([])
  })

  it('sem documento: "—", variação vazia e o ano de referência do indicador', () => {
    const catalog = makeCatalog([socioeconomicIndicator('pib', { referenceYear: '2021' })])
    const data = buildIndicatorsData(CAMPINA, catalog, [])
    expect(data.economicBase[0]).toEqual({
      id: 'pib', label: 'pib', value: '—', variation: '', referenceYear: '2021',
    })
    expect(data.municipality).toBe(CAMPINA.name)
    expect(data.agendas[0]!.name).toBe(AGENDA.name)
  })
})
