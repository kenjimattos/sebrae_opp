// Figma: Buttons pill variant (817:3129)
// Pill-shaped button with label + arrow icon in circle — used for CTAs

import { ArrowRight } from 'lucide-react'

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
      className={`inline-flex items-center gap-[var(--spacing-md)] bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] pl-[var(--spacing-md)] pr-[var(--spacing-xs)] py-[var(--spacing-xs)] h-[64px] w-[340px] no-underline transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] outline-none ${className}`}
    >
      <span className="flex-1 typo-button">
        {label}
      </span>
      <span className="flex items-center justify-center w-[48px] h-[48px] bg-[var(--semantic-surface-primary)] rounded-full shrink-0">
        <ArrowRight size={24} />
      </span>
    </a>
  )
}
