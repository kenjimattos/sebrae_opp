// Linhas de AgendaIndicator separadas por divisor tracejado — o miolo do
// AgendaIndicatorItem (modo Eixos), dentro do AgendaExpandable. A casca
// (título, borda, descrição, recolher/expandir) é do item; aqui mora só a lista.

import type { Indicator } from '@/types/indicators'
import AgendaIndicator from '@/components/agenda/AgendaIndicator'
import { classifiedValue } from '@/utils/indicatorBar'

interface AgendaIndicatorListProps {
  indicators: Indicator[]
  /** Quando presente, o label de cada linha abre o modal "IA" do indicador. */
  onIndicatorClick?: (indicator: Indicator) => void
  className?: string
}

export default function AgendaIndicatorList({
  indicators,
  onIndicatorClick,
  className = '',
}: AgendaIndicatorListProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {indicators.map((ind, i) => {
        const first = i === 0
        const last = i === indicators.length - 1
        return (
          <div key={ind.id ?? ind.label} className="flex flex-col">
            <AgendaIndicator
              id={ind.id}
              label={ind.label}
              value={ind.value}
              numericValue={classifiedValue(ind)}
              status={ind.status}
              threshold={ind.threshold}
              onLabelClick={onIndicatorClick && (() => onIndicatorClick(ind))}
              className={`${first ? '' : 'pt-sm'} ${last ? '' : 'pb-sm'}`}
            />
            {!last && <hr className="border-accent border-dashed" />}
          </div>
        )
      })}
    </div>
  )
}
