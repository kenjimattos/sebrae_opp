import { describe, expect, it } from 'vitest'
import { EMPTY_FORMULATOR_STATE, type FormulatorState } from '@/types/formulator'
import { hasAnyContent } from '@/utils/formulatorCompleteness'
import { filledBudgetCount, filledCount } from '@/utils/formulatorOverwrite'

// Estas três funções decidem QUANDO a confirmação aparece. Errar para menos
// esconde o aviso e o gestor perde texto; errar para mais pergunta num
// formulário em branco e vira ruído que se aprende a ignorar.

describe('hasAnyContent', () => {
  it('formulário em branco não pede confirmação', () => {
    expect(hasAnyContent(EMPTY_FORMULATOR_STATE)).toBe(false)
  })

  it('só espaços em branco não conta como preenchido', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      identification: { ...EMPTY_FORMULATOR_STATE.identification, title: '   \n  ' },
    }
    expect(hasAnyContent(state)).toBe(false)
  })

  it('visitedSteps não conta: passar pelas etapas não é preencher', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      visitedSteps: ['identificacao', 'justificativa', 'objetivos'],
    }
    expect(hasAnyContent(state)).toBe(false)
  })

  const casos: [string, Partial<FormulatorState>][] = [
    ['um campo de texto raso', { identification: { ...EMPTY_FORMULATOR_STATE.identification, title: 'Projeto X' } }],
    ['um item de lista', { objectives: { general: '', specific: ['', 'Ampliar o crédito'] } }],
    ['uma rubrica só com nome', { budget: { items: [{ label: 'Consultoria', value: '' }] } }],
    ['uma rubrica só com valor', { budget: { items: [{ label: '', value: '1.000,00' }] } }],
    ['a última etapa', { governance: { management: 'Comitê gestor', monitoring: '', accountability: '' } }],
  ]

  it.each(casos)('%s já pede confirmação', (_label, patch) => {
    expect(hasAnyContent({ ...EMPTY_FORMULATOR_STATE, ...patch })).toBe(true)
  })
})

describe('filledCount', () => {
  it('conta só os itens com texto de verdade', () => {
    expect(filledCount(['', '  ', 'Indicador A', 'Indicador B'])).toBe(2)
  })

  it('lista vazia e lista só de vazios dão zero', () => {
    expect(filledCount([])).toBe(0)
    expect(filledCount(['', '', ''])).toBe(0)
  })
})

describe('filledBudgetCount', () => {
  it('rubrica conta se tiver nome OU valor — zerar o valor também é perda', () => {
    expect(filledBudgetCount([
      { label: '', value: '' },
      { label: 'Consultoria', value: '' },
      { label: '', value: '2.500,00' },
      { label: 'Material', value: '900,00' },
    ])).toBe(3)
  })

  it('a linha em branco que o formulário já traz não conta', () => {
    expect(filledBudgetCount(EMPTY_FORMULATOR_STATE.budget.items)).toBe(0)
  })
})
