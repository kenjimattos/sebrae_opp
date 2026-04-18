// Figma: TitleSubtitle (set 405:1388)
// Variants: "H1" (lg), "H2" (md), "H3" (sm)

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface TitleSubtitleProps {
  title: string
  subtitle: string
  size?: 'lg' | 'md' | 'sm'
  as?: HeadingTag
  className?: string
}

const sizeConfig = {
  lg: { typoTitle: 'typo-h1', typoBody: 'typo-body-lg', defaultTag: 'h2' as HeadingTag },
  md: { typoTitle: 'typo-h3', typoBody: 'typo-body', defaultTag: 'h3' as HeadingTag },
  sm: { typoTitle: 'typo-h3', typoBody: 'typo-body-sm', defaultTag: 'h4' as HeadingTag },
}

export default function TitleSubtitle({
  title,
  subtitle,
  size = 'md',
  as,
  className = '',
}: TitleSubtitleProps) {
  const { typoTitle, typoBody, defaultTag } = sizeConfig[size]
  const Tag = as ?? defaultTag

  return (
    <div className={`flex-col-start gap-sm ${className}`}>
      <Tag className={`w-full ${typoTitle}`}>
        {title}
      </Tag>
      <p className={`w-full ${typoBody}`}>
        {subtitle}
      </p>
    </div>
  )
}
