// Figma: SectionHeader (set 327:1963)
// Variants: "Default" (title + description side by side), "No description" (title only)

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
  if (!description) {
    return (
      <div className={`flex flex-col items-start justify-center max-w-[1000px] mb-[var(--spacing-2xl)] ${className}`}>
        <h2 className="w-full font-bold text-[length:var(--font-size-h1)] leading-none text-[color:var(--semantic-text-primary)]">
          {title}
        </h2>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-[var(--spacing-md)] mb-[var(--spacing-2xl)] ${className}`}>
      <h2 className="flex-1 max-w-[690px] font-bold text-[length:var(--font-size-h1)] leading-none text-[color:var(--semantic-text-primary)]">
        {title}
      </h2>
      <p className="flex-1 max-w-[400px] font-normal text-[length:var(--font-size-body)] leading-[var(--spacing-md)] text-[color:var(--semantic-text-primary)]">
        {description}
      </p>
    </div>
  )
}
