// Figma: Formulador/Card (296:8)

import PillButton from '@/components/ui/PillButton'

interface FormuladorCardProps {
  titulo: string
  descricao: string
  buttonLabel: string
  buttonHref: string
  className?: string
}

export default function FormuladorCard({
  titulo,
  descricao,
  buttonLabel,
  buttonHref,
  className = '',
}: FormuladorCardProps) {
  return (
    <div
      className={`bg-[var(--semantic-surface-primary)] flex flex-1 flex-col justify-between items-end p-[var(--spacing-xl)] rounded-[var(--radius-sm)] min-h-[400px] ${className}`}
    >
      <h3 className="w-full typo-h2 text-[color:var(--semantic-text-primary)]">
        {titulo}
      </h3>
      <p className="w-full typo-body-lg text-[color:var(--semantic-text-primary)]">
        {descricao}
      </p>
      <PillButton label={buttonLabel} href={buttonHref} />
    </div>
  )
}
