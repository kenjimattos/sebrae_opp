// Títulos e descrições das seções — extraídos do Figma
// Centralizado para facilitar manutenção

export const sectionContent = {
  hero: {
    title: 'Observatório de Políticas Públicas',
    subtitle: 'Jornada do Município Empreendedor',
    description:
      'Uma plataforma de inteligência que converte dados do território em insights e capacidade da gestão pública em ação para transformar o ambiente de negócios local.',
  },
  // Os 4 pilares da Jornada — fonte única de verdade.
  // `id` é também o anchor de scroll (Home/Header) e a chave de aba (SideNav/SectionJornada).
  // `label` = texto curto de navegação (Header + SideNav); `title`/`subtitle` = SectionHeader;
  // `description` = texto longo (card do Hero + descrição expandida na SideNav).
  jornadas: [
    {
      id: 'ambiente',
      label: 'Ambiente de negócio',
      title: 'Ambiente de negócio',
      subtitle:
        'Veja os principais indicadores para qualidade do ambiente negocio do seu municipio',
      description:
        'Identifique e priorize causas estratégicas para o seu território, conectando e interpretando dados públicos, de políticas e do ecossistema de negócios.',
    },
    {
      id: 'recursos',
      label: 'Mapeamento de recursos',
      title: 'Mapeamento de recursos',
      subtitle: 'Encontre oportunidades de captação de recursos para o seu município',
      description:
        'Mapeamento de oportunidades abertas para captação de recursos (emendas, editais e outras fontes) para aprimoramento de ambiente de negócios local.',
    },
    {
      id: 'capacitacao',
      label: 'Capacitação',
      title: 'Cursos e boas práticas',
      subtitle: 'Curadoria de conteúdos para desenvolver novas habilidades para uma gestão pública cada vez mais inovadora.',
      description:
        'Curadoria de cursos e casos de sucesso, além de acesso à comunidade de prática, para aprendizagem significativa de uma gestão pública inovadora.',
    },
    {
      id: 'formulador',
      label: 'Formulador',
      title: 'Formulador de projetos',
      subtitle: 'Com base nos riscos estratégicos e pontos de atenção identificados, comece a escrever seu projeto para fortalecer o ambiente de negócios no seu município.',
      description:
        'Acesse ferramentas para te apoiar na formulação de projetos de políticas públicas para transformação do ambiente de negócios local.',
    },
  ],
  caseStudies: {
    title: 'Inspire-se com casos de sucesso',
    description: 'Veja como outros municípios implementaram estratégias eficazes para melhorar seu ambiente de negócios.'
  },
  trails: {
    title: 'Capacitação para gestores públicos municipais',
    description:
      'Cursos organizados por eixo de atuação para apoiar gestores públicos na formulação, execução e financiamento de políticas públicas.',
  },
} as const
