// State average display for the selected indicator

import { panoramaLabels } from '@/data/labels'

interface PanoramaMediaInfoProps {
  count: number
  formatted: string
  municipioNome: string
  municipioFormatted: string | null
  maiorFormatted: string
}

export default function PanoramaMediaInfo({
  count,
  formatted,
  municipioNome,
  municipioFormatted,
  maiorFormatted,
}: PanoramaMediaInfoProps) {
  return (
    <div className="flex items-center gap-lg flex-wrap">
      {municipioFormatted && (
        <div className="flex-center gap-xs">
          <span className="typo-body-sm text-inactive">
            {municipioNome}:
          </span>
          <span className="typo-body-bold text-[color:var(--semantic-accent)]">
            {municipioFormatted}
          </span>
        </div>
      )}
      <div className="flex-center gap-xs">
        <span className="typo-body-sm text-inactive">
          {panoramaLabels.mediaEstadual} ({count} municípios):
        </span>
        <span className="typo-body-bold">
          {formatted}
        </span>
      </div>
      <div className="flex-center gap-xs">
        <span className="typo-body-sm text-inactive">
          {panoramaLabels.maior}:
        </span>
        <span className="typo-body-bold">
          {maiorFormatted}
        </span>
      </div>
    </div>
  )
}
