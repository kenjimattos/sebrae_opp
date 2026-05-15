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
    <div className={`flex flex-col gap-[6px] w-[506px] ${className}`}>
      <p
        className="text-[8px] leading-normal text-white"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>

      <div className="bg-[rgba(22,23,38,0.2)] border border-white px-md py-md flex flex-col">
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
              <div className="h-px bg-white/40" />
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
