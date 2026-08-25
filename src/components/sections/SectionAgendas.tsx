// /new — protótipo do novo design (Figma 1395:2142).
// Layout: Header + área principal com container esquerdo (rounded-[25px],
// bg translúcido) contendo heading + lista de agendas, e mapa à direita
// com MapModeToggle no topo e AgendaCard flutuante no canto inferior.

import { useState } from 'react'
import type { Indicator } from '@/types/indicators'
import AgendaList from '@/components/agenda/AgendaList'
import AgendaCard from '@/components/agenda/AgendaCard'
import IndicatorModal from '@/components/agenda/IndicatorModal'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'
import CitySelector from '@/components/layout/CitySelector'

export default function SectionAgendas() {
  const { municipality, municipalities, setMunicipality, loading } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    agendas[0]?.id ?? 'governanca',
  )
  // Indicador com modal "IA" aberto (clique no label dentro do AgendaCard).
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)

  const selectedAgenda =
    agendas.find((a) => a.id === selectedAgendaId) ?? agendas[0]

  const hasSelection = municipality.data != null

  function handleMapSelect(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (match) setMunicipality(match.id, match.name, 'map')
  }

  // Estado inicial: sem município selecionado, exibimos apenas o mapa e o
  // CitySelector. A lista de agendas e o card só aparecem após a seleção
  // (ou enquanto os dados do município recém-selecionado carregam).
  if (!hasSelection) {
    return (
      <section className="section-container">
        <div className="flex flex-col gap-xs items-center">
          <CitySelector />
          <p className="typo-body">{loading ? 'Carregando indicadores…' : 'ou clique no mapa'}</p>
        </div>
        <div className="flex w-full px-xl">
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
          <div className="flex flex-col w-[40%] min-w-0 shrink-0 glass p-md rounded gap-md">
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
          <div className="flex flex-1 min-w-0 flex-col gap-md">
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
                onIndicatorClick={setSelectedIndicator}
                className=''
              />
            )}
          </div>
        </div>
        {selectedIndicator && (
          <IndicatorModal
            // Remount por indicador+município: reinicia o thread e o typewriter.
            key={`${selectedIndicator.id ?? selectedIndicator.label}:${municipality.id}`}
            indicator={selectedIndicator}
            open
            onClose={() => setSelectedIndicator(null)}
          />
        )}
      </section>
  )
}
