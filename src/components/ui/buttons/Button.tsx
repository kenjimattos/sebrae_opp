// Figma: Buttons (set 378:477)
// Variants: primary, secondary, tertiary, ghost | Sizes: sm (24px), md (40px), lg (64px)
//
// Button always renders a <button>. For icon-only buttons use IconButton.
// Icon is optional; when provided, it sits left or right of the label (default 'right').

import { iconSizes, type IconSize, type LucideIcon } from '@/components/icons'

interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
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
  success:
    'bg-[var(--semantic-success)] text-[color:var(--primitives-white)]',
}

const sizeStyles: Record<string, { container: string; typo: string; iconSize: IconSize }> = {
  sm: { container: 'h-[24px] px-2xs gap-2xs', typo: 'typo-button-sm', iconSize: 'xs' },
  md: { container: 'h-[40px] px-md gap-xs',  typo: 'typo-button',    iconSize: 'sm' },
  lg: { container: 'h-[64px] px-md gap-sm',  typo: 'typo-button-lg',       iconSize: 'md' },
}

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  onClick,
  className = '',
}: ButtonProps) {
  const s = sizeStyles[size]
  const iconEl = Icon ? <Icon size={iconSizes[s.iconSize]} className="shrink-0" /> : null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center radius-full cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${s.container} ${s.typo} ${className}`}
    >
      {Icon && iconPosition === 'left' && iconEl}
      {label}
      {Icon && iconPosition === 'right' && iconEl}
    </button>
  )
}
