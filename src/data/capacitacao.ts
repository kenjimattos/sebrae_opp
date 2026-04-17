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
    title: 'Formulação e Avaliação de Políticas Públicas',
    description:
      'Métodos e ferramentas para avaliar políticas públicas em todas as etapas: antes, durante e após a implementação.',
    cursos: [
      { titulo: 'Avaliação de Impacto de Programas e Políticas Sociais', carga: '36 horas' },
      { titulo: 'Análise Ex Ante de Políticas Públicas', carga: '40 horas' },
      { titulo: 'Avaliação estratégica de governo', carga: '10 horas' },      
      { titulo: 'Avaliação Ex-Post de Políticas Públicas', carga: '25 horas' },
      { titulo: 'Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', carga: '20 horas' },
      { titulo: 'Avaliação de Políticas em Economia Criativa', carga: '20 horas' },
      { titulo: 'Eixo 2 - Envolvendo a sociedade no processo de formulação e implementação de políticas públicas', carga: '129 horas' },
      { titulo: 'Eixo 3 - Formulação de Políticas Públicas e otimização de serviços em IA', carga: '40 horas' },      
    ],
  },
  {
    title: 'Gerenciamento de Projetos',
    description:
      'Gerenciamento de projetos públicos: metodologias ágeis, lean e design para acelerar a entrega de valor à população.',
    cursos: [
      { titulo: 'Scrum no Contexto do Serviço Público', carga: '15 horas' },
      { titulo: 'Ágil no Contexto do Serviço Público', carga: '15 horas' },
      { titulo: 'Scrum no Contexto do Serviço Público', carga:	'15 horas'},
      { titulo: 'Ágil no Contexto do Serviço Público', carga:	'15 horas'},
      { titulo: 'Abordagem Lean aplicada à Transformação Digital', carga: '25 horas' },
      { titulo: 'Uso da Lean Inception na Administração Pública', carga: '15 horas' },
      { titulo: 'Design Sprint em Projetos de Transformação Digital', carga: '25 horas' },
      { titulo: 'Princípios do Design Thinking e Inovação em Governo', carga: '10 horas' },
      { titulo: 'Introdução à Gestão de Projetos', carga: '20 horas' },
      { titulo: 'Gestão de Projetos', carga: '10 horas' },
      { titulo: 'Inovando na Gestão de Projetos', carga: '25 horas' },
      { titulo: 'IA e Gestão de Projetos', carga: '16 horas' },
      { titulo: 'Gestão da Inovação no Setor Público', carga: '20 horas' },
      { titulo: 'Gestão para Aceleração de Equipes de Inovação', carga: '35 horas' },
    ],
  },
  {
    title: 'Captação de Recursos',
    description:
      'Captação de recursos para municípios: convênios, parcerias e instrumentos de desenvolvimento urbano sustentável.',
    cursos: [
      { titulo: 'Convênios de ECTI: Atos Preparatórios', carga: '30 horas' },
      { titulo: 'Convênios de ECTI: Execução', carga: '20 horas' },
      { titulo: 'Convênios de ECTI: Prestação de Contas', carga: '15 horas' },
      { titulo: 'Inovação em Compras Governamentais', carga: '20 horas' },
      { titulo: 'Marco Legal das Startups - Contratando Inovação', carga: '25 horas' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos', carga: '25 horas' },
      { titulo: 'Instrumentos de Desenvolvimento Urbano Sustentável', carga: '25 horas' },
      { titulo: 'Apoiando a implementação de políticas no município', carga: '18 horas' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30 horas' },
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15 horas' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20 horas' },
    ],
  },
  {
    title: 'Prestação de contas',
    description:
      'Prestação de contas para municípios: transparência, controle social e boas práticas para uma gestão pública responsável.',
    cursos: [
      { titulo: 'Convênio de Educação, Ciência, Tecnologia e Inovação: Prestação de Contas', carga: '15 horas' },
      { titulo: 'Convênios de Educação, Ciência, Tecnologia e Inovação - ECTI: Execução', carga: '20 horas' },
      { titulo: 'FluêncIA Estudantes (Módulo de Ética e Transparência)', carga: '2 horas' },
      { titulo: 'Marco Legal das Startups - Gerenciando Contratos Públicos', carga: '25 horas' },
      { titulo: 'Gestão Municipal: Tudo para os primeiros 100 dias', carga: '18 horas' },
      { titulo: 'Execução Orçamentária e Financeira', carga: '30 horas' },
    ],
  },
]
