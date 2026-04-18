// Figma: Risks/Card (set 563:4445)
// Variants: Alert (red border/bg), Warning (yellow border/bg)
// Shows: indicator label + value, risk description, alert label, context

import type { StatusType } from '@/types/indicadores'
import Card from '@/components/ui/Card'

interface RisksCardProps {
  label: string
  valor: string | number
  tipo: StatusType
  descricao: string
  indicadorLabel: string
  contexto: string
  className?: string
}

const valueColorClass: Record<'alert' | 'warning', string> = {
  alert: 'text-[color:var(--semantic-alert)]',
  warning: 'text-[color:var(--semantic-warning)]',
}

export default function RisksCard({
  label,
  valor,
  tipo,
  descricao,
  indicadorLabel,
  contexto,
  className = '',
}: RisksCardProps) {
  // 'success' cannot be a risk — coerce to 'warning' defensively
  const effectiveTipo = tipo === 'success' ? 'warning' : tipo

  return (
    <Card
      surface={effectiveTipo}
      bordered
      padding="lg"
      className={`flex flex-col gap-md card-hoverable ${className}`}
    >
      <span className={`shrink-0 typo-display-sm ${valueColorClass[effectiveTipo]}`}>
          {valor}
      </span>

      <span className="typo-body-bold">
        {label}
      </span>

      {/* Risk description */}
      <p className="typo-body">
        {descricao}
      </p>

      <div className="flex flex-col gap-2xs">
        <p className="typo-body-sm-bold">
          {indicadorLabel}
        </p>
        <p className="typo-body-sm">
          {contexto}
        </p>
      </div>

    </Card>
  )
}
