// Figma: Buttons (set 378:477)
// Variants: primary, secondary, tertiary, ghost | Sizes: sm (24px), md (40px), lg (64px)
//
// Button always renders a <button>. For icon-only buttons use IconButton.
// Icon is optional; when provided, it sits left or right of the label (default 'right').

import { iconSizes, type LucideIcon } from '@/components/icons'
import { buttonVariantStyles, buttonBaseClass, buttonSizeStyles } from './button-styles'

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
  const s = buttonSizeStyles[size]
  const iconEl = Icon ? <Icon size={iconSizes[s.iconSize]} className="shrink-0" /> : null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${buttonBaseClass} ${buttonVariantStyles[variant]} ${s.container} ${s.typo} ${className} rounded-full w-fit`}
    >
      {Icon && iconPosition === 'left' && iconEl}
      {label}
      {Icon && iconPosition === 'right' && iconEl}
    </button>
  )
}
