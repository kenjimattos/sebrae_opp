// Figma: TitleSubtitle (set 405:1388)
// Variants: "H1" (lg), "H2" (md), "H3" (sm)

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface TitleSubtitleProps {
  title: string
  content: string
  size?: 'lg' | 'md' | 'sm'
  as?: HeadingTag
  className?: string
}

const sizeConfig = {
  lg: { typoTitle: 'typo-h1', typoBody: 'typo-body-lg', defaultTag: 'h2' as HeadingTag },
  md: { typoTitle: 'typo-h2', typoBody: 'typo-body-lg', defaultTag: 'h3' as HeadingTag },
  sm: { typoTitle: 'typo-h3', typoBody: 'typo-body', defaultTag: 'h4' as HeadingTag },
}

export default function TitleSubtitle({
  title,
  content,
  size = 'md',
  as,
  className = '',
}: TitleSubtitleProps) {
  const { typoTitle, typoBody, defaultTag } = sizeConfig[size]
  const Tag = as ?? defaultTag

  return (
    <div className={`flex flex-col items-start gap-[var(--spacing-sm)] ${className}`}>
      <Tag className={`w-full ${typoTitle} text-[color:var(--semantic-text-primary)]`}>
        {title}
      </Tag>
      <p className={`w-full ${typoBody} text-[color:var(--semantic-text-primary)]`}>
        {content}
      </p>
    </div>
  )
}
