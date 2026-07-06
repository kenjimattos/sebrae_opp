// Barra de classificação contínua (red → yellow → green) com marcador
// quadrado posicionado pela zona do status. Usada no AgendaCard floating.
//
// Indicador sem faixa oficial (status 'none'): a barra NÃO some — fica
// invisível (`invisible`) mantendo o mesmo espaço (largura do gutter + altura
// da barra + rótulos). Assim o valor continua centralizado e o layout do
// AgendaIndicator segue equilibrado. Ver decisão em CHANGELOG.

import type { StatusType } from '@/types/indicators'

interface IndicatorBarProps {
  status: StatusType
  /** Rótulos opcionais por segmento (ex.: ["< 4.0", "4.0–7.0", "> 7.0"]). */
  segmentLabels?: [string, string, string]
  className?: string
}

const MARKER: Record<
  Exclude<StatusType, 'none'>,
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
  // Sem faixa oficial: mantém o espaço (invisível), sem marcador.
  const empty = status === 'none'
  const marker = empty ? undefined : MARKER[status]

  return (
    <div
      className={`flex flex-col gap-xs w-[var(--spacing-gutter)] ${empty ? 'invisible' : ''} ${className}`}
      aria-hidden={empty || undefined}
    >
      <div className="relative h-[var(--spacing-2xs)] w-full" style={{ background: BAR_GRADIENT }}>
        {marker && (
          <div
            className="absolute size-[var(--spacing-sm)] top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.leftPct}%`, background: marker.color }}
          />
        )}
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
