import { sectionContent } from '@/data/home/sections'

export interface NavLink {
  label: string
  sectionId: string
  description: string
}

// Derivado dos pilares da Jornada (fonte única em sections.ts). `sectionId` = anchor
// de scroll usado pelo Header/scroll-spy e chave de aba usada pela SideNav.
export const navLinks: NavLink[] = sectionContent.jornadas.map((j) => ({
  label: j.label,
  sectionId: j.id,
  description: j.description,
}))

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
