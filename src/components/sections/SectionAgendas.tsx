// /new — protótipo do novo design (Figma 1395:2142).
// Layout: Header + área principal com container esquerdo (rounded-[25px],
// bg translúcido) contendo heading + lista de agendas, e mapa à direita
// com MapModeToggle no topo e AgendaCard flutuante no canto inferior.

import { useState } from 'react'
import AgendaList from '@/components/agenda/AgendaList'
import AgendaCard from '@/components/agenda/AgendaCard'
import MapModeToggle, { type MapMode } from '@/components/map/MapModeToggle'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'
import SectionContainer from '@/components/ui/SectionContainer'

export default function New() {
  const { municipality, setMunicipality } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    agendas[0]?.id ?? 'governanca',
  )
  const [mapMode, setMapMode] = useState<MapMode>('municipio')

  const selectedAgenda =
    agendas.find((a) => a.id === selectedAgendaId) ?? agendas[0]

  return (
    <SectionContainer className="!flex-row items-center">
          {/* Coluna esquerda: container rounded com heading + agendas */}
          <div className="flex-col-start w-[120dvh] gap-lg p-md glass rounded-md h-full">
           <div>
              <h1
                className="typo-h1 text-white"
              >
                Indicadores
              </h1>
              <span className='typo-body'>para um município mais empreendedor</span>
            </div>
            <AgendaList
              agendas={agendas}
              descriptions={agendaObjectives}
              selectedId={selectedAgendaId}
              onSelect={setSelectedAgendaId}
            />
          </div>

        {/* Coluna direita: mapa + overlays */}
        <div className="flex-col-start items-center gap-lg w-full h-full">
          <MapModeToggle value={mapMode} onChange={setMapMode} />
          <ParaibaOutlineMap
            className="w-full h-auto"
            selectedId={municipality.id}
            onSelect={(id) => setMunicipality(id, '', 'map')}
          />
          {selectedAgenda && (
              <AgendaCard
                title={selectedAgenda.name}
                indicators={selectedAgenda.indicators.slice(0, 3)}
                description={agendaObjectives[selectedAgenda.id]}
              />
          )}
      </div>
      </SectionContainer>
  )
}
