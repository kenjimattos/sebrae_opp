// Linha de indicador no AgendaCard floating: label (font-body 14px) à
// esquerda, valor grande (font-body bold 18px) ao centro-direita, barra
// rainbow (145px) com marcador e rótulos de zona à direita.

import type { StatusType } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'

interface AgendaIndicatorProps {
  id?: string
  label: string
  value: string | number
  status: StatusType
  segmentLabels?: [string, string, string]
  className?: string
}

export default function AgendaIndicator({
  label,
  value,
  status,
  segmentLabels = ['MIN', 'MED', 'MAX'],
  className = '',
}: AgendaIndicatorProps) {
  return (
    <div className={`flex items-center gap-md ${className}`}>
      <span
        className="flex-1 typo-body"
      >
        {label}
      </span>
      <div className="flex-col-start items-center gap-xs">
        <span className="typo-body-lg-bold text-white" >
          {value}
        </span>
        <IndicatorBar status={status} segmentLabels={segmentLabels} />
      </div>
    </div>
  )
}
