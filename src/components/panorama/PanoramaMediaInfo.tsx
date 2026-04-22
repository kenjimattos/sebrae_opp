// State average display for the selected indicator

import { sectionContent } from '@/data/home/sections'

const { labels: panoramaLabels } = sectionContent.panorama

interface PanoramaMediaInfoProps {
  count: number
  formatted: string
  municipioNome: string
  municipioFormatted: string | null
  maiorFormatted: string
  maiorMunicipioNome: string
}

export default function PanoramaMediaInfo({
  formatted,
  municipioNome,
  municipioFormatted,
  maiorFormatted,
  maiorMunicipioNome
}: PanoramaMediaInfoProps) {
  return (
    <div className="flex items-center gap-lg flex-wrap">
      {municipioFormatted && (
        <div className="flex-center gap-xs">
          <span className="typo-body">
            {municipioNome}:
          </span>
          <span className="typo-body-bold">
            {municipioFormatted}
          </span>
        </div>
      )}
      <div className="flex-center gap-xs">
        <span className="typo-body">
          {panoramaLabels.mediaEstadual}:
        </span>
        <span className="typo-body-bold">
          {formatted}
        </span>
      </div>
      <div className="flex-center gap-xs">
        <span className="typo-body">
          {panoramaLabels.maior}:
        </span>
        <span className="typo-body-bold">
          {maiorFormatted} ({maiorMunicipioNome})
        </span>
      </div>
    </div>
  )
}
