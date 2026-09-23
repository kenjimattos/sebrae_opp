import { describe, expect, it } from 'vitest'
import { computeStatus } from '../../server/src/indicadores/status.js'
import type { Threshold } from '../../server/src/types/index.js'

const higher: Threshold = { kind: 'higher-better', success: 10, warning: 5 }
const lower: Threshold = { kind: 'lower-better', success: 5, warning: 10 }

function doc(numericValue: number | null | undefined, rawValue = '') {
  return { rawValue, numericValue }
}

describe('computeStatus', () => {
  it("devolve 'none' sem threshold ou sem documento", () => {
    expect(computeStatus(undefined, doc(7))).toBe('none')
    expect(computeStatus(higher, undefined)).toBe('none')
  })

  it('higher-better: as comparações são >=', () => {
    expect(computeStatus(higher, doc(10))).toBe('success')
    expect(computeStatus(higher, doc(10.001))).toBe('success')
    expect(computeStatus(higher, doc(7))).toBe('warning')
    expect(computeStatus(higher, doc(5))).toBe('warning')
    expect(computeStatus(higher, doc(4.999))).toBe('alert')
  })

  it('lower-better: as comparações são <=', () => {
    expect(computeStatus(lower, doc(5))).toBe('success')
    expect(computeStatus(lower, doc(4.999))).toBe('success')
    expect(computeStatus(lower, doc(7))).toBe('warning')
    expect(computeStatus(lower, doc(10))).toBe('warning')
    expect(computeStatus(lower, doc(10.001))).toBe('alert')
  })

  // O caso que motivou a reforma de 1.3.1: o corte oficial discrimina na casa
  // que o arredondamento da exibição come. Classificar pelo texto erra para o
  // lado otimista; a régua tem de ler o número na precisão da fonte.
  describe('classifica pelo numericValue, nunca pelo rawValue arredondado', () => {
    it('IGM 5,008 exibido "5,01" fica abaixo do corte 5,01', () => {
      const cfa: Threshold = { kind: 'higher-better', success: 5.01, warning: 4 }
      expect(computeStatus(cfa, doc(5.008, '5,01'))).toBe('warning')
      expect(computeStatus(cfa, doc(5.01, '5,01'))).toBe('success')
    })

    it('ISDEL 0,470942 exibido "0,471" fica abaixo do corte 0,471', () => {
      const isdel: Threshold = { kind: 'higher-better', success: 0.471, warning: 0.3 }
      expect(computeStatus(isdel, doc(0.470942, '0,471'))).toBe('warning')
      expect(computeStatus(isdel, doc(0.471, '0,471'))).toBe('success')
    })
  })

  // Última linha de defesa do `numericValue`: o schema do Mongo só avisa
  // (validationAction: 'warn'); quem impede a degradação silenciosa é isto.
  describe("sem número é 'none', sem reconstruir a partir do rawValue", () => {
    it.each([
      ['ausente', undefined],
      ['null', null],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
    ])('%s', (_label, n) => {
      expect(computeStatus(higher, doc(n, '12,00'))).toBe('none')
    })

    it('string numérica (dado sujo que o validador só avisaria) não é coagida', () => {
      const dirty = { rawValue: '12,00', numericValue: '12.00' as unknown as number }
      expect(computeStatus(higher, dirty)).toBe('none')
    })
  })

  describe('enum: o único caminho que lê texto', () => {
    const enumT: Threshold = {
      kind: 'enum',
      map: { Alta: 'success', Média: 'warning', Baixa: 'alert' },
    }

    it('mapeia o rótulo, com trim', () => {
      expect(computeStatus(enumT, doc(null, 'Alta'))).toBe('success')
      expect(computeStatus(enumT, doc(null, '  Média '))).toBe('warning')
    })

    it("rótulo fora do mapa ou rawValue vazio → 'none'", () => {
      expect(computeStatus(enumT, doc(null, 'Altíssima'))).toBe('none')
      expect(computeStatus(enumT, doc(null, ''))).toBe('none')
    })

    it('ignora o numericValue', () => {
      expect(computeStatus(enumT, doc(999, 'Baixa'))).toBe('alert')
    })
  })

  // Régua relativa (tercis entre os 223 municípios da PB). Metade desses
  // indicadores exibe contagem bruta e classifica per capita, então ler o
  // número errado não quebra nada — só mede o tamanho do município.
  describe("provenance 'relativo-pb' classifica pelo normalizedValue", () => {
    const rel: Threshold = {
      kind: 'higher-better',
      success: 44.5,
      warning: 29.8,
      provenance: 'relativo-pb',
      basis: {
        unit: '/1k hab.',
        label: 'vínculos por 1.000 habitantes',
        denominator: 'populacao@pib-per-capita:2023',
      },
    }

    it('lê o normalizado e IGNORA a contagem bruta', () => {
      // 70.626 vínculos em João Pessoa = 88,7/1k hab. A contagem bruta passaria
      // qualquer corte per capita; o normalizado é que decide.
      expect(
        computeStatus(rel, { rawValue: '70.626', numericValue: 70626, normalizedValue: 88.7 }),
      ).toBe('success')
      // 225 vínculos num município pequeno = 24,2/1k hab → terço de baixo.
      expect(
        computeStatus(rel, { rawValue: '225', numericValue: 225, normalizedValue: 24.2 }),
      ).toBe('alert')
    })

    // O caso que motivou `classifiedNumber`: sem o normalizado, cair no bruto
    // classificaria uma contagem contra uma régua per capita — erro que tem
    // exatamente a mesma cara de funcionar.
    it.each([
      ['ausente', undefined],
      ['null (sem base de comparação)', null],
      ['NaN', Number.NaN],
    ])("normalizedValue %s → 'none', nunca o bruto", (_label, n) => {
      expect(
        computeStatus(rel, { rawValue: '70.626', numericValue: 70626, normalizedValue: n }),
      ).toBe('none')
    })

    // É assim que os 109 municípios sem emissão de alvará e os 73 sem contrato
    // público a PJ saem do semáforo continuando a exibir o valor.
    it('normalizedValue null não é zero: sai do semáforo, não vira alerta', () => {
      expect(
        computeStatus(rel, { rawValue: '0', numericValue: 0, normalizedValue: null }),
      ).toBe('none')
      expect(
        computeStatus(rel, { rawValue: '0', numericValue: 0, normalizedValue: 0 }),
      ).toBe('alert')
    })

    it('faixa oficial segue lendo o numericValue mesmo havendo normalizado', () => {
      expect(computeStatus(higher, { rawValue: '', numericValue: 12, normalizedValue: 1 })).toBe(
        'success',
      )
    })
  })

  it('threshold incoerente (lower-better com warning < success) é consequência das comparações, não regra', () => {
    // A régua vive no banco e o seed garante coerência; aqui só se trava o que
    // o código faz hoje para que uma mudança seja deliberada.
    const bad: Threshold = { kind: 'lower-better', success: 10, warning: 5 }
    expect(computeStatus(bad, doc(7))).toBe('success')
  })
})
