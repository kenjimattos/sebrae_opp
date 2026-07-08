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
