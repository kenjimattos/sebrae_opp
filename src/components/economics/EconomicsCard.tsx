// Figma: Economics/Card (563:4015)
// Metric card: icon (32x32) + label (uppercase) + large value + variation

interface EconomicsCardProps {
  label: string
  valor: string
  variacao: string
  icone?: string
  className?: string
}

const iconPaths: Record<string, React.ReactNode> = {
  'trending-up': (
    <path d="M2 12l5-5 4 4 7-7M15 4h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
  building: (
    <>
      <path d="M3 21V5a2 2 0 012-2h6a2 2 0 012 2v16" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M13 21V9a2 2 0 012-2h4a2 2 0 012 2v12" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M7 7h.01M7 11h.01M7 15h.01M17 11h.01M17 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M21 21v-1.5a3 3 0 00-2-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  'bar-chart': (
    <>
      <rect x="3" y="10" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="10" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="17" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
}

export default function EconomicsCard({ label, valor, variacao, icone, className = '' }: EconomicsCardProps) {
  return (
    <div
      className={`flex flex-col items-start justify-between bg-[var(--semantic-surface-primary)] border border-solid border-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] p-[var(--spacing-md)] h-[172px] w-[230px] ${className}`}
    >
      <div className="flex items-center gap-[var(--spacing-sm)] w-full">
        {icone && iconPaths[icone] && (
          <div className="shrink-0 size-[32px] rounded-full bg-[var(--semantic-surface-secondary)] flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[var(--semantic-text-primary)]"
            >
              {iconPaths[icone]}
            </svg>
          </div>
        )}
        <span className="typo-h4 text-[color:var(--semantic-text-primary)]">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="typo-display-sm text-[color:var(--semantic-text-primary)] max-w-[130px]">
          {valor}
        </span>
        <span className="typo-body-bold text-[color:var(--semantic-text-primary)]">
          {variacao}
        </span>
      </div>
    </div>
  )
}
