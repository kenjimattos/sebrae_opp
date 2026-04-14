// Figma: Agenda/Badge (set 563:3818)
// Variants: Success, Warning, Alert

import type { StatusType } from '@/types/indicadores'

interface AgendaBadgeProps {
  status: StatusType
  value: string | number
  className?: string
}

const statusStyles: Record<StatusType, { bg: string; dot: string }> = {
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

export default function AgendaBadge({ status, value, className = '' }: AgendaBadgeProps) {
  const styles = statusStyles[status]

  return (
    <div
      className={`flex items-center gap-[var(--spacing-xs)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] rounded-[var(--radius-md)] ${styles.bg} ${className}`}
    >
      <div className={`size-[12px] rounded-full ${styles.dot}`} />
      <span className="typo-body-sm-bold text-[color:var(--semantic-text-primary)] text-right whitespace-nowrap">
        {value}
      </span>
    </div>
  )
}
