// Tailwind pure — no Figma equivalent yet
// SideNav à esquerda (largura proporcional, w-1/5) + painel comutável à direita.
// Clicar num botão da SideNav troca o conteúdo do painel via estado local.
// Aba "ambiente" = conteúdo real (Ambiente de negócio); demais = placeholder.

import { useState } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import { sectionContent } from '@/data/home/sections'
import SideNav from '@/components/layout/SideNav'

export default function SectionJornada() {
  const { jornadas } = sectionContent
  const [activeId, setActiveId] = useState<string>(jornadas[0].id)
  const activeJornada = jornadas.find((j) => j.id === activeId) ?? jornadas[0]

  return (
    <SectionContainer className="!flex-row items-start gap-lg">
      <SideNav activeId={activeId} onSelect={setActiveId} className="w-1/5 shrink-0" />
      <section className="flex flex-col gap-lg flex-1 min-w-0">
        <SectionHeader
          title={activeJornada.title}
          description={activeJornada.subtitle}
        />
      </section>
    </SectionContainer>
  )
}
