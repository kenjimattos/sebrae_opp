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
      <div className={`flex flex-col items-start justify-center max-w-[1000px] ${className}`}>
        <h2 className="w-full typo-h1">
          {title}
        </h2>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-md ${className}`}>
      <h2 className="flex-1 max-w-[690px] typo-h1">
        {title}
      </h2>
      <p className="flex-1 max-w-[400px] typo-body">
        {description}
      </p>
    </div>
  )
}
