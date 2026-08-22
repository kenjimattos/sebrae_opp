// Figma: SectionHeader (set 327:1963)
// Variants: "Default" (title + description side by side), "No description" (title only)

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
    return (
    <div className={`flex items-center gap-xl ${className}`}>
      <h1 className="typo-h1 w-full text-right">
        {title}
      </h1>
      <div className="flex-col flex w-full items-start gap-md pt-2xs">
        { description && 
        <p className="typo-title-md uppercase">
          {description}
        </p>
        }
      </div>
    </div>
  )
}
