// Figma: Section/Agendas (390:567)

import type { Agenda, StatusType } from '@/types/indicadores'
import SectionContainer from '@/components/ui/SectionContainer'
import AgendaStats from '@/components/agenda/AgendaStats'
import AgendaCard from '@/components/agenda/AgendaCard'
import { sectionContent } from '@/data/home/sections'

interface SectionAgendasProps {
  agendas: Agenda[]
}

export default function SectionAgendas({ agendas }: SectionAgendasProps) {
  // Count totals across all agendas
  const allIndicadores = agendas.flatMap((a) => a.indicadores)
  const total = allIndicadores.length
  const counts: Record<StatusType, number> = {
    success: allIndicadores.filter((i) => i.status === 'success').length,
    warning: allIndicadores.filter((i) => i.status === 'warning').length,
    alert: allIndicadores.filter((i) => i.status === 'alert').length,
  }

  return (
    <SectionContainer className="items-center">
      {/* Title */}
      <h2
        className="typo-h1 text-center max-w-[860px]"
        dangerouslySetInnerHTML={{
          __html: sectionContent.agendas.title.replace(
            /<highlight>(.*?)<\/highlight>/,
            '<span style="color: var(--semantic-accent)">$1</span>',
          ),
        }}
      />
      <div className="flex flex-col items-center gap-md w-full">
        {/* Stats bar */}
        <AgendaStats total={total} counts={counts} />
        {/* Cards grid: 3 columns */}

        <div className="grid-3 w-full">
          {agendas.map((agenda) => (
            <AgendaCard
              key={agenda.nome}
              title={agenda.nome}
              indicadores={agenda.indicadores}
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
