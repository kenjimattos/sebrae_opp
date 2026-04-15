// Tailwind pure — no Figma equivalent
// Barra encaixada no topo de um SectionCard via -mt negativo
// Aceita label + controle (dropdown, tabs, etc.)

interface InsetBarProps {
  label: string
  children: React.ReactNode
  className?: string
}

export default function InsetBar({ label, children, className = '' }: InsetBarProps) {
  return (
    <div
      className={`flex items-center gap-md bg-surface-secondary px-md py-xs rounded-b-3xl w-fit h-fit -mt-[var(--spacing-lg)] ${className}`}
    >
      <span className="typo-body-bold">{label}</span>
      {children}
    </div>
  )
}
