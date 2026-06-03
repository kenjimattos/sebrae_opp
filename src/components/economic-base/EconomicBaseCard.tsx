import { economicBaseDescriptions } from '@/data/indicators/descriptions/economic-base'

interface EconomicBaseCardProps {
  id: string
  label: string
  value: string
  variation: string
  updatedAt?: string
  className?: string
}

export default function EconomicBaseCard({ id, label, value, variation, updatedAt = '', className = '' }: EconomicBaseCardProps) {
  const description = economicBaseDescriptions[id]

  return (
    <main
      className={`flex flex-col border p-sm justify-between gap-sm ${className}`}
    >
        <span className="typo-body-sm uppercase mt-sm">
          {label}
        </span>
        <div className="flex justify-between gap-sm">
          <span className="typo-display-sm">
            {value}
          </span>
          <span className="typo-body-sm-bold">
            {variation}
          </span>
        </div>
        <span className="typo-body-sm">
          {description}
        </span>
        <span className="typo-body-sm text-right align-self-end">
          {updatedAt}
        </span>
    </main>
  )
}
