// Figma: Agenda/Stats (518:3311)
// Summary bar: total indicators + success/warning/alert counts

import type { StatusType } from '@/types/indicadores'
import { statusStyles } from '@/utils/statusStyles'

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

export default function AgendaStats({ total, counts, className = '' }: AgendaStatsProps) {
  return (
    <div
      className={`flex-between card-surface px-lg py-md w-full ${className}`}
    >
      <div className="flex-center gap-md">
        <span className="typo-display">
          {total}
        </span>
        <span className="typo-body-lg">
          indicadores avaliados
        </span>
      </div>

      <div className="flex-center gap-md">
        {(['success', 'warning', 'alert'] as StatusType[]).map((status) => (
          <div
            key={status}
            className={`flex-center gap-xs px-sm py-xs rounded-[var(--radius-md)] ${statusStyles[status].bg}`}
          >
            <div className={`size-[10px] rounded-full ${statusStyles[status].dot}`} />
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
