// Tailwind pure — no Figma equivalent yet
// SideNav à esquerda (largura proporcional, w-1/5) + painel comutável à direita.
// Clicar num botão da SideNav troca o conteúdo do painel via estado local.
// Aba "ambiente" = conteúdo real (Ambiente de negócio); demais = placeholder.

import { useState, type ComponentType } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import { sectionContent } from '@/data/home/sections'
import SideNav from '@/components/layout/SideNav'
import PanelAmbiente from './jornada/PanelAmbiente'
import PlaceholderPanel from './jornada/PlaceholderPanel'

// Registry de abas: id do pilar → painel. Plugar nova aba = criar Panel* + 1 entrada.
const PANELS: Record<string, ComponentType> = {
  ambiente: PanelAmbiente,
}

export default function SectionJornada() {
  const { jornadas } = sectionContent
  const [activeId, setActiveId] = useState<string>(jornadas[0].id)
  const activeJornada = jornadas.find((j) => j.id === activeId) ?? jornadas[0]
  const Panel = PANELS[activeId]

  return (
    <SectionContainer className="!flex-row gap-lg">
      <SideNav activeId={activeId} onSelect={setActiveId} className="w-1/5 shrink-0" />
      <section className="flex flex-col gap-lg flex-1 min-w-0">
        <SectionHeader
          title={activeJornada.title}
          description={activeJornada.subtitle}
        />
        {Panel ? <Panel /> : <PlaceholderPanel label={activeJornada.label} />}
      </section>
    </SectionContainer>
  )
}
