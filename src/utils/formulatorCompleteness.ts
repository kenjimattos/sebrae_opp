// Completion rules for each Formulator step.
// A step is only "completed" when all required fields are filled.
// Dynamic arrays require at least one non-empty entry.

import type { FormulatorState } from '@/types/formulator'
import { formulatorSteps } from '@/data/formulator/steps'

function nonEmpty(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

function anyNonEmpty(arr: string[] | undefined): boolean {
  return Array.isArray(arr) && arr.some(nonEmpty)
}

export function isStepComplete(slug: string, state: FormulatorState): boolean {
  switch (slug) {
    case 'identificacao': {
      const d = state.identification
      return nonEmpty(d.title) && nonEmpty(d.responsible) && nonEmpty(d.organization) && nonEmpty(d.duration)
    }
    case 'justificativa': {
      const d = state.justification
      return nonEmpty(d.problem) && nonEmpty(d.evidence) && nonEmpty(d.impact)
    }
    case 'objetivos': {
      const d = state.objectives
      return nonEmpty(d.general) && anyNonEmpty(d.specific)
    }
    case 'publico-alvo': {
      const d = state.targetAudience
      return nonEmpty(d.primary) && nonEmpty(d.secondary) && nonEmpty(d.estimate)
    }
    case 'plano-acao': {
      const d = state.actionPlan
      return nonEmpty(d.activities) && nonEmpty(d.methodology)
    }
    case 'cronograma': {
      const d = state.timeline
      return nonEmpty(d.phases) && nonEmpty(d.milestones)
    }
    case 'indicadores': {
      const d = state.indicators
      return anyNonEmpty(d.results) && anyNonEmpty(d.impact) && anyNonEmpty(d.quantitative)
    }
    case 'orcamento': {
      const d = state.budget
      return d.items.some((r) => nonEmpty(r.label) && nonEmpty(r.value))
    }
    case 'sustentabilidade': {
      const d = state.sustainability
      return nonEmpty(d.continuity) && nonEmpty(d.partnerships)
    }
    case 'governanca': {
      const d = state.governance
      return nonEmpty(d.management) && nonEmpty(d.monitoring) && nonEmpty(d.accountability)
    }
    default:
      return false
  }
}

export function countCompletedSteps(state: FormulatorState): number {
  return formulatorSteps.reduce((acc, e) => (isStepComplete(e.slug, state) ? acc + 1 : acc), 0)
}
