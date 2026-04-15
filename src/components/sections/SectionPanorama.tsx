// Figma: Section/Panorama (390:578)
// Mapa com seletor de indicadores da agenda + média + legenda de status

import { useState } from 'react'
import SectionContainer from '@/components/ui/SectionContainer'
import SectionCard from '@/components/ui/SectionCard'
import SectionHeader from '@/components/SectionHeader'
import Dropdown from '@/components/ui/Dropdown'
import ParaibaMap from '@/components/ParaibaMap'
import PanoramaLegend from '@/components/panorama/PanoramaLegend'
import PanoramaMediaInfo from '@/components/panorama/PanoramaMediaInfo'
import { useMunicipio } from '@/hooks/useMunicipio'
import { usePanoramaIndicadores } from '@/hooks/usePanoramaIndicadores'
import { usePanoramaMedia } from '@/hooks/usePanoramaMedia'
import { sectionContent } from '@/data/sections'
import type { IndicadorKey } from '@/data/mapa-indicadores'

export default function SectionPanorama() {
  const { municipio } = useMunicipio()
  const [indicador, setIndicador] = useState<IndicadorKey>('governanca_cfa')
  const dropdownOptions = usePanoramaIndicadores()
  const mediaInfo = usePanoramaMedia(indicador)

  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.panorama.title}
        description={sectionContent.panorama.description}
      />

      <SectionCard padding="md" className="flex flex-col gap-md">
        {/* Header: label + dropdown */}
        <div className="flex-between">
          <span className="typo-body-bold">
            Indicador no mapa
          </span>
          <Dropdown
            options={dropdownOptions}
            value={indicador}
            onChange={(v) => setIndicador(v as IndicadorKey)}
            className="w-[240px]"
          />
        </div>

        {mediaInfo && (
          <PanoramaMediaInfo count={mediaInfo.count} formatted={mediaInfo.formatted} />
        )}

        <PanoramaLegend />

        <ParaibaMap
          selectedId={municipio.id}
          indicador={indicador}
        />
      </SectionCard>
    </SectionContainer>
  )
}
