// Figma: Economics/Analysis (368:834)
// Bloco de análise textual — futuro: conectado a LLM

import { defaultAnalise, analiseLabel } from '@/data/economics'
import Card from '@/components/ui/Card'

interface EconomicsAnalysisProps {
  analise?: string
  className?: string
}

export default function EconomicsAnalysis({ analise = defaultAnalise, className = '' }: EconomicsAnalysisProps) {
  return (
    <Card
      as="section"
      padding={{ x: 'xl', y: 'md' }}
      className={`flex flex-col gap-xs w-full card-hoverable ${className}`}
    >
      <h4 className="typo-body-bold">
        {analiseLabel}
      </h4>
      <p className="typo-body">
        {analise}
      </p>
    </Card>
  )
}
