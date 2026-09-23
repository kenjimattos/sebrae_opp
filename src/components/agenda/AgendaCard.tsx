// Card flutuante sobre o mapa, na SectionAgendas: um box com borda, contendo a
// lista de indicadores da agenda selecionada.
//
// Só a lista. O micro-título e a descrição da agenda saíram — a coluna esquerda
// da mesma seção (`AgendaList`) já nomeia e descreve a agenda escolhida, e o
// card repetia os dois a poucos centímetros dali. Quem quiser esses textos os
// lê de `agenda.name` e de `agendaObjectives`, que seguem vivos nos dois
// consumidores de lá (`AgendaList` e `ModeEixos`).

import type { Indicator } from '@/types/indicators'
import AgendaIndicatorList from '@/components/agenda/AgendaIndicatorList'

interface AgendaCardProps {
  indicators: Indicator[]
  /** Clique no label de um indicador (abre o modal "IA" do indicador). */
  onIndicatorClick?: (indicator: Indicator) => void
  className?: string
}

export default function AgendaCard({
  indicators,
  onIndicatorClick,
  className = '',
}: AgendaCardProps) {
  return (
    <div className={`flex-col-start items-center h-auto ${className}`}>
      <div className="flex-col-start w-[82%] gap-xs">
        <div className="border border-text-primary p-sm w-full bg-surface">
          <AgendaIndicatorList
            indicators={indicators}
            onIndicatorClick={onIndicatorClick}
          />
        </div>
      </div>
    </div>
  )
}
