// Tailwind pure — no Figma equivalent (used internally por Formulador/Progress)
// Barra de progresso horizontal: track + fill preenchido baseado em value (0–100).

interface ProgressBarProps {
  value: number
  className?: string
}

export default function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={`w-full h-[0.5rem] rounded-full bg-[var(--semantic-surface-tertiary)] overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
