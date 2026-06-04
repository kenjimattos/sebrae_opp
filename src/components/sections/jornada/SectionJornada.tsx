// Tailwind pure — no Figma equivalent yet
// SideNav à esquerda (w-1/5) + área comutável à direita.
// A SideNav troca o pilar ativo. Cada pilar declara seus modos no registry abaixo;
// o ModeToggle fica travado no topo (header + toggle = chrome fixo) e só o modo
// ativo recebe flex-1 para distribuir seus elementos no espaço restante.

import { act, useState, type ComponentType } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import { sectionContent } from '@/data/home/sections'
import SideNav from '@/components/layout/SideNav'
import ModeToggle, { type ModeOption } from '@/components/ui/ModeToggle'
import ModeEixos from '@/components/agenda/ModeEixos'
import ModeEconomics from '@/components/economics/ModeEconomics'
import ModeRiscos from '@/components/risks/ModeRisks'

interface Mode extends ModeOption {
  Component: ComponentType
}

// Registry de modos por pilar. Plugar novo pilar = criar os modos + 1 entrada aqui.
// Pilar sem entrada cai no PlaceholderPanel (sem toggle).
const PANEL_MODES: Record<string, Mode[]> = {
  ambiente: [
    { value: 'agenda', label: 'Eixos prioritários', Component: ModeEixos },
    { value: 'economics', label: 'Panorâma Sócioeconômico', Component: ModeEconomics },
    { value: 'risks', label: 'Riscos estratégicos', Component: ModeRiscos },
  ],
}

export default function SectionJornada() {
  const { jornadas } = sectionContent
  const [activeId, setActiveId] = useState<string>(jornadas[0].id)
  const activeJornada = jornadas.find((j) => j.id === activeId) ?? jornadas[0]
  const modes = PANEL_MODES[activeId]
  const [value, setValue] = useState(modes[0].value)
  const Active = (modes.find((m) => m.value === value) ?? modes[0]).Component

  return (
    <SectionContainer className="!flex-row gap-lg !h-auto !py-lg">
      <SideNav activeId={activeId} onSelect={setActiveId} className="w-1/5 shrink-0 h-[90dvh]" />
      <section className="flex flex-1 flex-col min-h-0 gap-md">
        <header className="flex flex-col gap-sm">
          <SectionHeader
            title={activeJornada.title}
            description={activeJornada.subtitle}
          />
          <ModeToggle
            value={value}
            onChange={setValue}
            options={modes}
            ariaLabel="Modo de visualização"
            className="self-center shrink-0"
          />
        </header>
        <main className="flex items-start h-full">
          <Active />
        </main>
      </section>
    </SectionContainer>
  )
}
