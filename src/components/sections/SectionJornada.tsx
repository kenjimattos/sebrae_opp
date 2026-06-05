// Tailwind pure — no Figma equivalent yet
// SideNav à esquerda (w-1/5) + área comutável à direita.
// A SideNav troca o pilar ativo. Cada pilar declara seus modos no registry abaixo;
// o ModeToggle fica travado no topo (header + toggle = chrome fixo) e só o modo
// ativo recebe flex-1 para distribuir seus elementos no espaço restante.

import { useState, type ComponentType } from 'react'
import SectionHeader from '@/components/ui/SectionHeader'
import { sectionContent } from '@/data/home/sections'
import SideNav from '@/components/layout/SideNav'
import ModeToggle, { type ModeOption } from '@/components/ui/ModeToggle'
import ModeEixos from '@/components/agenda/ModeEixos'
import ModeEconomics from '@/components/economics/ModeEconomics'
import ModeRiscos from '@/components/risks/ModeRisks'
import ModeResources from '@/components/resources/ModeResources'
import ModeEditais from '@/components/resources/ModeEditais'
import ModeTraining from '@/components/training/ModeTraining'
import ModeCaseStudies from '@/components/case-studies/ModeCaseStudies'

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
  recursos: [
    {value: 'emendas', label: 'Emendas', Component: ModeResources},
    {value: 'editais', label: 'Editais', Component: ModeEditais}
  ],
  capacitacao: [
    {value: 'cursos', label: 'Cursos', Component: ModeTraining },
    {value: 'praticas', label: 'Boas práticas', Component: ModeCaseStudies },
  ],
}

export default function SectionJornada() {
  const { jornadas } = sectionContent
  const [activeId, setActiveId] = useState<string>(jornadas[0].id)
  const activeJornada = jornadas.find((j) => j.id === activeId) ?? jornadas[0]
  const modes = PANEL_MODES[activeId]
  const [value, setValue] = useState(modes[0].value)
  const Active = (modes.find((m) => m.value === value) ?? modes[0]).Component

  // Troca de pilar pela SideNav volta o ModeToggle para a primeira opção.
  const handleSelect = (id: string) => {
    setActiveId(id)
    const nextModes = PANEL_MODES[id]
    if (nextModes) setValue(nextModes[0].value)
  }

  return (
    <section className="section-container min-h-[70dvh]">
      <div className="flex gap-lg flex-1 w-full">
        <SideNav activeId={activeId} onSelect={handleSelect} className="w-1/5 shrink-0 self-stretch max-h-[888px]" />
          <div className="flex flex-col gap-lg">
            <SectionHeader
              title={activeJornada.title}
              description={activeJornada.subtitle}
            />
            { value ? <ModeToggle
              value={value}
              onChange={setValue}
              options={modes}
              ariaLabel="Modo de visualização"
              className="self-center shrink-0"
            /> : null }
            <Active />
          </div>
      </div>
    </section>
  )
}
