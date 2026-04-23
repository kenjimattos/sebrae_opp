// Figma: Section/BaseEconomica (390:581)

import type { EconomicBaseItem } from '@/types/indicators'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import EconomicBaseCard from '@/components/economic-base/EconomicBaseCard'
import EconomicBaseAnalysis from '@/components/economic-base/EconomicBaseAnalysis'
import { sectionContent } from '@/data/home/sections'
import { getAnalysisForMunicipality } from '@/data/home/economic-base'
import { useMunicipality } from '@/hooks/useMunicipality'

interface SectionEconomicBaseProps {
  items: EconomicBaseItem[]
}

export default function SectionEconomicBase({ items }: SectionEconomicBaseProps) {
  const { municipality } = useMunicipality()
  const analysis = getAnalysisForMunicipality(municipality.id)

  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.economicBase.title} />

      <div className="flex flex-col gap-md">
        <div className="grid-4 w-full">
          {items.map((item) => (
            <EconomicBaseCard
              key={item.id}
              id={item.id}
              label={item.label}
              value={item.value}
              variation={item.variation}
              icon={item.icon}
            />
          ))}
        </div>

        <EconomicBaseAnalysis key={municipality.id} analysis={analysis} />
      </div>
    </SectionContainer>
  )
}
