// Linha de indicador no AgendaCard refatorado (estilo dark): label à esquerda,
// valor + IndicatorBar à direita, divider abaixo. Hover na linha mostra
// tooltip com a descrição do indicador (quando disponível).

import type { StatusType } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'
import Tooltip from '@/components/ui/Tooltip'
import { indicatorInfo } from '@/data/indicators/descriptions/indicators'

interface AgendaIndicatorProps {
  id?: string
  label: string
  value: string | number
  status: StatusType
  segmentLabels?: [string, string, string]
}

export default function AgendaIndicator({
  id,
  label,
  value,
  status,
  segmentLabels,
}: AgendaIndicatorProps) {
  const info = id ? indicatorInfo[id] : undefined

  const row = (
    <div
      className={`flex items-start gap-md w-full ${info ? 'cursor-help' : ''}`}
    >
      <span className="flex-1 typo-body-sm">{label}</span>
      <div className="w-[145px] flex flex-col gap-2xs">
        <span className="typo-body-sm-bold text-right">{value}</span>
        <IndicatorBar status={status} segmentLabels={segmentLabels} />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-sm w-full">
      {info ? (
        <Tooltip
          followCursor
          trackingKey={`indicador_descricao:${id ?? label}`}
          content={
            <span className="flex flex-col gap-2xs">
              <span className="typo-body-sm-bold">{label}</span>
              <span className="typo-body-sm">{info}</span>
            </span>
          }
          width={320}
        >
          {row}
        </Tooltip>
      ) : (
        row
      )}
      <div className="divider" />
    </div>
  )
}
