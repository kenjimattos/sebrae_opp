// Figma: Buttons pill variant (817:3129)
// Pill-shaped CTA: <a> with label + decorative arrow in circle (trailing).
//
// O círculo da seta é renderizado como <span> (decorativo) — não é um
// IconButton porque <button> dentro de <a> é HTML inválido. O clique
// alvo é o próprio <a>.
//
// Sizes:
// - sm: h-[24px], shell transparente, círculo 24×24 bg-surface-secondary, seta 12px
// - md: h-[40px], shell transparente, círculo 24×24 bg-surface-secondary, seta 12px
// - lg: h-[64px] w-[340px], shell bg-surface-secondary, círculo 48×48 bg-surface, seta 24px

import { ArrowRight } from '@/components/icons'
import { ICON_SIZES, type IconSize } from '@/constants/icons'

interface PillButtonProps {
  label: string
  href: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles: Record<
  string,
  {
    shell: string
    typo: string
    shellBg: string
    circle: string
    circleBg: string
    iconSize: IconSize
  }
> = {
  sm: {
    shell: 'h-[24px] pl-sm gap-[12px]',
    typo: 'typo-button-sm',
    shellBg: '',
    circle: 'w-[24px] h-[24px]',
    circleBg: 'bg-surface-secondary',
    iconSize: 'xs',
  },
  md: {
    shell: 'h-[40px] pl-sm gap-[12px]',
    typo: 'typo-button-sm',
    shellBg: '',
    circle: 'w-[24px] h-[24px]',
    circleBg: 'bg-surface-secondary',
    iconSize: 'xs',
  },
  lg: {
    shell: 'h-[64px] w-[340px] pl-md pr-xs py-xs gap-md',
    typo: 'typo-button',
    shellBg: 'bg-surface-secondary',
    circle: 'w-[48px] h-[48px]',
    circleBg: 'bg-surface',
    iconSize: 'lg',
  },
}

export default function PillButton({
  label,
  href,
  size = 'lg',
  className = '',
}: PillButtonProps) {
  const s = sizeStyles[size]
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center radius-full no-underline transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] outline-none ${s.shellBg} ${s.shell} ${className}`}
    >
      <span className={`flex-1 ${s.typo}`}>{label}</span>
      <span
        aria-hidden
        className={`flex items-center justify-center shrink-0 radius-full ${s.circle} ${s.circleBg}`}
      >
        <ArrowRight size={ICON_SIZES[s.iconSize]} />
      </span>
    </a>
  )
}
