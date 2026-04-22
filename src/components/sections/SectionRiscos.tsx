// Figma: Section/Riscos (390:594)
// Dynamic: derives risk cards from agenda indicators with alert/warning status

import type { Agenda } from '@/types/indicadores'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import RisksCard from '@/components/risks/RisksCard'
import { sectionContent } from '@/data/home/sections'
import { riscosContexto, defaultRiscoContexto } from '@/data/indicadores/descricoes/riscos'

interface SectionRiscosProps {
  agendas: Agenda[]
}

export default function SectionRiscos({ agendas }: SectionRiscosProps) {
  // Extract indicators with alert first, then warning
  const riscos = agendas
    .flatMap((a) =>
      a.indicadores
        .filter((i) => i.status === 'alert' || i.status === 'warning')
        .map((i) => ({ ...i, agenda: a.nome })),
    )
    .sort((a, b) => {
      if (a.status === 'alert' && b.status !== 'alert') return -1
      if (a.status !== 'alert' && b.status === 'alert') return 1
      return 0
    })

  // Show top 3 risks (matching Figma's 3-column grid)
  const topRiscos = riscos.slice(0, 3)

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.riscos.title} description={sectionContent.riscos.description}/>

      <div className="grid-3 w-full">
        {topRiscos.map((risco) => {
          const ctx = riscosContexto[risco.label] ?? defaultRiscoContexto
          return (
            <RisksCard
              key={risco.label}
              label={risco.label}
              valor={risco.valor}
              tipo={risco.status}
              descricao={ctx.descricao}
              indicadorLabel={ctx.indicadorLabel}
              contexto={ctx.contexto}
            />
          )
        })}
      </div>
    </SectionContainer>
  )
}
