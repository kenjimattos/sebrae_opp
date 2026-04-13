// Figma: Buttons pill variant (817:3129)
// Pill-shaped button with label + arrow icon in circle — used for CTAs

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
      className={`inline-flex items-center gap-[var(--spacing-md)] bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] pl-[var(--spacing-md)] pr-[var(--spacing-xs)] py-[var(--spacing-xs)] h-[64px] w-[340px] no-underline ${className}`}
    >
      <span className="flex-1 font-semibold text-[length:var(--font-size-button)] leading-none text-[color:var(--semantic-text-primary)]">
        {label}
      </span>
      <span className="flex items-center justify-center w-[48px] h-[48px] bg-[var(--semantic-surface-primary)] rounded-full shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  )
}
