// Dispatcher das 10 etapas do Formulador.
// Mapa slug → componente de formulário. Cada form lê/escreve um slice do FormuladorContext.

import StepIdentificacao from './StepIdentificacao'
import StepJustificativa from './StepJustificativa'
import StepObjetivos from './StepObjetivos'
import StepPublicoAlvo from './StepPublicoAlvo'
import StepPlanoAcao from './StepPlanoAcao'
import StepCronograma from './StepCronograma'
import StepIndicadores from './StepIndicadores'
import StepOrcamento from './StepOrcamento'
import StepSustentabilidade from './StepSustentabilidade'
import StepGovernanca from './StepGovernanca'

const STEP_MAP: Record<string, React.ComponentType> = {
  identificacao: StepIdentificacao,
  justificativa: StepJustificativa,
  objetivos: StepObjetivos,
  'publico-alvo': StepPublicoAlvo,
  'plano-acao': StepPlanoAcao,
  cronograma: StepCronograma,
  indicadores: StepIndicadores,
  orcamento: StepOrcamento,
  sustentabilidade: StepSustentabilidade,
  governanca: StepGovernanca,
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
