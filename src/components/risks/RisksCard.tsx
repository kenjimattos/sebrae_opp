// Figma: Risks/Card (set 563:4445)
// Variants: Alert (red border/bg), Warning (yellow border/bg)
// Shows: indicator label + value, risk description, alert label, context

import type { StatusType } from '@/types/indicadores'

interface RisksCardProps {
  label: string
  valor: string | number
  tipo: StatusType
  descricao: string
  indicadorLabel: string
  contexto: string
  className?: string
}

const tipoStyles: Record<'alert' | 'warning', { bg: string; border: string; valueColor: string }> = {
  alert: {
    bg: 'bg-[var(--semantic-alert-surface)]',
    border: 'border-[var(--semantic-alert)]',
    valueColor: 'text-[color:var(--semantic-alert)]',
  },
  warning: {
    bg: 'bg-[var(--semantic-warning-surface)]',
    border: 'border-[var(--semantic-warning)]',
    valueColor: 'text-[color:var(--semantic-warning)]',
  },
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
  const effectiveTipo = tipo === 'success' ? 'warning' : tipo
  const styles = tipoStyles[effectiveTipo]

  return (
    <div
      className={`flex flex-col gap-md border border-solid radius-sm p-lg ${styles.bg} ${styles.border} ${className}`}
    >
      {/* Header: label + value */}
      <div className="flex items-start gap-md w-full">
        <span className="flex-1 typo-body-bold">
          {label}
        </span>
        <span className={`shrink-0 typo-display-sm ${styles.valueColor}`}>
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
    </div>
  )
}
