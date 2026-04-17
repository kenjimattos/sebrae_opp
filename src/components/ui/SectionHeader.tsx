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
      <div className={`flex ${className}`}>
        <h2 className="w-3/4 typo-h1">
          {title}
        </h2>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-md ${className}`}>
      <h2 className="w-2/3 typo-h1">
        {title}
      </h2>
      <p className="w-1/3 typo-body">
        {description}
      </p>
    </div>
  )
}
