// Figma: Agenda/Indicator (300:32)
// Single indicator row: label + badge

import type { StatusType } from '@/types/indicadores'
import AgendaBadge from '@/components/agenda/AgendaBadge'

interface AgendaIndicatorProps {
  label: string
  valor: string | number
  status: StatusType
}

export default function AgendaIndicator({ label, valor, status }: AgendaIndicatorProps) {
  return (
    <div className="flex flex-col gap-[var(--spacing-sm)] w-full">
      <div className="flex items-center gap-[var(--spacing-lg)] px-[var(--spacing-xs)] w-full">
        <span className="flex-1 typo-body text-[color:var(--semantic-text-primary)]">
          {label}
        </span>
        <AgendaBadge status={status} value={valor} />
      </div>
      <div className="h-px w-full bg-[var(--semantic-surface-secondary)]" />
    </div>
  )
}
