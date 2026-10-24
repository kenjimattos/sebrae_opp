// Títulos e descrições das seções — extraídos do Figma
// Centralizado para facilitar manutenção

export const sectionContent = {
  hero: {
    // `tagline` é a sigla aberta — a única linha da tela que diz o que PIPPA
    // significa. Mexer aqui é mexer no nome da plataforma.
    tagline: 'Plataforma de Inteligência de Políticas Públicas Aplicadas',
    subtitle: 'Jornada para um Município Empreendedor',
    description:
      'Uma plataforma de inteligência que converte dados do território em insights para gerar mas capacidade para a gestão pública transformar o ambiente de negócios do seu território.',
  },
  // Os 4 pilares da Jornada — fonte única de verdade.
  // `id` é também o anchor de scroll (Home/Header) e a chave de aba (SideNav/SectionJornada).
  // `label` = texto curto de navegação (Header + SideNav); `title`/`subtitle` = SectionHeader;
  // `description` = frase curta, de uma ou duas linhas, usada nos cards empilhados
  // da entrada.
  jornadas: [
    {
      id: 'ambiente',
      label: 'Ambiente de negócio',
      title: 'Ambiente de negócio',
      subtitle:
        'Veja os principais indicadores para qualidade do ambiente negocio do seu municipio',
      description: 'Identifique e priorize agendas estratégicas para o seu território.'
    },
    {
      id: 'recursos',
      label: 'Mapeamento de recursos',
      title: 'Mapeamento de recursos',
      subtitle: 'Encontre oportunidades de captação de recursos para o seu município',
      description:
        'Mapeamento de fontes de recursos que podem impulsionar o ambiente de negócios do seu município.'
    },
    {
      id: 'capacitacao',
      label: 'Capacitação',
      title: 'Cursos e boas práticas',
      subtitle: 'Curadoria de conteúdos para desenvolver novas habilidades para uma gestão pública cada vez mais inovadora.',
      description: 'Curadoria de cursos e casos para se inspirar.'
    },
    {
      id: 'formulador',
      label: 'Formulador',
      title: 'Formulador de projetos',
      subtitle: 'Com base nos indicadores estratégicos do seu município e os pontos de atenção identificados, comece a escrever um projeto para fortalecer o ambiente de negócios do seu município e apresente aos interessados.',
      description: 'Ferramenta para te apoiar na formulação de projetos de políticas públicas.'
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
