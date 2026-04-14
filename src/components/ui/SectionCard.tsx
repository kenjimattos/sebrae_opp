// Tailwind pure — no Figma equivalent
// White rounded card used inside SectionContainer for content blocks

interface SectionCardProps {
  children: React.ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const paddingStyles: Record<string, string> = {
  sm: 'p-[var(--spacing-sm)]',
  md: 'p-[var(--spacing-md)]',
  lg: 'p-[var(--spacing-lg)]',
  xl: 'px-[var(--spacing-xl)] py-[var(--spacing-2xl)]',
}

export default function SectionCard({ children, padding = 'lg', className = '' }: SectionCardProps) {
  return (
    <div
      className={`bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
