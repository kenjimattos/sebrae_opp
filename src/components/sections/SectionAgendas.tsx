// /new — protótipo do novo design (Figma 1395:2142).
// Layout: Header + área principal com container esquerdo (rounded-[25px],
// bg translúcido) contendo heading + lista de agendas, e mapa à direita
// com MapModeToggle no topo e AgendaCard flutuante no canto inferior.

import { useState } from 'react'
import AgendaList from '@/components/agenda/AgendaList'
import AgendaCard from '@/components/agenda/AgendaCard'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'
import SectionContainer from '@/components/ui/SectionContainer'
import municipios from '@/data/indicators/municipalities.json'
import CitySelector from '@/components/layout/CitySelector'

export default function New() {
  const { municipality, setMunicipality } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    agendas[0]?.id ?? 'governanca',
  )

  const selectedAgenda =
    agendas.find((a) => a.id === selectedAgendaId) ?? agendas[0]

  return (
    <SectionContainer className="items-center gap-md">
      <CitySelector />
      <div className="flex flex-1 min-h-0 gap-md">
          {/* Coluna esquerda: container rounded com heading + agendas */}
          <div className="flex flex-[2] min-w-0 flex-col glass p-md rounded-md h-full gap-md">
           <div>
              <h1
                className="typo-h1"
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
        <div className="flex-[3] flex flex-col">
          <div className="flex-col-start h-full gap-sm">
            <ParaibaOutlineMap
              selectedId={municipality.id}
              onSelect={(id) => {
                const match = municipios.find((m) => m.id === id)
                if (match) setMunicipality(match.id, match.name, 'map')
              }}
            />
          </div>
          {selectedAgenda && (
              <AgendaCard
                title={selectedAgenda.name}
                indicators={selectedAgenda.indicators.slice(0, 3)}
                description={agendaObjectives[selectedAgenda.id]}
                className=''
              />
          )}
        </div>
      </div>
      </SectionContainer>
  )
}
