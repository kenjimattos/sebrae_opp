import { describe, expect, it } from 'vitest'
import { EMPTY_FORMULATOR_STATE, type FormulatorState } from '@/types/formulator'
import { formulatorSteps } from '@/data/formulator/steps'
import { countCompletedSteps, isStepComplete } from '@/utils/formulatorCompleteness'

// A etapa "concluída" governa três coisas visíveis: o check na sidebar, o
// "X% concluído" da barra e a leitura de quanto falta. Errar para mais é pior
// que errar para menos — o gestor fecha o formulário achando que terminou.
// O PDF não depende disto: FormulatorReview imprime todo campo com texto.

// Preenchimento mínimo que satisfaz cada etapa, na ordem de steps.ts.
const PREENCHIDO: Record<string, Partial<FormulatorState>> = {
  identificacao: {
    identification: { title: 'T', responsible: 'R', organization: 'O', duration: '12 meses' },
  },
  justificativa: {
    justification: { problem: 'P', evidence: 'E', impact: 'I', policy: '' },
  },
  objetivos: {
    objectives: { general: 'G', specific: ['', 'E2'] },
  },
  'publico-alvo': {
    targetAudience: { primary: 'A', secondary: 'B', estimate: '500' },
  },
  'plano-acao': {
    actionPlan: { activities: 'A', methodology: 'M' },
  },
  cronograma: {
    timeline: { phases: 'F', milestones: 'M' },
  },
  indicadores: {
    indicators: { results: ['R'], impact: ['I'], quantitative: ['Q'] },
  },
  orcamento: {
    budget: { items: [{ label: '', value: '' }, { label: 'Serviços', value: '1.000,00' }] },
  },
  sustentabilidade: {
    sustainability: { continuity: 'C', partnerships: 'P' },
  },
  governanca: {
    governance: { management: 'G', monitoring: 'M', accountability: 'A' },
  },
}

function comEtapas(...slugs: string[]): FormulatorState {
  return slugs.reduce<FormulatorState>(
    (acc, slug) => ({ ...acc, ...PREENCHIDO[slug] }),
    EMPTY_FORMULATOR_STATE,
  )
}

describe('isStepComplete', () => {
  it('nenhuma das 10 etapas está concluída no formulário em branco', () => {
    for (const etapa of formulatorSteps) {
      expect(isStepComplete(etapa.slug, EMPTY_FORMULATOR_STATE), etapa.slug).toBe(false)
    }
  })

  it('cada etapa fica concluída com seu preenchimento mínimo', () => {
    for (const etapa of formulatorSteps) {
      expect(isStepComplete(etapa.slug, comEtapas(etapa.slug)), etapa.slug).toBe(true)
    }
  })

  it('preencher uma etapa não conclui as outras', () => {
    const state = comEtapas('identificacao')
    for (const etapa of formulatorSteps) {
      expect(isStepComplete(etapa.slug, state), etapa.slug).toBe(etapa.slug === 'identificacao')
    }
  })

  it('slug desconhecido nunca conta como concluído', () => {
    expect(isStepComplete('etapa-que-nao-existe', comEtapas(...formulatorSteps.map((e) => e.slug)))).toBe(false)
  })

  it('só espaços em branco não conclui a etapa', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      actionPlan: { activities: '   ', methodology: '\n\t' },
    }
    expect(isStepComplete('plano-acao', state)).toBe(false)
  })

  it('um campo obrigatório em branco derruba a etapa inteira', () => {
    const state = comEtapas('identificacao')
    state.identification = { ...state.identification, duration: '' }
    expect(isStepComplete('identificacao', state)).toBe(false)
  })

  it('a política pública não é obrigatória para concluir a justificativa', () => {
    const state = comEtapas('justificativa')
    expect(state.justification.policy).toBe('')
    expect(isStepComplete('justificativa', state)).toBe(true)
  })

  it('objetivo geral sem nenhum específico não conclui', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      objectives: { general: 'Ampliar o acesso ao crédito', specific: ['', '', ''] },
    }
    expect(isStepComplete('objetivos', state)).toBe(false)
  })

  it('indicadores exigem os três grupos, não só um', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      indicators: { results: ['R'], impact: ['', ''], quantitative: ['Q'] },
    }
    expect(isStepComplete('indicadores', state)).toBe(false)
  })

  it('rubrica com nome e sem valor não conclui o orçamento', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      budget: { items: [{ label: 'Consultoria', value: '' }] },
    }
    expect(isStepComplete('orcamento', state)).toBe(false)
  })

  it('valor sem nome de rubrica também não conclui', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      budget: { items: [{ label: '', value: '5.000,00' }] },
    }
    expect(isStepComplete('orcamento', state)).toBe(false)
  })

  it('nome e valor precisam estar na MESMA linha do orçamento', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      budget: { items: [{ label: 'Consultoria', value: '' }, { label: '', value: '5.000,00' }] },
    }
    expect(isStepComplete('orcamento', state)).toBe(false)
  })

  it('visitar a etapa não a conclui', () => {
    const state: FormulatorState = {
      ...EMPTY_FORMULATOR_STATE,
      visitedSteps: formulatorSteps.map((e) => e.slug),
    }
    expect(countCompletedSteps(state)).toBe(0)
  })
})

describe('countCompletedSteps', () => {
  it('formulário em branco: zero', () => {
    expect(countCompletedSteps(EMPTY_FORMULATOR_STATE)).toBe(0)
  })

  it('conta só as etapas completas', () => {
    expect(countCompletedSteps(comEtapas('identificacao', 'cronograma', 'governanca'))).toBe(3)
  })

  it('etapa pela metade não entra na conta', () => {
    const state = comEtapas('identificacao', 'cronograma')
    state.governance = { management: 'G', monitoring: '', accountability: '' }
    expect(countCompletedSteps(state)).toBe(2)
  })

  it('formulário inteiro preenchido fecha em 10 de 10 — a barra chega a 100%', () => {
    const state = comEtapas(...formulatorSteps.map((e) => e.slug))
    expect(countCompletedSteps(state)).toBe(formulatorSteps.length)
    expect((countCompletedSteps(state) / formulatorSteps.length) * 100).toBe(100)
  })
})
