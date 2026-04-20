// Tailwind pure — no Figma equivalent
// Unified card primitive: surface variants (primary/secondary/status) + padding + radius + optional border
// Substitui o antigo SectionCard e centraliza a composição card-surface/status-*-bg + padding/radius/border

type CardSurface = 'primary' | 'secondary' | 'success' | 'warning' | 'alert'
type PaddingAll = 'sm' | 'md' | 'lg' | 'xl'
type PaddingX = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type PaddingY = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | '2xl' | '3xl'
type CardPadding = 'none' | PaddingAll | { x: PaddingX; y: PaddingY }
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

const paddingAllClass: Record<PaddingAll, string> = {
  sm: 'p-sm',
  md: 'p-md',
  lg: 'p-lg',
  xl: 'p-xl',
}

const paddingXClass: Record<PaddingX, string> = {
  '2xs': 'px-2xs',
  xs: 'px-xs',
  sm: 'px-sm',
  md: 'px-md',
  lg: 'px-lg',
  xl: 'px-xl',
  '2xl': 'px-2xl',
}

const paddingYClass: Record<PaddingY, string> = {
  '2xs': 'py-2xs',
  xs: 'py-xs',
  sm: 'py-sm',
  md: 'py-md',
  lg: 'py-lg',
  '2xl': 'py-2xl',
  '3xl': 'py-3xl',
}

const radiusClass: Record<CardRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
}

function resolvePadding(padding: CardPadding): string {
  if (padding === 'none') return ''
  if (typeof padding === 'string') return paddingAllClass[padding]
  return `${paddingXClass[padding.x]} ${paddingYClass[padding.y]}`
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
  const radiusToken = needsRadiusClass ? radiusClass[radius] : ''

  const borderToken = bordered ? `border border-solid ${borderColorClass[surface]}` : ''

  const classes = [
    surfaceClass[surface],
    radiusToken,
    resolvePadding(padding),
    borderToken,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <Tag className={classes}>{children}</Tag>
}
