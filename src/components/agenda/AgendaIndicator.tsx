// Linha de indicador no AgendaCard floating: label (Intel One Mono 14px) à
// esquerda, valor grande (Intel One Mono Bold 18px) ao centro-direita, barra
// rainbow (145px) com marcador e rótulos de zona à direita.

import type { StatusType } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'

interface AgendaIndicatorProps {
  id?: string
  label: string
  value: string | number
  status: StatusType
  segmentLabels?: [string, string, string]
}

export default function AgendaIndicator({
  label,
  value,
  status,
  segmentLabels = ['> 4.0', '> 4.0', '> 4.0'],
}: AgendaIndicatorProps) {
  return (
    <div className="flex items-center gap-lg w-full">
      <span
        className="flex-1 typo-body text-white"
      >
        {label}
      </span>
      <div className="flex items-center gap-sm">
        <span className="typo-display-sm text-white" >
          {value}
        </span>
        <IndicatorBar status={status} segmentLabels={segmentLabels} />
      </div>
    </div>
  )
}
