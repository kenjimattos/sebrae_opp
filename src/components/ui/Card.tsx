// Tailwind pure — no Figma equivalent
// Unified card primitive: surface variants (primary/secondary/status) + padding
// + optional border. O raio é sempre `--radius-sm` e não é configurável: houve
// uma prop `radius`, e o único consumidor que a usava era o Modal, com 24px.
// Superfície do projeto tem um raio só — `rounded-full` é dos controles, não
// daqui. Prop que aceita um valor que ninguém deve escolher é convite a
// divergir.

type CardSurface = 'primary' | 'secondary' | 'success' | 'warning' | 'alert'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps {
  as?: 'div' | 'section'
  surface?: CardSurface
  padding?: CardPadding
  bordered?: boolean
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
  primary: 'border-surface-secondary',
  secondary: 'border-surface-tertiary',
  success: 'border-success',
  warning: 'border-warning',
  alert: 'border-alert',
}

// Literal strings so Tailwind JIT can detect them at build time.
const paddingClass: Record<CardPadding, string> = {
  none: '', sm: 'p-sm', md: 'p-md', lg: 'p-lg', xl: 'p-xl',
}

export default function Card({
  as = 'div',
  surface = 'primary',
  padding = 'md',
  bordered = false,
  className = '',
  children,
}: CardProps) {
  const Tag = as

  // `.card-surface` e `.card-surface-secondary` já trazem
  // `border-radius: var(--radius-default)`. Só as superfícies de status
  // precisam da classe explícita.
  const surfaceHasBakedRadius = surface === 'primary' || surface === 'secondary'

  const classes = [
    surfaceClass[surface],
    surfaceHasBakedRadius ? '' : 'rounded',
    paddingClass[padding],
    bordered ? `border border-solid ${borderColorClass[surface]}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <Tag className={classes}>{children}</Tag>
}
