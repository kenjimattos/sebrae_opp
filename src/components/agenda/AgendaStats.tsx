// Figma: Agenda/Stats (518:3311)
// Summary bar: total indicators + success/warning/alert counts

import type { StatusType } from '@/types/indicadores'

interface AgendaStatsProps {
  total: number
  counts: Record<StatusType, number>
  className?: string
}

const labels: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
}

const styles: Record<StatusType, { bg: string; dot: string }> = {
  success: {
    bg: 'bg-[var(--semantic-success-surface)]',
    dot: 'bg-[var(--semantic-success)]',
  },
  warning: {
    bg: 'bg-[var(--semantic-warning-surface)]',
    dot: 'bg-[var(--semantic-warning)]',
  },
  alert: {
    bg: 'bg-[var(--semantic-alert-surface)]',
    dot: 'bg-[var(--semantic-alert)]',
  },
}

export default function AgendaStats({ total, counts, className = '' }: AgendaStatsProps) {
  return (
    <div
      className={`flex items-center justify-between bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-lg)] py-[var(--spacing-md)] w-full ${className}`}
    >
      <div className="flex items-center gap-[var(--spacing-md)]">
        <span className="typo-display">
          {total}
        </span>
        <span className="typo-body-lg">
          indicadores avaliados
        </span>
      </div>

      <div className="flex items-center gap-[var(--spacing-md)]">
        {(['success', 'warning', 'alert'] as StatusType[]).map((status) => (
          <div
            key={status}
            className={`flex items-center gap-[var(--spacing-xs)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] rounded-[var(--radius-md)] ${styles[status].bg}`}
          >
            <div className={`size-[10px] rounded-full ${styles[status].dot}`} />
            <span className="typo-display-sm">
              {counts[status]}
            </span>
            <span className="typo-body">
              {labels[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
