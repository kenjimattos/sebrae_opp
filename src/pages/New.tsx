// /new — protótipo do novo design.
// Layout: Header + 2 colunas. Esquerda: AgendaList (accordion).
// Direita: ParaibaOutlineMap com MapModeToggle (overlay top) e AgendaCard
// (overlay bottom-right) refletindo a agenda selecionada.

import { useState } from 'react'
import Header from '@/components/layout/Header'
import AgendaList from '@/components/agenda/AgendaList'
import AgendaCard from '@/components/agenda/AgendaCard'
import MapModeToggle, { type MapMode } from '@/components/map/MapModeToggle'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'

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
    <div className="min-h-screen bg-primary">
      <Header />
      <main
        className="mx-auto w-full max-w-[1440px] grid grid-cols-[511px_1fr] gap-lg"
        style={{
          paddingLeft: 'var(--spacing-margin)',
          paddingRight: 'var(--spacing-margin)',
          paddingTop: 'var(--spacing-xl)',
        }}
      >
        <AgendaList
          heading="Conjunto de indicadores"
          agendas={agendas}
          descriptions={agendaObjectives}
          selectedId={selectedAgendaId}
          onSelect={setSelectedAgendaId}
        />

        <div className="relative">
          <ParaibaOutlineMap
            selectedId={municipality.id}
            onSelect={(id) => {
              // O nome do município é resolvido pelo provider a partir dos
              // dados carregados; basta passar o id + um placeholder.
              setMunicipality(id, '', 'map')
            }}
          />

          <div className="absolute top-md left-1/2 -translate-x-1/2 z-10">
            <MapModeToggle value={mapMode} onChange={setMapMode} />
          </div>

          {selectedAgenda && (
            <AgendaCard
              className="absolute bottom-md right-md w-[506px] z-10"
              title={selectedAgenda.name}
              indicators={selectedAgenda.indicators}
              description={agendaObjectives[selectedAgenda.id]}
            />
          )}
        </div>
      </main>
    </div>
  )
}
