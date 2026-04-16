// Figma: Buttons (set 378:477)
// Variants: primary, secondary, tertiary | Sizes: sm (24px), md (40px), lg (64px)

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary'
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
}

const sizeStyles: Record<string, string> = {
  sm: 'h-[24px] px-2xs py-2xs typo-body-sm-bold',
  md: 'h-[40px] px-md py-sm typo-button-sm',
  lg: 'h-[64px] px-md py-xs typo-button',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center radius-full cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  )
}
