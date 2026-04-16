// Figma: Section/AIAssistant (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import Button from '@/components/ui/buttons/Button'
import { sectionContent } from '@/data/sections'
import { aiAssistantPlaceholder, aiActionButtons } from '@/data/ai-assistant'

export default function SectionAIAssistant() {
  return (
    <SectionContainer className="items-center py-3xl">
      <div className="flex flex-col items-center gap-md max-w-[800px] text-center">
        <h2 className="typo-h1">
          {sectionContent.aiAssistant.title}
        </h2>
        <p className="typo-body-lg">
          {sectionContent.aiAssistant.description}
        </p>
      </div>

      <SectionCard padding="lg" className="flex flex-col gap-md radius-md w-full max-w-[800px]">
        <div className="bg-surface-secondary radius-sm p-md">
          <p className="typo-body text-inactive">
            {aiAssistantPlaceholder}
          </p>
        </div>

        <div className="flex gap-sm">
          {aiActionButtons.map((btn) => (
            <Button key={btn.label} variant={btn.variant}>{btn.label}</Button>
          ))}
        </div>
      </SectionCard>
    </SectionContainer>
  )
}
