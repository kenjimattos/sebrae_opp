export interface Curso {
  titulo: string
  carga: string
}

export interface Trilha {
  title: string
  description: string
  cursos: Curso[]
}

export const trilhas: Trilha[] = [
  {
    title: 'Avaliação de\nPolíticas Públicas',
    description:
      'Métodos e ferramentas para avaliar políticas públicas em todas as etapas: antes, durante e após a implementação.',
    cursos: [
      { titulo: 'Avaliação de Impacto de Programas e Políticas Sociais', carga: '36 horas' },
      { titulo: 'Análise Ex Ante de Políticas Públicas', carga: '40 horas' },
      { titulo: 'Avaliação Ex-Post de Políticas Públicas', carga: '25 horas' },
      { titulo: 'Avaliação estratégica de governo', carga: '10 horas' },
    ],
  },
  {
    title: 'Políticas Públicas Setoriais\ne Participação Social',
    description:
      'Participação social, economia criativa e uso de IA na formulação de políticas públicas setoriais.',
    cursos: [
      { titulo: 'Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', carga: '20 horas' },
      { titulo: 'Avaliação de Políticas em Economia Criativa', carga: '20 horas' },
      { titulo: 'Eixo 2 - Envolvendo a sociedade no processo de formulação e implementação de políticas públicas', carga: '129 horas' },
      { titulo: 'Eixo 3 - Formulação de Políticas Públicas e otimização de serviços em IA', carga: '40 horas' },
    ],
  },
  {
    title: 'Metodologias Ágeis\nno Setor Público',
    description:
      'Scrum, Lean e metodologias ágeis aplicadas à administração pública e à transformação digital.',
    cursos: [
      { titulo: 'Scrum no Contexto do Serviço Público', carga: '15 horas' },
      { titulo: 'Ágil no Contexto do Serviço Público', carga: '15 horas' },
      { titulo: 'Abordagem Lean aplicada à Transformação Digital', carga: '25 horas' },
      { titulo: 'Uso da Lean Inception na Administração Pública', carga: '15 horas' },
    ],
  },
  {
    title: 'Design, Inovação e\nTransformação Digital',
    description:
      'Design thinking, sprints de inovação e aceleração de equipes para transformação digital no governo.',
    cursos: [
      { titulo: 'Design Sprint em Projetos de Transformação Digital', carga: '25 horas' },
      { titulo: 'Princípios do Design Thinking e Inovação em Governo', carga: '10 horas' },
      { titulo: 'Gestão da Inovação no Setor Público', carga: '20 horas' },
      { titulo: 'Gestão para Aceleração de Equipes de Inovação', carga: '35 horas' },
    ],
  },
  {
    title: 'Gestão de Projetos\nno Setor Público',
    description:
      'Fundamentos, inovação e inteligência artificial aplicados à gestão de projetos públicos.',
    cursos: [
      { titulo: 'Introdução à Gestão de Projetos', carga: '20 horas' },
      { titulo: 'Gestão de Projetos', carga: '10 horas' },
      { titulo: 'Inovando na Gestão de Projetos', carga: '25 horas' },
      { titulo: 'IA e Gestão de Projetos', carga: '16 horas' },
    ],
  },
  {
    title: 'Convênios de ECTI e\nPrestação de Contas',
    description:
      'Ciclo completo dos convênios de Educação, Ciência, Tecnologia e Inovação: preparação, execução e prestação de contas.',
    cursos: [
      { titulo: 'Convênios de ECTI: Atos Preparatórios', carga: '30 horas' },
      { titulo: 'Convênios de ECTI: Execução', carga: '20 horas' },
      { titulo: 'Convênios de ECTI: Prestação de Contas', carga: '15 horas' },
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15 horas' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20 horas' },
    ],
  },
  {
    title: 'Compras Públicas e\nMarco Legal das Startups',
    description:
      'Marco legal das startups, compras governamentais inovadoras e gestão de contratos públicos.',
    cursos: [
      { titulo: 'Inovação em Compras Governamentais', carga: '20 horas' },
      { titulo: 'Marco Legal das Startups - Contratando Inovação', carga: '25 horas' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos', carga: '25 horas' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos Públicos', carga: '25 horas' },
    ],
  },
  {
    title: 'Gestão e Execução\nMunicipal',
    description:
      'Da posse aos primeiros resultados: execução orçamentária, desenvolvimento urbano e implementação de políticas.',
    cursos: [
      { titulo: 'Gestão Municipal: Tudo para os primeiros 100 dias', carga: '18 horas' },
      { titulo: 'Apoiando a implementação de políticas no município', carga: '18 horas' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30 horas' },
      { titulo: 'Instrumentos de Desenvolvimento Urbano Sustentável', carga: '25 horas' },
      { titulo: 'FluêncIA Estudantes (Módulo de Ética e Transparência)', carga: '2 horas' },
    ],
  },
]
