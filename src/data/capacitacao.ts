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
      { titulo: 'Avaliação de Impacto de Programas e Políticas Sociais', carga: '36h' },
      { titulo: 'Análise Ex Ante de Políticas Públicas', carga: '40h' },
      { titulo: 'Avaliação Ex-Post de Políticas Públicas', carga: '25h' },
      { titulo: 'Avaliação estratégica de governo', carga: '10h' },
    ],
  },
  {
    title: 'Políticas Públicas Setoriais\ne Participação Social',
    description:
      'Participação social, economia criativa e uso de IA na formulação de políticas públicas setoriais.',
    cursos: [
      { titulo: 'Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', carga: '20h' },
      { titulo: 'Avaliação de Políticas em Economia Criativa', carga: '20h' },
      { titulo: 'Eixo 2 - Envolvendo a sociedade no processo de formulação e implementação de políticas públicas', carga: '129h' },
      { titulo: 'Eixo 3 - Formulação de Políticas Públicas e otimização de serviços em IA', carga: '40h' },
    ],
  },
  {
    title: 'Metodologias Ágeis\nno Setor Público',
    description:
      'Scrum, Lean e metodologias ágeis aplicadas à administração pública e à transformação digital.',
    cursos: [
      { titulo: 'Scrum no Contexto do Serviço Público', carga: '15h' },
      { titulo: 'Ágil no Contexto do Serviço Público', carga: '15h' },
      { titulo: 'Abordagem Lean aplicada à Transformação Digital', carga: '25h' },
      { titulo: 'Uso da Lean Inception na Administração Pública', carga: '15h' },
    ],
  },
  {
    title: 'Design, Inovação e\nTransformação Digital',
    description:
      'Design thinking, sprints de inovação e aceleração de equipes para transformação digital no governo.',
    cursos: [
      { titulo: 'Design Sprint em Projetos de Transformação Digital', carga: '25h' },
      { titulo: 'Princípios do Design Thinking e Inovação em Governo', carga: '10h' },
      { titulo: 'Gestão da Inovação no Setor Público', carga: '20h' },
      { titulo: 'Gestão para Aceleração de Equipes de Inovação', carga: '35h' },
    ],
  },
  {
    title: 'Gestão de Projetos\nno Setor Público',
    description:
      'Fundamentos, inovação e inteligência artificial aplicados à gestão de projetos públicos.',
    cursos: [
      { titulo: 'Introdução à Gestão de Projetos', carga: '20h' },
      { titulo: 'Gestão de Projetos', carga: '10h' },
      { titulo: 'Inovando na Gestão de Projetos', carga: '25h' },
      { titulo: 'IA e Gestão de Projetos', carga: '16h' },
    ],
  },
  {
    title: 'Convênios de ECTI e\nPrestação de Contas',
    description:
      'Ciclo completo dos convênios de Educação, Ciência, Tecnologia e Inovação: preparação, execução e prestação de contas.',
    cursos: [
      { titulo: 'Convênios de ECTI: Atos Preparatórios', carga: '30h' },
      { titulo: 'Convênios de ECTI: Execução', carga: '20h' },
      { titulo: 'Convênios de ECTI: Prestação de Contas', carga: '15h' },
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15h' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20h' },
    ],
  },
  {
    title: 'Compras Públicas e\nMarco Legal das Startups',
    description:
      'Marco legal das startups, compras governamentais inovadoras e gestão de contratos públicos.',
    cursos: [
      { titulo: 'Inovação em Compras Governamentais', carga: '20h' },
      { titulo: 'Marco Legal das Startups - Contratando Inovação', carga: '25h' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos', carga: '25h' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos Públicos', carga: '25h' },
    ],
  },
  {
    title: 'Gestão e Execução\nMunicipal',
    description:
      'Da posse aos primeiros resultados: execução orçamentária, desenvolvimento urbano e implementação de políticas.',
    cursos: [
      { titulo: 'Gestão Municipal: Tudo para os primeiros 100 dias', carga: '18h' },
      { titulo: 'Apoiando a implementação de políticas no município', carga: '18h' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30h' },
      { titulo: 'Instrumentos de Desenvolvimento Urbano Sustentável', carga: '25h' },
      { titulo: 'FluêncIA Estudantes (Módulo de Ética e Transparência)', carga: '2h' },
    ],
  },
]
