// Figma: TitleSubtitle (set 405:1388)
// Variants: "H2" (larger), "H3" (smaller)

interface TitleSubtitleProps {
  title: string
  content: string
  variant?: 'h2' | 'h3'
  className?: string
}

export default function TitleSubtitle({
  title,
  content,
  variant = 'h2',
  className = '',
}: TitleSubtitleProps) {
  const isH2 = variant === 'h2'

  return (
    <div className={`flex flex-col items-start gap-[var(--spacing-sm)] ${className}`}>
      {isH2 ? (
        <>
          <h3 className="w-full typo-h2 text-[color:var(--semantic-text-primary)]">
            {title}
          </h3>
          <p className="w-full typo-body-lg text-[color:var(--semantic-text-primary)]">
            {content}
          </p>
        </>
      ) : (
        <>
          <h4 className="w-full typo-h3 text-[color:var(--semantic-text-primary)]">
            {title}
          </h4>
          <p className="w-full typo-body text-[color:var(--semantic-text-primary)]">
            {content}
          </p>
        </>
      )}
    </div>
  )
}
