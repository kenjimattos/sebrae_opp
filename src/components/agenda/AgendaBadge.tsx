// Figma: Agenda/Badge (set 563:3818)
// Variants: Success, Warning, Alert

import type { StatusType } from '@/types/indicadores'
import { statusStyles } from '@/utils/statusStyles'

interface AgendaBadgeProps {
  status: StatusType
  value: string | number
  className?: string
}

export default function AgendaBadge({ status, value, className = '' }: AgendaBadgeProps) {
  const styles = statusStyles[status]

  return (
    <div
      className={`flex-center gap-xs px-sm py-2xs rounded-[var(--radius-md)] ${styles.bg} ${className}`}
    >
      <div className={`size-[12px] rounded-full ${styles.dot}`} />
      <span className="typo-body-sm-bold text-right whitespace-nowrap">
        {value}
      </span>
    </div>
  )
}
