// Figma: Section/Formulador (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import FormuladorCard from '@/components/formulador/FormuladorCard'
import { sectionContent } from '@/data/sections'
import { formuladorCards } from '@/data/formulador'

export default function SectionFormulador() {
  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.formulador.title}
        description={sectionContent.formulador.description}
      />

      <div className="flex gap-md items-start w-full">
        {formuladorCards.map((card) => (
          <FormuladorCard
            key={card.titulo}
            titulo={card.titulo}
            descricao={card.descricao}
            buttonLabel={card.buttonLabel}
            buttonHref={card.buttonHref}
          />
        ))}
      </div>
    </SectionContainer>
  )
}
