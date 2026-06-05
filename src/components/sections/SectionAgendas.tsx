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
import municipios from '@/data/indicators/municipalities.json'
import CitySelector from '@/components/layout/CitySelector'

export default function SectionAgendas() {
  const { municipality, setMunicipality } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    agendas[0]?.id ?? 'governanca',
  )

  const selectedAgenda =
    agendas.find((a) => a.id === selectedAgendaId) ?? agendas[0]

  const hasSelection = municipality.data != null

  function handleMapSelect(id: string) {
    const match = municipios.find((m) => m.id === id)
    if (match) setMunicipality(match.id, match.name, 'map')
  }

  // Estado inicial: sem município selecionado, exibimos apenas o mapa e o
  // CitySelector. A lista de agendas e o card só aparecem após a seleção.
  if (!hasSelection) {
    return (
      <section className="section-container">
        <CitySelector />
        <div className="w-full">
          <ParaibaOutlineMap
            selectedId={municipality.id}
            onSelect={handleMapSelect}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section-container">
      <CitySelector />
      <div className="flex flex-1 min-h-0 gap-md">
          {/* Coluna esquerda: container rounded com heading + agendas */}
          <div className="flex flex-col w-[44%] glass p-md rounded-sm gap-md">
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
          <div className="flex flex-col gap-md">
            <div className="flex-col-start h-full px-md">
              <ParaibaOutlineMap
                padding={0}
                selectedId={municipality.id}
                onSelect={handleMapSelect}
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
      </section>
  )
}
