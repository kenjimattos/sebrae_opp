// Figma: Section/Panorama (390:578)
// Mapa com seletor de indicadores da agenda + média + legenda de status

import { useState } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import Dropdown from '@/components/ui/Dropdown'
import InsetBar from '@/components/ui/InsetBar'
import ParaibaMap from '@/components/map/ParaibaMap'
import PanoramaLegend from '@/components/panorama/PanoramaLegend'
import PanoramaMediaInfo from '@/components/panorama/PanoramaMediaInfo'
import { useMunicipality } from '@/hooks/useMunicipality'
import { usePanoramaIndicators } from '@/hooks/usePanoramaIndicators'
import { usePanoramaMedia } from '@/hooks/usePanoramaMedia'
import { sectionContent } from '@/data/home/sections'
import type { IndicatorKey } from '@/data/indicators/map-data'
import { catalog } from '@/data/indicators/catalog'
import { trackEvent } from '@/utils/analytics'

const defaultIndicatorId = catalog.agendas[0].indicators[0].id

export default function SectionPanorama() {
  const { municipality } = useMunicipality()
  const [indicator, setIndicator] = useState<IndicatorKey>(defaultIndicatorId)
  const dropdownOptions = usePanoramaIndicators()
  const mediaInfo = usePanoramaMedia(indicator, municipality.id)

  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.panorama.title}
        description={sectionContent.panorama.description}
      />

      <Card as="section" padding="lg" className="flex flex-col gap-lg min-h-[35dvh]">
        <InsetBar label={sectionContent.panorama.labels.indicadorNoMapa}>
          <Dropdown
            options={dropdownOptions}
            value={indicator}
            onChange={(v) => {
              trackEvent('indicador_mapa_alterado', { indicador: v })
              setIndicator(v as IndicatorKey)
            }}
          />
        </InsetBar>
        <section className="flex flex-col gap-sm">
        {mediaInfo && (
          <PanoramaMediaInfo
            count={mediaInfo.count}
            formatted={mediaInfo.formatted}
            municipalityName={municipality.name}
            municipalityFormatted={mediaInfo.municipalityFormatted}
            highestFormatted={mediaInfo.highestFormatted}
            highestMunicipalityName={mediaInfo.highestMunicipalityName}
          />
        )}

        <PanoramaLegend />

        <ParaibaMap
          selectedId={municipality.id}
          indicador={indicator}
        />
        </section>
      </Card>
    </SectionContainer>
  )
}
