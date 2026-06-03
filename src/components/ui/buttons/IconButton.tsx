// Circular icon container. 4 variants × 4 sizes.
// Renders as <button> (interactive) or <span> (decorative).
//
// Sizes:
// - xs: 24×24 (icon 12px) — CTAs pequenos (PillButton sm/md)
// - sm: 32×32 (icon 16px) — metric cards (EconomicsCard)
// - md: 40×40 (icon 16px) — tamanho neutro
// - lg: 48×48 (icon 24px) — scroll nav, hero decorative
//
// Interactive mode (default): aria-label obrigatório.
// Decorative mode: renderiza <span aria-hidden="true">, sem interatividade.

import { iconSizes, type IconSize, type LucideIcon } from '@/components/icons'
import { buttonBaseClass, buttonVariantStyles } from './button-styles'

interface IconButtonProps {
  icon: LucideIcon
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  decorative?: boolean
  'aria-label'?: string
  onClick?: () => void
  disabled?: boolean
}

const sizeStyles: Record<string, { dimensions: string; iconSize: IconSize }> = {
  xs: { dimensions: 'w-[16px] h-[16px]', iconSize: 'xs' },
  sm: { dimensions: 'w-[32px] h-[32px]', iconSize: 'sm' },
  md: { dimensions: 'w-[40px] h-[40px]', iconSize: 'sm' },
  lg: { dimensions: 'w-[48px] h-[48px]', iconSize: 'lg' },
}

export default function IconButton({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  decorative = false,
  'aria-label': ariaLabel,
  onClick,
  disabled = false,
}: IconButtonProps) {
  const s = sizeStyles[size]
  const iconEl = <Icon size={iconSizes[s.iconSize]} />

  if (decorative) {
    return (
      <span
        aria-hidden="true"
        className={`${s.dimensions} ${buttonBaseClass} ${buttonVariantStyles[variant]} rounded-[2px] no-pointer-events`}
      >
        {iconEl}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`${s.dimensions} ${buttonBaseClass} ${buttonVariantStyles[variant]}`}
    >
      {iconEl}
    </button>
  )
}
