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
      className={`bg-[var(--semantic-surface-primary)] flex flex-1 flex-col justify-between items-end p-xl rounded-[var(--radius-sm)] min-h-[600px] ${className}`}
    >
      <h3 className="w-full typo-h2">
        {titulo}
      </h3>
      <p className="w-full typo-body-lg">
        {descricao}
      </p>
      <PillButton label={buttonLabel} href={buttonHref} />
    </div>
  )
}
