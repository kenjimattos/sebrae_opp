// Figma: Formulador/StepIndicator (603:1560)
// 4 variantes:
//   - unchecked   → círculo cinza + "A seguir" (inativo)
//   - in-progress → círculo cinza + "Em andamento" (inativo, etapa visitada mas incompleta)
//   - current     → CircleDot preto + "Em andamento" (etapa atual, ativo)
//   - checked     → check verde + "Concluído"
// Clicável quando onClick é fornecido — usado como link para a etapa na sidebar.

import { Check, Circle, CircleDot, iconSizes } from '@/components/icons'

export type StepStatus = 'unchecked' | 'in-progress' | 'current' | 'checked'

interface StepIndicatorProps {
  label: string
  status: StepStatus
  onClick?: () => void
  className?: string
}

const statusLabel: Record<StepStatus, string> = {
  unchecked: 'A seguir',
  'in-progress': 'Em andamento',
  current: 'Em andamento',
  checked: 'Concluído',
}

export default function StepIndicator({
  label,
  status,
  onClick,
  className = '',
}: StepIndicatorProps) {
  const isCurrent = status === 'current'
  const isChecked = status === 'checked'
  const isActive = isCurrent || isChecked

  const Icon = isChecked ? Check : isCurrent ? CircleDot : Circle
  const iconColor = isChecked
    ? 'text-accent'
    : isCurrent
      ? 'text-accent'
      : 'text-inactive'

  const labelColor = isActive
    ? 'text-primary'
    : 'text-inactive'

  const base = `flex items-center gap-sm w-full text-left ${className}`
  const interactive = onClick ? 'cursor-pointer' : ''

  const content = (
    <>
      <Icon size={iconSizes.md} className={`shrink-0 ${iconColor}`} />
      <div className="flex flex-col items-start">
        <span className={`typo-body-bold ${labelColor}`}>{label}</span>
        <span className={`typo-body-sm ${labelColor}`}>{statusLabel[status]}</span>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive}`}>
        {content}
      </button>
    )
  }

  return <div className={base}>{content}</div>
}
