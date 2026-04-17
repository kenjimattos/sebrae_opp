// Fonte única de verdade para as 10 etapas do Formulador.
// Consumido por sidebar (ProjectSteps), progress bar (FormuladorProgress) e roteamento.

export interface EtapaFormulador {
  slug: string
  label: string      // usado na sidebar ("1. Identificação")
  nome: string       // usado no progress + título do form ("Identificação")
  titulo: string     // cabeçalho do FormCard ("Identificação")
  subtitle: string   // descrição abaixo do título no FormCard
}

export const etapasFormulador: EtapaFormulador[] = [
  {
    slug: 'identificacao',
    label: '1. Identificação',
    nome: 'Identificação',
    titulo: 'Identificação',
    subtitle: 'Dados básicos do projeto e responsáveis',
  },
  {
    slug: 'justificativa',
    label: '2. Justificativa',
    nome: 'Justificativa',
    titulo: 'Justificativa',
    subtitle: 'Por que esse projeto é necessário',
  },
  {
    slug: 'objetivos',
    label: '3. Objetivos',
    nome: 'Objetivos',
    titulo: 'Objetivos',
    subtitle: 'O que se pretende alcançar',
  },
  {
    slug: 'publico-alvo',
    label: '4. Público alvo',
    nome: 'Público alvo',
    titulo: 'Público-alvo',
    subtitle: 'Quem será beneficiado',
  },
  {
    slug: 'plano-acao',
    label: '5. Plano de ação',
    nome: 'Plano de ação',
    titulo: 'Plano de Ação',
    subtitle: 'Atividades e metodologia',
  },
  {
    slug: 'cronograma',
    label: '6. Cronograma',
    nome: 'Cronograma',
    titulo: 'Cronograma',
    subtitle: 'Prazos e marcos do projeto',
  },
  {
    slug: 'indicadores',
    label: '7. Indicadores',
    nome: 'Indicadores',
    titulo: 'Indicadores',
    subtitle: 'Como medir o sucesso do projeto',
  },
  {
    slug: 'orcamento',
    label: '8. Orçamento',
    nome: 'Orçamento',
    titulo: 'Orçamento',
    subtitle: 'Recursos financeiros necessários',
  },
  {
    slug: 'sustentabilidade',
    label: '9. Sustentabilidade',
    nome: 'Sustentabilidade',
    titulo: 'Sustentabilidade',
    subtitle: 'Continuidade após projeto',
  },
  {
    slug: 'governanca',
    label: '10. Governança',
    nome: 'Governança',
    titulo: 'Governança',
    subtitle: 'Gestão, monitoramento e prestação de contas',
  },
]

export function findEtapaBySlug(slug: string): EtapaFormulador | undefined {
  return etapasFormulador.find((e) => e.slug === slug)
}

export function findEtapaIndex(slug: string): number {
  return etapasFormulador.findIndex((e) => e.slug === slug)
}
