// Figma: SectionHeader (set 327:1963)
// Variants: "Default" (title + description side by side), "No description" (title only)

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
    return (
    <div className={`flex items-start gap-md ${className}`}>
      <h1 className={`${description ? 'w-2/3' : 'w-3/4'} typo-h1`}>
        {title}
      </h1>
      <div className="flex-col flex items-start gap-md w-1/3 pt-2xs">
        { description && 
        <p className="typo-body">
          {description}
        </p>
        }
      </div>
    </div>
  )
}
