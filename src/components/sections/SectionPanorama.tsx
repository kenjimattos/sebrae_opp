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
import { useMunicipio } from '@/hooks/useMunicipio'
import { usePanoramaIndicadores } from '@/hooks/usePanoramaIndicadores'
import { usePanoramaMedia } from '@/hooks/usePanoramaMedia'
import { sectionContent } from '@/data/sections'
import { panoramaLabels } from '@/data/labels'
import type { IndicadorKey } from '@/data/mapa-indicadores'

export default function SectionPanorama() {
  const { municipio } = useMunicipio()
  const [indicador, setIndicador] = useState<IndicadorKey>('governanca_cfa')
  const dropdownOptions = usePanoramaIndicadores()
  const mediaInfo = usePanoramaMedia(indicador, municipio.id)

  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.panorama.title}
        description={sectionContent.panorama.description}
      />

      <Card as="section" padding="lg" className="flex flex-col gap-md min-h-[35dvh]">
        <InsetBar label={panoramaLabels.indicadorNoMapa}>
          <Dropdown
            options={dropdownOptions}
            value={indicador}
            onChange={(v) => setIndicador(v as IndicadorKey)}
          />
        </InsetBar>

        {mediaInfo && (
          <PanoramaMediaInfo
            count={mediaInfo.count}
            formatted={mediaInfo.formatted}
            municipioNome={municipio.nome}
            municipioFormatted={mediaInfo.municipioFormatted}
            maiorFormatted={mediaInfo.maiorFormatted}
          />
        )}

        <PanoramaLegend />

        <ParaibaMap
          selectedId={municipio.id}
          indicador={indicador}
        />
      </Card>
    </SectionContainer>
  )
}
