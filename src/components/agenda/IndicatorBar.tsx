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
  alert:   { color: 'var(--semantic-alert)', leftPct: 16.6 },
  warning: { color: 'var(--semantic-warning)', leftPct: 50 },
  success: { color: 'var(--semantic-success)', leftPct: 83.4 },
}

const BAR_GRADIENT =
  'linear-gradient(to right, var(--semantic-alert) 0%, var(--semantic-warning) 53.365%, var(--semantic-success) 100%)'

export default function IndicatorBar({
  status,
  segmentLabels,
  className = '',
}: IndicatorBarProps) {
  const marker = MARKER[status]

  return (
    <div className={`flex flex-col gap-xs w-[var(--spacing-gutter)] ${className}`}>
      <div className="relative h-[var(--spacing-2xs)] w-full" style={{ background: BAR_GRADIENT }}>
        <div
          className="absolute size-[var(--spacing-sm)] top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${marker.leftPct}%`, background: marker.color }}
        />
      </div>
      {segmentLabels && (
        <div className="flex items-center justify-between w-full">
          {segmentLabels.map((label, i) => (
            <span
              key={i}
              className="typo-body-xs"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
