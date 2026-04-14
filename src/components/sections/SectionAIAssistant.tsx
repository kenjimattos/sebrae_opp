// Figma: Section/AIAssistant (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import Button from '@/components/ui/Button'
import { sectionContent } from '@/data/sections'

export default function SectionAIAssistant() {
  return (
    <SectionContainer className="items-center py-[var(--spacing-3xl)]">
      <div className="flex flex-col items-center gap-[var(--spacing-md)] max-w-[800px] text-center">
        <h2 className="typo-h1 text-[color:var(--semantic-text-primary)]">
          {sectionContent.aiAssistant.title}
        </h2>
        <p className="typo-body-lg text-[color:var(--semantic-text-primary)]">
          {sectionContent.aiAssistant.description}
        </p>
      </div>

      <div className="flex flex-col gap-[var(--spacing-md)] bg-[var(--semantic-surface-primary)] rounded-[var(--radius-md)] p-[var(--spacing-lg)] w-full max-w-[800px]">
        <div className="bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] p-[var(--spacing-md)]">
          <p className="typo-body text-[color:var(--semantic-text-inactive)]">
            Ex: "Quais indicadores de educação estão em alerta em Campina Grande?"
          </p>
        </div>

        <div className="flex gap-[var(--spacing-sm)]">
          <Button variant="primary">Analisar indicadores</Button>
          <Button variant="secondary">Gerar relatório</Button>
          <Button variant="tertiary">Comparar municípios</Button>
        </div>
      </div>
    </SectionContainer>
  )
}
