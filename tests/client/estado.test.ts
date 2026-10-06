import { describe, expect, it } from 'vitest'
import { CARD_VIEWS, TEMAS, TEMA_PADRAO } from '@/data/home/estado'
import {
  formatNumberBR,
  ordinalF,
  readDistribution,
  readPosition,
} from '@/utils/estado'

describe('readPosition', () => {
  it('lê a posição entre UFs e no Nordeste', () => {
    const p = readPosition({
      posicao: {
        entreUfs: 19,
        totalUfs: 27,
        entreNordeste: 4,
        totalNordeste: 9,
        normalizado: true,
        valorNormalizado: 219.71,
        unidadeNormalizada: '/1k hab.',
      },
    })
    expect(p).toEqual({
      entreUfs: 19,
      totalUfs: 27,
      entreNordeste: 4,
      totalNordeste: 9,
      normalizado: true,
      valorNormalizado: 219.71,
      unidadeNormalizada: '/1k hab.',
    })
  })

  it('devolve null sem breakdown, sem posicao ou sem o par UF', () => {
    expect(readPosition(undefined)).toBeNull()
    expect(readPosition({ nota: 'x' })).toBeNull()
    expect(readPosition({ posicao: { entreNordeste: 4 } })).toBeNull()
  })

  it('não inventa normalização quando a posição é bruta', () => {
    const p = readPosition({
      posicao: { entreUfs: 25, totalUfs: 27, entreNordeste: 7, totalNordeste: 9, normalizado: false },
    })
    // valorNormalizado null é "sem base per capita" — a linha per capita não entra.
    expect(p?.normalizado).toBe(false)
    expect(p?.valorNormalizado).toBeNull()
  })
})

describe('readDistribution', () => {
  it('ordena do maior para o menor', () => {
    const slices = readDistribution(
      { porFaixa: { 'Microempresa (ME)': 144737, 'Empresa de Pequeno Porte (EPP)': 155449 } },
      'porFaixa',
    )
    expect(slices.map((s) => s.label)).toEqual([
      'Empresa de Pequeno Porte (EPP)',
      'Microempresa (ME)',
    ])
  })

  it('descarta chave sem valor numérico em vez de assumir zero', () => {
    const slices = readDistribution({ porSetor: { A: 10, B: 'n/d', C: null } }, 'porSetor')
    expect(slices).toEqual([{ label: 'A', value: 10 }])
  })

  it('devolve lista vazia quando a chave não existe', () => {
    expect(readDistribution({ posicao: {} }, 'porSetor')).toEqual([])
    expect(readDistribution(undefined, 'porSetor')).toEqual([])
  })
})

describe('formatação', () => {
  it('usa separador de milhar pt-BR', () => {
    expect(formatNumberBR(914955)).toBe('914.955')
    expect(formatNumberBR(219.71)).toBe('219,7')
  })

  it('usa ordinal feminino — a UF, a posição', () => {
    expect(ordinalF(19)).toBe('19ª')
  })
})

describe('tabela de apresentação', () => {
  it('não repete indicador', () => {
    const ids = CARD_VIEWS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('só referencia tema declarado no toggle', () => {
    const declarados = new Set(TEMAS.map((t) => t.value))
    for (const view of CARD_VIEWS) {
      for (const tema of view.temas) {
        expect(declarados).toContain(tema)
      }
    }
  })

  it('nenhum card entra no tema padrão — ele acende todos, não é um assunto', () => {
    expect(CARD_VIEWS.every((v) => !v.temas.includes(TEMA_PADRAO))).toBe(true)
  })

  it('barra com escala fixa declara a escala na legenda', () => {
    for (const view of CARD_VIEWS) {
      if (view.chart.kind === 'bars' && view.chart.max !== undefined) {
        expect(view.chart.caption).toBeTruthy()
      }
    }
  })
})
