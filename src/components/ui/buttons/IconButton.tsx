// Circular icon-only button. 4 variants × 3 sizes.
//
// Sizes:
// - sm: 24×24 (icon 12px) — usado dentro de CTAs pequenos (PillButton sm/md)
// - md: 40×40 (icon 16px) — tamanho neutro
// - lg: 48×48 (icon 24px) — scroll nav, inner arrow de PillButton lg
//
// aria-label é obrigatório (icon-only buttons precisam de rótulo textual).

import { iconSizes, type IconSize, type LucideIcon } from '@/components/icons'
import { buttonVariantStyles, buttonBaseClass } from './button-styles'

interface IconButtonProps {
  icon: LucideIcon
  'aria-label': string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
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
      className={`${buttonBaseClass} shrink-0 ${buttonVariantStyles[variant]} ${s.dimensions} ${className}`}
    >
      <Icon size={iconSizes[s.iconSize]} />
    </button>
  )
}
