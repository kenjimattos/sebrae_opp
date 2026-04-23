// Figma: Section/Riscos (390:594)
// Dynamic: derives risk cards from agenda indicators with alert/warning status

import type { Agenda } from '@/types/indicators'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import RisksCard from '@/components/risks/RisksCard'
import { sectionContent } from '@/data/home/sections'
import { risksContext, defaultRiskContext } from '@/data/indicators/descriptions/risks'

interface SectionRisksProps {
  agendas: Agenda[]
}

export default function SectionRisks({ agendas }: SectionRisksProps) {
  // Extract indicators with alert first, then warning
  const risks = agendas
    .flatMap((a) =>
      a.indicators
        .filter((i) => i.status === 'alert' || i.status === 'warning')
        .map((i) => ({ ...i, agenda: a.name })),
    )
    .sort((a, b) => {
      if (a.status === 'alert' && b.status !== 'alert') return -1
      if (a.status !== 'alert' && b.status === 'alert') return 1
      return 0
    })

  // Show top 3 risks (matching Figma's 3-column grid)
  const topRisks = risks.slice(0, 3)

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.risks.title} description={sectionContent.risks.description}/>

      <div className="grid-3 w-full">
        {topRisks.map((risk) => {
          const ctx = (risk.id && risksContext[risk.id]) || defaultRiskContext
          return (
            <RisksCard
              key={risk.id ?? risk.label}
              label={risk.label}
              value={risk.value}
              type={risk.status}
              description={ctx.description}
              indicatorLabel={ctx.indicatorLabel}
              context={ctx.context}
            />
          )
        })}
      </div>
    </SectionContainer>
  )
}
