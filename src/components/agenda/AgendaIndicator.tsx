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
    <div className="flex items-center w-full">
      <span
        className="flex-1 text-[14px] leading-normal text-white"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      <span
        className="text-[18px] font-bold leading-normal text-white w-[71px] text-left ml-auto"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {value}
      </span>
      <div className="w-[145px] shrink-0">
        <IndicatorBar status={status} segmentLabels={segmentLabels} />
      </div>
    </div>
  )
}
