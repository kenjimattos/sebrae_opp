// Single source of truth for the 10 Formulator steps.
// Consumed by sidebar (ProjectSteps), progress bar (FormulatorProgress) and routing.

export interface FormulatorStep {
  slug: string
  label: string      // usado na sidebar ("1. Identificação")
  name: string       // usado no progress + título do form ("Identificação")
  title: string      // cabeçalho do FormCard ("Identificação")
  subtitle: string   // descrição abaixo do título no FormCard
}

export const formulatorSteps: FormulatorStep[] = [
  {
    slug: 'identificacao',
    label: '1. Identificação',
    name: 'Identificação',
    title: 'Identificação',
    subtitle: 'Dados básicos do projeto e responsáveis',
  },
  {
    slug: 'justificativa',
    label: '2. Justificativa',
    name: 'Justificativa',
    title: 'Justificativa',
    subtitle: 'Por que esse projeto é necessário',
  },
  {
    slug: 'objetivos',
    label: '3. Objetivos',
    name: 'Objetivos',
    title: 'Objetivos',
    subtitle: 'O que se pretende alcançar',
  },
  {
    slug: 'publico-alvo',
    label: '4. Público alvo',
    name: 'Público alvo',
    title: 'Público-alvo',
    subtitle: 'Quem será beneficiado',
  },
  {
    slug: 'plano-acao',
    label: '5. Plano de ação',
    name: 'Plano de ação',
    title: 'Plano de Ação',
    subtitle: 'Atividades e metodologia',
  },
  {
    slug: 'cronograma',
    label: '6. Cronograma',
    name: 'Cronograma',
    title: 'Cronograma',
    subtitle: 'Prazos e marcos do projeto',
  },
  {
    slug: 'indicadores',
    label: '7. Indicadores',
    name: 'Indicadores',
    title: 'Indicadores',
    subtitle: 'Como medir o sucesso do projeto',
  },
  {
    slug: 'orcamento',
    label: '8. Orçamento',
    name: 'Orçamento',
    title: 'Orçamento',
    subtitle: 'Recursos financeiros necessários',
  },
  {
    slug: 'sustentabilidade',
    label: '9. Sustentabilidade',
    name: 'Sustentabilidade',
    title: 'Sustentabilidade',
    subtitle: 'Continuidade após projeto',
  },
  {
    slug: 'governanca',
    label: '10. Governança',
    name: 'Governança',
    title: 'Governança',
    subtitle: 'Gestão, monitoramento e prestação de contas',
  },
]

export function findStepBySlug(slug: string): FormulatorStep | undefined {
  return formulatorSteps.find((e) => e.slug === slug)
}

export function findStepIndex(slug: string): number {
  return formulatorSteps.findIndex((e) => e.slug === slug)
}
