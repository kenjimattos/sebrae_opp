// Dispatcher das 10 etapas do Formulador.
// Mapa slug → componente de formulário. Cada form lê/escreve um slice do FormulatorContext.

import StepIdentification from './StepIdentification'
import StepJustification from './StepJustification'
import StepObjectives from './StepObjectives'
import StepTargetAudience from './StepTargetAudience'
import StepActionPlan from './StepActionPlan'
import StepTimeline from './StepTimeline'
import StepIndicators from './StepIndicators'
import StepBudget from './StepBudget'
import StepSustainability from './StepSustainability'
import StepGovernance from './StepGovernance'

const STEP_MAP: Record<string, React.ComponentType> = {
  identificacao: StepIdentification,
  justificativa: StepJustification,
  objetivos: StepObjectives,
  'publico-alvo': StepTargetAudience,
  'plano-acao': StepActionPlan,
  cronograma: StepTimeline,
  indicadores: StepIndicators,
  orcamento: StepBudget,
  sustentabilidade: StepSustainability,
  governanca: StepGovernance,
}

interface StepFormProps {
  slug: string
}

export function StepForm({ slug }: StepFormProps) {
  const Component = STEP_MAP[slug]
  if (!Component) {
    return (
      <div className="flex items-center justify-center typo-body text-inactive h-[400px]">
        Etapa "{slug}" não encontrada
      </div>
    )
  }
  return <Component />
}
