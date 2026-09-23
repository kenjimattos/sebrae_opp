// Linhas de AgendaIndicator separadas por divisor tracejado. Miolo comum do
// AgendaCard (flutuante, sobre o mapa) e do AgendaIndicatorItem (modo Eixos,
// dentro do AgendaExpandable) — os dois traziam este bloco copiado, e o
// comentário de um deles já dizia "mesmo tratamento do AgendaCard flutuante".
//
// O que os cards não compartilham é a casca: título, borda, descrição e
// recolher/expandir são de cada um. Aqui mora só a lista.

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
        const last = i === indicators.length - 1
        return (
          <div key={ind.id ?? ind.label} className="flex flex-col">
            <AgendaIndicator
              id={ind.id}
              label={ind.label}
              value={ind.value}
              // O número da RÉGUA, não o exibido: numa faixa relativa per
              // capita, `value` é "70.626" e o corte é 44,5/1k hab.
              numericValue={classifiedValue(ind)}
              status={ind.status}
              threshold={ind.threshold}
              onLabelClick={onIndicatorClick && (() => onIndicatorClick(ind))}
              className={last ? '' : 'pb-xs'}
            />
            {!last && <hr className="border-accent border-dashed pb-xs" />}
          </div>
        )
      })}
    </div>
  )
}
