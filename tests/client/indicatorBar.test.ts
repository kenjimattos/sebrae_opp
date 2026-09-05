import { describe, expect, it } from 'vitest'
import { markerFraction } from '@/utils/indicatorBar'
import type { IndicatorThreshold } from '@/types/indicators'

// Geometria pura: os dois cortes da faixa oficial caem em 1/3 e 2/3 da barra,
// com uma zona-largura de folga em cada extremo. Erra em silêncio — o marcador
// fica no lugar errado, ninguém vê exceção, e a barra mente com aparência de
// precisão. Entrou no caminho crítico na reforma de 1.3.1, alimentada pelo
// numericValue da API.

const higher: IndicatorThreshold = { kind: 'higher-better', success: 10, warning: 5 }
const lower: IndicatorThreshold = { kind: 'lower-better', success: 5, warning: 10 }

describe('markerFraction · os cortes ancoram em 1/3 e 2/3', () => {
  it('higher-better: warning → 1/3, success → 2/3', () => {
    // toBeCloseTo, não toBe: (value - w) / (3 * d) + 1/3 não devolve 2/3 exato
    // em ponto flutuante.
    expect(markerFraction(5, higher)).toBeCloseTo(1 / 3, 10)
    expect(markerFraction(10, higher)).toBeCloseTo(2 / 3, 10)
  })

  it('lower-better: os mesmos dois pontos, com o eixo invertido', () => {
    expect(markerFraction(10, lower)).toBeCloseTo(1 / 3, 10)
    expect(markerFraction(5, lower)).toBeCloseTo(2 / 3, 10)
  })

  it('o meio da faixa cai no meio dos dois cortes, nos dois sentidos', () => {
    expect(markerFraction(7.5, higher)).toBeCloseTo(0.5, 10)
    expect(markerFraction(7.5, lower)).toBeCloseTo(0.5, 10)
  })
})

describe('markerFraction · clamp em [0,1]', () => {
  it.each([
    ['higher-better, muito acima de success', 1_000_000, higher, 1],
    ['higher-better, muito abaixo de warning', -1_000_000, higher, 0],
    ['lower-better, muito abaixo de success', -1_000_000, lower, 1],
    ['lower-better, muito acima de warning', 1_000_000, lower, 0],
  ] as const)('%s → %s', (_label, value, threshold, expected) => {
    expect(markerFraction(value, threshold)).toBe(expected)
  })

  it('a folga é de exatamente uma zona-largura em cada ponta', () => {
    // d = 5: uma zona além de success (15) chega em 1, uma aquém de warning (0)
    // chega em 0 — e é aí que o clamp começa a valer.
    expect(markerFraction(15, higher)).toBeCloseTo(1, 10)
    expect(markerFraction(0, higher)).toBeCloseTo(0, 10)
    expect(markerFraction(15.1, higher)).toBe(1)
    expect(markerFraction(-0.1, higher)).toBe(0)
  })
})

describe('markerFraction · devolve null quando não dá para calcular', () => {
  it.each([
    ['sem threshold', 7, undefined],
    ['threshold enum', 7, { kind: 'enum' } as IndicatorThreshold],
    ['success ausente', 7, { kind: 'higher-better', warning: 5 } as IndicatorThreshold],
    ['warning ausente', 7, { kind: 'higher-better', success: 10 } as IndicatorThreshold],
    ['success === warning (divisão por zero)', 7, { kind: 'higher-better', success: 5, warning: 5 } as IndicatorThreshold],
    ['valor null', null, higher],
    ['valor undefined', undefined, higher],
    ['valor NaN', Number.NaN, higher],
    ['valor Infinity', Number.POSITIVE_INFINITY, higher],
  ] as const)('%s', (_label, value, threshold) => {
    expect(markerFraction(value, threshold)).toBeNull()
  })

  it('zero é valor válido, não ausência', () => {
    expect(markerFraction(0, higher)).toBeCloseTo(0, 10)
    expect(markerFraction(0, lower)).toBe(1)
  })
})

describe('markerFraction · monotonicidade', () => {
  // Pega inversão de sinal melhor que três casos pontuais.
  const amostra = [-20, -1, 0, 2.5, 5, 7.5, 10, 12, 15, 40]

  it('higher-better: valor maior nunca produz fração menor', () => {
    const fracoes = amostra.map((v) => markerFraction(v, higher)!)
    expect(fracoes).toEqual([...fracoes].sort((a, b) => a - b))
  })

  it('lower-better: valor maior nunca produz fração maior', () => {
    const fracoes = amostra.map((v) => markerFraction(v, lower)!)
    expect(fracoes).toEqual([...fracoes].sort((a, b) => b - a))
  })
})

describe('markerFraction · threshold incoerente', () => {
  // A régua vive no banco e o seed garante a coerência; aqui só se trava o que
  // o código faz hoje, para que uma mudança seja deliberada. `d` é |s - w|, um
  // valor absoluto, então a fórmula não percebe a inversão: com os cortes
  // trocados, um valor NO corte de success cai na extremidade ruim da barra.
  const invertido: IndicatorThreshold = { kind: 'higher-better', success: 5, warning: 10 }

  it('higher-better com success < warning: o valor em success vai para 0, não para 2/3', () => {
    expect(markerFraction(5, invertido)).toBe(0)
    expect(markerFraction(10, invertido)).toBeCloseTo(1 / 3, 10)
  })
})
