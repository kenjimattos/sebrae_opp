export interface NavLink {
  label: string
  sectionId: string
}

export const navLinks: NavLink[] = [
  { label: 'Agendas', sectionId: 'agendas' },
  { label: 'Panorama', sectionId: 'panorama' },
  { label: 'Base Econômica', sectionId: 'base-economica' },
  { label: 'Riscos', sectionId: 'riscos' },
  { label: 'Recursos', sectionId: 'recursos' },
  { label: 'Capacitação', sectionId: 'capacitacao' },
  { label: 'Casos de Sucesso', sectionId: 'casos-sucesso' },
  { label: 'Formulador', sectionId: 'formulador' },
]

export interface FooterColumn {
  title: string
  links: string[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Navegação',
    links: ['Início', 'Panorama', 'Recursos', 'Capacitação'],
  },
  {
    title: 'Recursos',
    links: ['Documentação', 'Tutoriais', 'API', 'Suporte'],
  },
  {
    title: 'Contato',
    links: ['contato@plataforma.gov.br', 'Fale Conosco'],
  },
]

export const brandText = {
  name: 'Plataforma OPP',
  tagline: 'Transformando dados em\ndecisões estratégicas.',
} as const

export const copyright = '© 2025 Plataforma. Todos os direitos reservados.' as const
