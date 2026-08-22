export interface Course {
  title: string
  duration: string
  description?: string
  /** URL do curso na Escola Virtual do Governo (ausente quando o curso não
   *  foi localizado como item individual no catálogo). */
  url?: string
}

export interface Trail {
  slug: string
  title: string
  description: string
  courses: Course[]
}

/** Anchor de um curso dentro da página /trilhas — estável por slug da trilha + índice. */
export function courseAnchor(trailSlug: string, courseIndex: number): string {
  return `curso-${trailSlug}-${courseIndex}`
}

/** Anchor de uma trilha dentro da página /trilhas. */
export function trailAnchor(trailSlug: string): string {
  return `trilha-${trailSlug}`
}

export const trails: Trail[] = [
  {
    slug: 'formulacao-e-avaliacao',
    title: 'Formulação e Avaliação de Políticas Públicas',
    description:
      'Métodos e ferramentas para avaliar políticas públicas em todas as etapas: antes, durante e após a implementação.',
    courses: [
      { title: 'Avaliação de Impacto de Programas e Políticas Sociais', duration: '36 horas', url: 'https://www.escolavirtual.gov.br/curso/98' },
      { title: 'Análise Ex Ante de Políticas Públicas', duration: '40 horas', url: 'https://www.escolavirtual.gov.br/curso/142' },
      { title: 'Avaliação estratégica de governo', duration: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/483' },
      { title: 'Avaliação Ex-Post de Políticas Públicas', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/561' },
      { title: 'Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/617' },
      { title: 'Avaliação de Políticas em Economia Criativa', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/846' },
      { title: 'Eixo 2 - Envolvendo a sociedade no processo de formulação e implementação de políticas públicas', duration: '129 horas', url: 'https://www.escolavirtual.gov.br/curso/1243' },
      { title: 'Eixo 3 - Formulação de Políticas Públicas e otimização de serviços em IA', duration: '40 horas', url: 'https://www.escolavirtual.gov.br/curso/1428' },
    ],
  },
  {
    slug: 'gerenciamento-de-projetos',
    title: 'Gerenciamento de Projetos',
    description:
      'Gerenciamento de projetos públicos: metodologias ágeis, lean e design para acelerar a entrega de valor à população.',
    courses: [
      { title: 'Scrum no Contexto do Serviço Público', duration: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/395' },
      { title: 'Ágil no Contexto do Serviço Público', duration: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/317' },
      { title: 'Abordagem Lean aplicada à Transformação Digital', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/524' },
      { title: 'Uso da Lean Inception na Administração Pública', duration: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/527' },
      { title: 'Design Sprint em Projetos de Transformação Digital', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/528' },
      { title: 'Princípios do Design Thinking e Inovação em Governo', duration: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/326' },
      { title: 'Introdução à Gestão de Projetos', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/104' },
      { title: 'Gestão de Projetos', duration: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/787' },
      { title: 'Inovando na Gestão de Projetos', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/956' },
      { title: 'IA e Gestão de Projetos', duration: '16 horas', url: 'https://www.escolavirtual.gov.br/curso/1503' },
      { title: 'Gestão da Inovação no Setor Público', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/416' },
      { title: 'Gestão para Aceleração de Equipes de Inovação', duration: '35 horas', url: 'https://www.escolavirtual.gov.br/curso/1472' },
    ],
  },
  {
    slug: 'captacao-de-recursos',
    title: 'Captação de Recursos',
    description:
      'Captação de recursos para municípios: convênios, parcerias e instrumentos de desenvolvimento urbano sustentável.',
    courses: [
      { title: 'Convênios de ECTI: Atos Preparatórios', duration: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/655' },
      { title: 'Convênios de ECTI: Execução', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/651' },
      { title: 'Convênios de ECTI: Prestação de Contas', duration: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/650' },
      { title: 'Inovação em Compras Governamentais', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/774' },
      { title: 'Marco Legal das Startups - Contratando Inovação', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/951' },
      { title: 'Marco Legal das Startups - Gerenciando Contratos', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1034' },
      { title: 'Instrumentos de Desenvolvimento Urbano Sustentável', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1019' },
      { title: 'Apoiando a implementação de políticas no município', duration: '18 horas', url: 'https://www.escolavirtual.gov.br/curso/1269' },
      { title: 'Execução Orçamentária e Financeira', duration: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/257' },
    ],
  },
  {
    slug: 'prestacao-de-contas',
    title: 'Prestação de contas',
    description:
      'Prestação de contas para municípios: transparência, controle social e boas práticas para uma gestão pública responsável.',
    courses: [
      { title: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', duration: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/650' },
      { title: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', duration: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/651' },
      { title: 'FluêncIA Estudantes (Módulo de Ética e Transparência)', duration: '2 horas', url: 'https://www.escolavirtual.gov.br/curso/1422' },
      { title: 'Marco Legal das Startups - Gerenciando Contratos Públicos', duration: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1034' },
      { title: 'Gestão Municipal: Tudo para os primeiros 100 dias', duration: '18 horas', url: 'https://www.escolavirtual.gov.br/programa/247' },
      { title: 'Execução Orçamentária e Financeira', duration: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/257' },
    ],
  },
]
