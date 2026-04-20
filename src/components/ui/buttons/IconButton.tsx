// Circular icon-only button. 4 variants × 3 sizes.
//
// Sizes:
// - sm: 24×24 (icon 12px) — usado dentro de CTAs pequenos (PillButton sm/md)
// - md: 40×40 (icon 16px) — tamanho neutro
// - lg: 48×48 (icon 24px) — scroll nav, inner arrow de PillButton lg
//
// aria-label é obrigatório (icon-only buttons precisam de rótulo textual).

import { iconSizes, type IconSize, type LucideIcon } from '@/components/icons'

interface IconButtonProps {
  icon: LucideIcon
  'aria-label': string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[var(--semantic-button-primary)] text-[color:var(--semantic-button-label-primary)]',
  secondary:
    'bg-[var(--semantic-button-secondary)] text-[color:var(--semantic-button-label-secondary)]',
  tertiary:
    'bg-[var(--semantic-button-tertiary)] text-[color:var(--semantic-button-label-tertiary)]',
  ghost:
    'bg-transparent text-[color:var(--semantic-text-primary)]',
}

const sizeStyles: Record<string, { dimensions: string; iconSize: IconSize }> = {
  sm: { dimensions: 'w-[24px] h-[24px]', iconSize: 'xs' },
  md: { dimensions: 'w-[40px] h-[40px]', iconSize: 'sm' },
  lg: { dimensions: 'w-[48px] h-[48px]', iconSize: 'lg' },
}

export default function IconButton({
  icon: Icon,
  'aria-label': ariaLabel,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}: IconButtonProps) {
  const s = sizeStyles[size]
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center shrink-0 rounded-full cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${s.dimensions} ${className}`}
    >
      <Icon size={iconSizes[s.iconSize]} />
    </button>
  )
}
