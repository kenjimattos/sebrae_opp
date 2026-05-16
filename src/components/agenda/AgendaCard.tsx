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
    <div className={`flex flex-col gap-sm w-full px-lg ${className}`}>
      <p
        className="typo-body-sm text-white"
      >
        {title}
      </p>

      <div className="border border-white px-md py-md flex flex-col">
        {indicators.map((ind, i) => (
          <div key={ind.id ?? ind.label} className="flex flex-col">
            <div className="py-sm">
              <AgendaIndicator
                id={ind.id}
                label={ind.label}
                value={ind.value}
                status={ind.status}
              />
            </div>
            {i < indicators.length - 1 && (
              <hr className="border-accent border-dashed" />
            )}
          </div>
        ))}
      </div>

      {description && (
        <p
          className="text-[8px] leading-normal text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {description}
        </p>
      )}
    </div>
  )
}
