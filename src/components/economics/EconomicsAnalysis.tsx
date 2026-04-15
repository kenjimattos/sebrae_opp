// Figma: Economics/Analysis (368:834)
// Bloco de análise textual — futuro: conectado a LLM

import { defaultAnalise, analiseLabel } from '@/data/economics'

interface EconomicsAnalysisProps {
  analise?: string
  className?: string
}

export default function EconomicsAnalysis({ analise = defaultAnalise, className = '' }: EconomicsAnalysisProps) {
  return (
    <div
      className={`card-surface px-xl py-md flex flex-col gap-xs w-full ${className}`}
    >
      <h4 className="typo-body-bold">
        {analiseLabel}
      </h4>
      <p className="typo-body">
        {analise}
      </p>
    </div>
  )
}
