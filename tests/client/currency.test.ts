import { describe, expect, it } from 'vitest'
import { budgetTotal, formatBRL, parseBRL } from '@/utils/currency'

// O campo de orçamento é livre: o gestor digita o que quiser e o resultado vai
// direto para a soma do projeto e para o PDF. Um valor lido errado aqui é um
// número errado num documento de política pública.

describe('parseBRL', () => {
  it.each([
    // Com vírgula, o padrão BR não é ambíguo: vírgula decimal, ponto de milhar.
    ['1.000,50', 1000.5],
    ['R$ 1.000,50', 1000.5],
    ['1000,50', 1000.5],
    ['1.234.567,89', 1234567.89],
    ['1,5', 1.5],
    // Sem vírgula: um ponto com uma ou duas casas é decimal digitado no teclado
    // errado. Antes da correção estes três davam 100050, 15 e 5.
    ['1000.50', 1000.5],
    ['1.5', 1.5],
    ['0.5', 0.5],
    // Três casas depois do ponto é milhar de verdade — a forma que pt-BR usa.
    ['1.500', 1500],
    ['1.000.000', 1000000],
    // Sem separador nenhum.
    ['1500', 1500],
    ['0', 0],
  ])('%s → %s', (entrada, esperado) => {
    expect(parseBRL(entrada)).toBe(esperado)
  })

  it.each([
    ['vazio', ''],
    ['só texto', 'a combinar'],
    ['só símbolo', 'R$'],
    ['só espaço', '   '],
  ])('%s vira 0, nunca NaN', (_label, entrada) => {
    expect(parseBRL(entrada)).toBe(0)
  })

  it('aceita negativo', () => {
    expect(parseBRL('-1.5')).toBe(-1.5)
    expect(parseBRL('-1.500')).toBe(-1500)
  })
})

describe('budgetTotal', () => {
  it('soma as rubricas', () => {
    expect(budgetTotal([
      { label: 'Consultoria', value: '10.000,00' },
      { label: 'Material', value: '2500.75' },
    ])).toBeCloseTo(12500.75, 2)
  })

  it('lista vazia dá 0', () => {
    expect(budgetTotal([])).toBe(0)
  })

  it('rubrica sem valor não contamina o total com NaN', () => {
    expect(budgetTotal([
      { label: 'Consultoria', value: '1.000,00' },
      { label: 'A definir', value: '' },
      { label: 'Outro', value: 'a combinar' },
    ])).toBe(1000)
  })
})

describe('formatBRL', () => {
  // O Intl separa o R$ do número com espaço não separável (U+00A0). Normalizar
  // aqui em vez de colar o caractere no arquivo: invisível em literal de teste
  // é falha difícil de ler, e o lint do projeto proíbe.
  const semNbsp = (v: number) => formatBRL(v).replace(/\u00a0/g, ' ')

  it('sempre duas casas', () => {
    expect(semNbsp(1000.5)).toBe('R$ 1.000,50')
    expect(semNbsp(0)).toBe('R$ 0,00')
  })

  it('ida e volta preserva o valor digitado', () => {
    for (const v of ['1.000,50', '1000.50', '1,5', '1.500']) {
      expect(parseBRL(formatBRL(parseBRL(v)))).toBe(parseBRL(v))
    }
  })
})
