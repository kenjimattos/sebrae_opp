// Barra de classificação contínua (red → yellow → green) com marcador
// quadrado posicionado pela zona do status. Usada no AgendaCard floating.

import type { StatusType } from '@/types/indicators'

interface IndicatorBarProps {
  status: StatusType
  /** Rótulos opcionais por segmento (ex.: ["< 4.0", "4.0–7.0", "> 7.0"]). */
  segmentLabels?: [string, string, string]
  className?: string
}

const MARKER: Record<
  StatusType,
  { color: string; leftPct: number }
> = {
  alert:   { color: '#F14635', leftPct: 16.6 },
  warning: { color: '#F5E421', leftPct: 50 },
  success: { color: '#40E629', leftPct: 83.4 },
}

const BAR_GRADIENT =
  'linear-gradient(to right, #F13737 0%, #F6EE1F 53.365%, #40E629 100%)'

export default function IndicatorBar({
  status,
  segmentLabels,
  className = '',
}: IndicatorBarProps) {
  const marker = MARKER[status]

  return (
    <div className={`flex flex-col gap-[6px] w-full ${className}`}>
      <div className="relative h-[4px] w-full" style={{ background: BAR_GRADIENT }}>
        <div
          className="absolute size-[9px] top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${marker.leftPct}%`, background: marker.color }}
        />
      </div>
      {segmentLabels && (
        <div className="grid grid-cols-3">
          {segmentLabels.map((label, i) => (
            <span
              key={i}
              className="text-[8px] leading-none text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
