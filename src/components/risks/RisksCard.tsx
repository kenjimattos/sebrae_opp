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
      {/* Header: label + value */}
      <div className="flex items-start gap-md w-full">
        <span className="flex-1 typo-body-bold">
          {label}
        </span>
        <span className={`shrink-0 typo-display-sm ${valueColorClass[effectiveTipo]}`}>
          {valor}
        </span>
      </div>

      {/* Risk description */}
      <p className="typo-body">
        {descricao}
      </p>

      {/* Alert indicator label */}
      <p className="typo-body-bold">
        {indicadorLabel}
      </p>

      {/* Context */}
      <p className="typo-body">
        {contexto}
      </p>
    </Card>
  )
}
