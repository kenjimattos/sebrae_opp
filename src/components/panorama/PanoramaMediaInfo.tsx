// State average display for the selected indicator

import { sectionContent } from '@/data/home/sections'

const { labels: panoramaLabels } = sectionContent.panorama

interface PanoramaMediaInfoProps {
  count: number
  formatted: string
  municipalityName: string
  municipalityFormatted: string | null
  highestFormatted: string
  highestMunicipalityName: string
}

export default function PanoramaMediaInfo({
  formatted,
  municipalityName,
  municipalityFormatted,
  highestFormatted,
  highestMunicipalityName
}: PanoramaMediaInfoProps) {
  return (
    <div className="flex items-center gap-lg flex-wrap">
      {municipalityFormatted && (
        <div className="flex-center gap-xs">
          <span className="typo-body">
            {municipalityName}:
          </span>
          <span className="typo-body-bold">
            {municipalityFormatted}
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
          {highestFormatted} ({highestMunicipalityName})
        </span>
      </div>
    </div>
  )
}
