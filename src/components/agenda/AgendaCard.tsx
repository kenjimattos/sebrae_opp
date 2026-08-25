// Card flutuante sobre o mapa, na SectionAgendas. Reproduz o "dados agenda" do Figma:
// micro-título Monoblock acima do box, box semi-transparente com borda branca
// contendo 3 linhas de indicador separadas por divisor, descrição Monoblock
// abaixo do box.

import type { Indicator } from '@/types/indicators'
import AgendaIndicatorList from '@/components/agenda/AgendaIndicatorList'

interface AgendaCardProps {
  title: string
  indicators: Indicator[]
  description?: string
  /** Clique no label de um indicador (abre o modal "IA" do indicador). */
  onIndicatorClick?: (indicator: Indicator) => void
  className?: string
}

export default function AgendaCard({
  title,
  indicators,
  description,
  onIndicatorClick,
  className = '',
}: AgendaCardProps) {
  return (
    <div className={`flex-col-start items-center h-auto ${className}`}>
      <div className="flex-col-start w-4/5 gap-xs">
        <p
          className="typo-body-xs"
        >
          {title}
        </p>

        <div className="border border-text-primary p-sm w-full bg-surface">
          <AgendaIndicatorList
            indicators={indicators}
            onIndicatorClick={onIndicatorClick}
          />
        </div>

        {description && (
          <p
            className="typo-body-xs"
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
