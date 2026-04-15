// Figma: Section/AIAssistant (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import Button from '@/components/ui/Button'
import { sectionContent } from '@/data/sections'

export default function SectionAIAssistant() {
  return (
    <SectionContainer className="items-center py-[var(--spacing-3xl)]">
      <div className="flex flex-col items-center gap-[var(--spacing-md)] max-w-[800px] text-center">
        <h2 className="typo-h1">
          {sectionContent.aiAssistant.title}
        </h2>
        <p className="typo-body-lg">
          {sectionContent.aiAssistant.description}
        </p>
      </div>

      <SectionCard padding="lg" className="flex flex-col gap-[var(--spacing-md)] rounded-[var(--radius-md)] w-full max-w-[800px]">
        <div className="bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] p-[var(--spacing-md)]">
          <p className="typo-body text-inactive">
            Ex: "Quais indicadores de educação estão em alerta em Campina Grande?"
          </p>
        </div>

        <div className="flex gap-[var(--spacing-sm)]">
          <Button variant="primary">Analisar indicadores</Button>
          <Button variant="secondary">Gerar relatório</Button>
          <Button variant="tertiary">Comparar municípios</Button>
        </div>
      </SectionCard>
    </SectionContainer>
  )
}
