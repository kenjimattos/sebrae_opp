// Figma: Buttons pill variant (817:3129)
// Pill-shaped button with label + arrow icon in circle — used for CTAs

import { ArrowRight } from '@/components/icons'
import { ICON_SIZES } from '@/constants/icons'

interface PillButtonProps {
  label: string
  href: string
  className?: string
}

export default function PillButton({ label, href, className = '' }: PillButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-md bg-surface-secondary radius-full pl-md pr-xs py-xs h-[64px] w-[340px] no-underline transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] outline-none ${className}`}
    >
      <span className="flex-1 typo-button">
        {label}
      </span>
      <span className="flex items-center justify-center w-[48px] h-[48px] bg-surface radius-full shrink-0">
        <ArrowRight size={ICON_SIZES.lg} />
      </span>
    </a>
  )
}
