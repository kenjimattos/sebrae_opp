// Figma: Risks/Card (set 563:4445)
// Variants: Alert (red border/bg), Warning (yellow border/bg)
// Shows: indicator label + value, risk description, alert label, context

import type { StatusType } from '@/types/indicators'
import Card from '@/components/ui/Card'

interface RisksCardProps {
  label: string
  value: string | number
  type: StatusType
  description: string
  indicatorLabel: string
  context: string
  className?: string
}

const valueColorClass: Record<'alert' | 'warning', string> = {
  alert: 'text-[color:var(--semantic-alert)]',
  warning: 'text-[color:var(--semantic-warning)]',
}

export default function RisksCard({
  label,
  value,
  type,
  description,
  indicatorLabel,
  context,
  className = '',
}: RisksCardProps) {
  // 'success' cannot be a risk — coerce to 'warning' defensively
  const effectiveType = type === 'success' ? 'warning' : type

  return (
    <Card
      surface={effectiveType}
      bordered
      padding="lg"
      className={`flex flex-col gap-md card-hoverable ${className}`}
    >
      <span className={`shrink-0 typo-display ${valueColorClass[effectiveType]}`}>
          {value}
      </span>

      <span className="typo-body-bold">
        {label}
      </span>

      {/* Risk description */}
      <p className="typo-body">
        {description}
      </p>

      <div className="flex flex-col gap-2xs">
        <p className="typo-body-sm-bold">
          {indicatorLabel}
        </p>
        <p className="typo-body-sm">
          {context}
        </p>
      </div>

    </Card>
  )
}
