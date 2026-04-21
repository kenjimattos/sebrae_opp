// Tailwind pure — no Figma equivalent
// Unified card primitive: surface variants (primary/secondary/status) + padding + radius + optional border

type CardSurface = 'primary' | 'secondary' | 'success' | 'warning' | 'alert'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type CardRadius = 'sm' | 'md'

interface CardProps {
  as?: 'div' | 'section'
  surface?: CardSurface
  padding?: CardPadding
  bordered?: boolean
  radius?: CardRadius
  className?: string
  children: React.ReactNode
}

const surfaceClass: Record<CardSurface, string> = {
  primary: 'card-surface',
  secondary: 'card-surface-secondary',
  success: 'status-success-bg',
  warning: 'status-warning-bg',
  alert: 'status-alert-bg',
}

const borderColorClass: Record<CardSurface, string> = {
  primary: 'border-[var(--semantic-surface-secondary)]',
  secondary: 'border-[var(--semantic-surface-tertiary)]',
  success: 'border-[var(--semantic-success)]',
  warning: 'border-[var(--semantic-warning)]',
  alert: 'border-[var(--semantic-alert)]',
}

// Literal strings so Tailwind JIT can detect them at build time.
const paddingClass: Record<CardPadding, string> = {
  none: '', sm: 'p-sm', md: 'p-md', lg: 'p-lg', xl: 'p-xl',
}

const radiusClass: Record<CardRadius, string> = {
  sm: 'rounded-sm', md: 'rounded-md',
}

export default function Card({
  as = 'div',
  surface = 'primary',
  padding = 'md',
  bordered = false,
  radius = 'sm',
  className = '',
  children,
}: CardProps) {
  const Tag = as

  // `.card-surface` and `.card-surface-secondary` already include `border-radius: var(--radius-sm)`.
  // Only emit an explicit radius class for status surfaces or when overriding to a non-default radius.
  const surfaceHasBakedRadius = surface === 'primary' || surface === 'secondary'
  const needsRadiusClass = !surfaceHasBakedRadius || radius !== 'sm'

  const classes = [
    surfaceClass[surface],
    needsRadiusClass ? radiusClass[radius] : '',
    paddingClass[padding],
    bordered ? `border border-solid ${borderColorClass[surface]}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <Tag className={classes}>{children}</Tag>
}
