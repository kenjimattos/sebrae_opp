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
    title: 'Formulação e avaliação de\nPolíticas Públicas',
    description:
      'Do diagnóstico do problema ao desenho de soluções estruturadas para o desenvolvimento local.',
    cursos: [
      { titulo: 'Avaliação de Impacto de Políticas Públicas', carga: '36 Horas' },
      { titulo: 'Elaboração de Projetos Municipais', carga: '40 Horas' },
      { titulo: 'Gestão de Políticas Públicas', carga: '48 Horas' },
    ],
  },
  {
    title: 'Captação de recursos e\nfinanciamento municipal',
    description:
      'Estratégias para identificar, acessar e gerir recursos federais, estaduais e de emendas parlamentares.',
    cursos: [
      { titulo: 'Captação de Recursos Federais', carga: '20 Horas' },
      { titulo: 'Elaboração de Convênios', carga: '32 Horas' },
      { titulo: 'Gestão Financeira Municipal', carga: '36 Horas' },
    ],
  },
  {
    title: 'Liderança e governança\nlocal',
    description:
      'Competências de liderança, articulação política e governança participativa para gestores municipais.',
    cursos: [
      { titulo: 'Liderança e Governança Local', carga: '48 Horas' },
      { titulo: 'Articulação Institucional', carga: '24 Horas' },
      { titulo: 'Governança Participativa', carga: '32 Horas' },
    ],
  },
  {
    title: 'Indicadores e diagnóstico\nmunicipal',
    description:
      'Uso de dados e indicadores para embasar decisões estratégicas e monitorar o desenvolvimento local.',
    cursos: [
      { titulo: 'Indicadores Municipais', carga: '32 Horas' },
      { titulo: 'Diagnóstico Socioeconômico', carga: '28 Horas' },
      { titulo: 'Planejamento Estratégico Municipal', carga: '40 Horas' },
    ],
  },
]
