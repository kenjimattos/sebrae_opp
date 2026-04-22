export interface Curso {
  titulo: string
  carga: string
  descricao?: string
  /** URL do curso na Escola Virtual do Governo (ausente quando o curso não
   *  foi localizado como item individual no catálogo). */
  url?: string
}

export interface Trilha {
  slug: string
  title: string
  description: string
  cursos: Curso[]
}

/** Anchor de um curso dentro da página /trilhas — estável por slug da trilha + índice. */
export function cursoAnchor(trilhaSlug: string, cursoIndex: number): string {
  return `curso-${trilhaSlug}-${cursoIndex}`
}

/** Anchor de uma trilha dentro da página /trilhas. */
export function trilhaAnchor(trilhaSlug: string): string {
  return `trilha-${trilhaSlug}`
}

export const trilhas: Trilha[] = [
  {
    slug: 'formulacao-e-avaliacao',
    title: 'Formulação e Avaliação de Políticas Públicas',
    description:
      'Métodos e ferramentas para avaliar políticas públicas em todas as etapas: antes, durante e após a implementação.',
    cursos: [
      { titulo: 'Avaliação de Impacto de Programas e Políticas Sociais', carga: '36 horas', url: 'https://www.escolavirtual.gov.br/curso/98' },
      { titulo: 'Análise Ex Ante de Políticas Públicas', carga: '40 horas', url: 'https://www.escolavirtual.gov.br/curso/142' },
      { titulo: 'Avaliação estratégica de governo', carga: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/483' },
      { titulo: 'Avaliação Ex-Post de Políticas Públicas', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/561' },
      { titulo: 'Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/617' },
      { titulo: 'Avaliação de Políticas em Economia Criativa', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/846' },
      { titulo: 'Eixo 2 - Envolvendo a sociedade no processo de formulação e implementação de políticas públicas', carga: '129 horas', url: 'https://www.escolavirtual.gov.br/curso/1243' },
      { titulo: 'Eixo 3 - Formulação de Políticas Públicas e otimização de serviços em IA', carga: '40 horas', url: 'https://www.escolavirtual.gov.br/curso/1428' },
    ],
  },
  {
    slug: 'gerenciamento-de-projetos',
    title: 'Gerenciamento de Projetos',
    description:
      'Gerenciamento de projetos públicos: metodologias ágeis, lean e design para acelerar a entrega de valor à população.',
    cursos: [
      { titulo: 'Scrum no Contexto do Serviço Público', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/395' },
      { titulo: 'Ágil no Contexto do Serviço Público', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/317' },
      { titulo: 'Scrum no Contexto do Serviço Público', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/395' },
      { titulo: 'Ágil no Contexto do Serviço Público', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/317' },
      { titulo: 'Abordagem Lean aplicada à Transformação Digital', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/524' },
      { titulo: 'Uso da Lean Inception na Administração Pública', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/527' },
      { titulo: 'Design Sprint em Projetos de Transformação Digital', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/528' },
      { titulo: 'Princípios do Design Thinking e Inovação em Governo', carga: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/326' },
      { titulo: 'Introdução à Gestão de Projetos', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/104' },
      { titulo: 'Gestão de Projetos', carga: '10 horas', url: 'https://www.escolavirtual.gov.br/curso/787' },
      { titulo: 'Inovando na Gestão de Projetos', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/956' },
      { titulo: 'IA e Gestão de Projetos', carga: '16 horas', url: 'https://www.escolavirtual.gov.br/curso/1503' },
      { titulo: 'Gestão da Inovação no Setor Público', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/416' },
      { titulo: 'Gestão para Aceleração de Equipes de Inovação', carga: '35 horas', url: 'https://www.escolavirtual.gov.br/curso/1472' },
    ],
  },
  {
    slug: 'captacao-de-recursos',
    title: 'Captação de Recursos',
    description:
      'Captação de recursos para municípios: convênios, parcerias e instrumentos de desenvolvimento urbano sustentável.',
    cursos: [
      { titulo: 'Convênios de ECTI: Atos Preparatórios', carga: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/655' },
      { titulo: 'Convênios de ECTI: Execução', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/651' },
      { titulo: 'Convênios de ECTI: Prestação de Contas', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/650' },
      { titulo: 'Inovação em Compras Governamentais', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/774' },
      { titulo: 'Marco Legal das Startups - Contratando Inovação', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/951' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1034' },
      { titulo: 'Instrumentos de Desenvolvimento Urbano Sustentável', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1019' },
      { titulo: 'Apoiando a implementação de políticas no município', carga: '18 horas', url: 'https://www.escolavirtual.gov.br/curso/1269' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/257' },
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/650' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/651' },
    ],
  },
  {
    slug: 'prestacao-de-contas',
    title: 'Prestação de contas',
    description:
      'Prestação de contas para municípios: transparência, controle social e boas práticas para uma gestão pública responsável.',
    cursos: [
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15 horas', url: 'https://www.escolavirtual.gov.br/curso/650' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20 horas', url: 'https://www.escolavirtual.gov.br/curso/651' },
      { titulo: 'FluêncIA Estudantes (Módulo de Ética e Transparência)', carga: '2 horas', url: 'https://www.escolavirtual.gov.br/curso/1422' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos Públicos', carga: '25 horas', url: 'https://www.escolavirtual.gov.br/curso/1034' },
      { titulo: 'Gestão Municipal: Tudo para os primeiros 100 dias', carga: '18 horas', url: 'https://www.escolavirtual.gov.br/programa/247' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30 horas', url: 'https://www.escolavirtual.gov.br/curso/257' },
    ],
  },
]
