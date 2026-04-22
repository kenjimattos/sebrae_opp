// Figma: Agenda/Indicator (300:32)
// Single indicator row: label + badge. Hover reveals a tooltip (portaled to
// <body>, positioned to the right of the cursor) with the indicator
// description (from `indicador-info.ts`).

import type { StatusType } from '@/types/indicadores'
import AgendaBadge from '@/components/agenda/AgendaBadge'
import Tooltip from '@/components/ui/Tooltip'
import { indicadorInfo } from '@/data/indicadores/descricoes/indicadores'

interface AgendaIndicatorProps {
  id?: string
  label: string
  valor: string | number
  status: StatusType
}

export default function AgendaIndicator({ id, label, valor, status }: AgendaIndicatorProps) {
  const info = id ? indicadorInfo[id] : undefined

  const row = (
    <div
      className={`flex items-center gap-md px-xs w-full ${info ? 'cursor-help' : ''}`}
    >
      <span className="flex-1 typo-body-sm">{label}</span>
      <AgendaBadge status={status} value={valor} />
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
