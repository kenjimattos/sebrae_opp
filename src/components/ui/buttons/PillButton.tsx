// Figma: Buttons pill variant (817:3129)
// Pill-shaped CTA: <a> com label + seta em círculo (decorativo).
//
// Variants: primary (bg accent + círculo surface)
//           secondary (bg surface-secondary + círculo surface)
//           ghost (shell transparente + círculo surface-secondary)
// Sizes:    sm (24px) | md (40px) | lg (64px com shell preenchido + círculo 40px)
// iconPosition: 'right' (default) | 'left' — inverte posição e direção da seta.
//
// O círculo é <span> decorativo (não IconButton): <button> dentro de <a>
// é HTML inválido. O clique alvo é o próprio <a>.

import { ArrowLeft, ArrowRight, iconSizes, type IconSize } from '@/components/icons'

interface PillButtonProps {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  iconPosition?: 'left' | 'right'
  className?: string
}

const variantStyles: Record<string, { shellBg: string; circleBg: string }> = {
  primary:   { shellBg: 'bg-accent',            circleBg: 'bg-surface' },
  secondary: { shellBg: 'bg-surface-secondary', circleBg: 'bg-surface' },
  ghost:     { shellBg: '',                     circleBg: 'bg-surface-secondary' },
}

interface SizeStyle {
  shell: string
  paddingRight: string
  paddingLeft: string
  typoPrimary: string
  typoSecondary: string
  circle: string
  iconSize: IconSize
}

const sizeStyles: Record<string, SizeStyle> = {
  sm: {
    shell: 'h-[24px] gap-sm',
    paddingRight: 'pl-sm',
    paddingLeft: 'pr-sm',
    typoPrimary: 'typo-button-sm',
    typoSecondary: 'typo-button-secondary-sm',
    circle: 'w-[24px] h-[24px]',
    iconSize: 'xs',
  },
  md: {
    shell: 'h-[40px] gap-sm',
    paddingRight: 'pl-sm pr-2xs',
    paddingLeft: 'pl-2xs pr-sm',
    typoPrimary: 'typo-button',
    typoSecondary: 'typo-button-secondary',
    circle: 'w-[32px] h-[32px]',
    iconSize: 'md',
  },
  lg: {
    shell: 'py-xs gap-md',
    paddingRight: 'pl-md pr-xs',
    paddingLeft: 'pl-xs pr-md',
    typoPrimary: 'typo-button',
    typoSecondary: 'typo-button-secondary',
    circle: 'w-[40px] h-[40px]',
    iconSize: 'lg',
  },
}

export default function PillButton({
  label,
  href,
  variant = 'primary',
  size = 'lg',
  iconPosition = 'right',
  className = '',
}: PillButtonProps) {
  const s = sizeStyles[size]
  const v = variantStyles[variant]
  const typo = variant === 'primary' ? s.typoPrimary : s.typoSecondary
  const padding = iconPosition === 'right' ? s.paddingRight : s.paddingLeft
  const Arrow = iconPosition === 'right' ? ArrowRight : ArrowLeft
  const isInternal = href.startsWith('/') && !href.startsWith('//')
  const externalProps = isInternal
    ? {}
    : { target: '_blank', rel: 'noopener noreferrer' }

  const labelEl = <span className={`flex-1 ${typo}`}>{label}</span>
  const circleEl = (
    <span
      aria-hidden
      className={`flex items-center justify-center shrink-0 radius-full ${s.circle} ${v.circleBg}`}
    >
      <Arrow size={iconSizes[s.iconSize]} />
    </span>
  )

  return (
    <a
      href={href}
      {...externalProps}
      className={`inline-flex items-center radius-full no-underline transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] outline-none ${v.shellBg} ${s.shell} ${padding} ${className}`}
    >
      {iconPosition === 'left' ? (
        <>
          {circleEl}
          {labelEl}
        </>
      ) : (
        <>
          {labelEl}
          {circleEl}
        </>
      )}
    </a>
  )
}
