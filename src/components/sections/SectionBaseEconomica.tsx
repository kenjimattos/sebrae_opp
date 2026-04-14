// Figma: Section/BaseEconomica (390:581)

import type { BaseEconomicaItem } from '@/types/indicadores'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import EconomicsCard from '@/components/economics/EconomicsCard'
import EconomicsAnalysis from '@/components/economics/EconomicsAnalysis'
import { sectionContent } from '@/data/sections'

interface SectionBaseEconomicaProps {
  dados: BaseEconomicaItem[]
}

export default function SectionBaseEconomica({ dados }: SectionBaseEconomicaProps) {
  return (
    <SectionContainer className="gap-[var(--spacing-2xl)]">
      <SectionHeader title={sectionContent.baseEconomica.title} />

      <div className="flex flex-col gap-[var(--spacing-lg)]">
        <div className="flex flex-wrap gap-[var(--spacing-sm)] w-full">
          {dados.map((item) => (
            <EconomicsCard
              key={item.label}
              label={item.label}
              valor={item.valor}
              variacao={item.variacao}
              icone={item.icone}
            />
          ))}
        </div>

        <EconomicsAnalysis />
      </div>
    </SectionContainer>
  )
}
