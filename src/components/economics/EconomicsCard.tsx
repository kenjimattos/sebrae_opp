import { useState } from 'react'
import { Plus, Minus } from '@/components/icons'
import IconButton from '@/components/ui/buttons/IconButton'
import { economicBaseDescriptions } from '@/data/indicators/descriptions/economic-base'
import { formatVariationPct } from '@/utils/economics'
import type { EconomicVariation } from '@/types/indicators'

interface EconomicBaseCardProps {
  id: string
  label: string
  value: string
  // Objeto estruturado já normalizado (ou null quando não há variação).
  variation?: EconomicVariation | null
  referenceYear?: string
  className?: string
}

// A variação é exibida em cor neutra: os cards da base econômica não têm
// semáforo por design (ver database/MAPEAMENTO_BASE_DOS_DADOS.md) e não há
// metadado de direção para classificar melhora/piora de forma reproduzível.
export default function EconomicBaseCard({ id, label, value, variation, referenceYear = '', className = '' }: EconomicBaseCardProps) {
  const description = economicBaseDescriptions[id]
  const [expanded, setExpanded] = useState(false)
  const variationText = variation ? formatVariationPct(variation) : ''
  const variationTitle = variation
    ? `vs ${variation.previousYear}: ${variation.previousValue}`
    : undefined

  return (
    <main
      className={`flex flex-col p-sm justify-between gap-sm ${className}`}
    >
        <span className="typo-body-sm uppercase mt-xs">
          {label}
        </span>
        <div className="flex justify-between items-center gap-sm">
          <span className="typo-display-sm">
            {value}
          </span>
          <span className="typo-body-sm-bold" title={variationTitle}>
            {variationText}
          </span>
        </div>
        <div className="flex items-end justify-between gap-sm">
          <p className={`typo-body-sm ${expanded ? '' : 'line-clamp-2'}`}>
            {description}
          </p>
          <IconButton
            icon={expanded ? Minus : Plus}
            variant="tertiary"
            size="xs"
            aria-label={expanded ? 'Recolher descrição' : 'Expandir descrição'}
            onClick={() => setExpanded((prev) => !prev)}
          />
        </div>
        <span className="typo-body-sm text-right align-self-end">
          {referenceYear}
        </span>
    </main>
  )
}
