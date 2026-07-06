// Card flutuante sobre o mapa na /new. Reproduz o "dados agenda" do Figma:
// micro-título Monoblock acima do box, box semi-transparente com borda branca
// contendo 3 linhas de indicador separadas por divisor, descrição Monoblock
// abaixo do box.

import type { Indicator } from '@/types/indicators'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'

interface AgendaCardProps {
  title: string
  indicators: Indicator[]
  description?: string
  className?: string
}

export default function AgendaCard({
  title,
  indicators,
  description,
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

        <div className="border border-white flex flex-col p-sm w-full">
          {indicators.map((ind, i) => (
            <div key={ind.id ?? ind.label} className="flex flex-col">
              <AgendaIndicator
                id={ind.id}
                label={ind.label}
                value={ind.value}
                status={ind.status}
                threshold={ind.threshold}
                className={`${i < indicators.length - 1 ? 'pb-xs' : ''}`}
              />

              {i < indicators.length - 1 && (
                <hr className="border-accent border-dashed pb-xs" />
              )}
            </div>
          ))}
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
