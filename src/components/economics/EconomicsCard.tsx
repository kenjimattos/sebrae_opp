import { useState } from 'react'
import { Plus, Minus } from '@/components/icons'
import IconButton from '@/components/ui/buttons/IconButton'
import { economicBaseDescriptions } from '@/data/indicators/descriptions/economic-base'
import type { StatusType } from '@/types/indicators'

interface EconomicBaseCardProps {
  id: string
  label: string
  value: string
  variation: string
  tone?: StatusType
  referenceYear?: string
  className?: string
}

const variationColor: Record<StatusType, string> = {
  success: 'text-[color:var(--semantic-success)]',
  warning: 'text-[color:var(--semantic-warning)]',
  alert: 'text-[color:var(--semantic-alert)]',
  none: '',
}

export default function EconomicBaseCard({ id, label, value, variation, tone, referenceYear = '', className = '' }: EconomicBaseCardProps) {
  const description = economicBaseDescriptions[id]
  const [expanded, setExpanded] = useState(false)

  return (
    <main
      className={`flex flex-col border p-sm justify-between gap-sm ${className}`}
    >
        <span className="typo-body-sm uppercase mt-xs">
          {label}
        </span>
        <div className="flex justify-between items-center gap-sm">
          <span className="typo-display-sm">
            {value}
          </span>
          <span className={`typo-body-sm-bold ${tone ? variationColor[tone] : ''}`}>
            {variation}
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
