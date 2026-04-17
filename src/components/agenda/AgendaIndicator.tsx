// Figma: Agenda/Indicator (300:32)
// Single indicator row: label + badge. Hover reveals a tooltip (portaled to
// <body>, positioned to the right of the cursor) with the indicator
// description (from `indicador-info.ts`).

import type { StatusType } from '@/types/indicadores'
import AgendaBadge from '@/components/agenda/AgendaBadge'
import Tooltip from '@/components/ui/Tooltip'
import { indicadorInfo } from '@/data/indicador-info'

interface AgendaIndicatorProps {
  label: string
  valor: string | number
  status: StatusType
}

export default function AgendaIndicator({ label, valor, status }: AgendaIndicatorProps) {
  const info = indicadorInfo[label]

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
