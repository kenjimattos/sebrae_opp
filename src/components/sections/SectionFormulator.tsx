// Figma: Section/Formulador (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import FormulatorCard from '@/components/formulator/FormulatorCard'
import { sectionContent } from '@/data/home/sections'
import { formulatorCards } from '@/data/home/formulator'

export default function SectionFormulator() {
  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.formulator.title}
        description={sectionContent.formulator.description}
      />

      <div className="flex gap-md items-start w-full">
        {formulatorCards.map((card) => (
          <FormulatorCard
            key={card.title}
            title={card.title}
            description={card.description}
            buttonLabel={card.buttonLabel}
            buttonHref={card.buttonHref}
          />
        ))}
      </div>
    </SectionContainer>
  )
}
