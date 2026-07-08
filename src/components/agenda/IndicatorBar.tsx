// Barra de classificação contínua (red → yellow → green) com marcador quadrado.
//
// O marcador é GRADUAL: sua posição reflete o valor real dentro da faixa oficial
// (via `markerFraction`) e sua cor é a cor da própria barra naquele ponto — o
// cubo recebe o mesmo gradiente da barra, dimensionado à largura dela e deslocado
// para "amostrar" a fatia sob o marcador. Sem valor numérico/faixa (mas com
// status), cai no fallback antigo: centro da zona do status, cor sólida.
//
// Indicador sem faixa oficial (status 'none'): a barra NÃO some — fica invisível
// (`invisible`) mantendo o mesmo espaço, para o valor seguir centralizado.

import type { StatusType, IndicatorThreshold } from '@/types/indicators'
import { markerFraction } from '@/utils/indicatorBar'

interface IndicatorBarProps {
  status: StatusType
  /** Valor exibido — posiciona o marcador de forma contínua na barra. */
  value?: string | number
  /** Faixa oficial — define a escala contínua do marcador. */
  threshold?: IndicatorThreshold
  /** Rótulos opcionais por segmento (ex.: ["< 4.0", "4.0–7.0", "> 7.0"]). */
  segmentLabels?: [string, string, string]
  className?: string
}

// Fallback por zona (quando não dá para calcular a posição contínua): centro de
// cada terço + cor sólida do status.
const ZONE_FALLBACK: Record<
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
  value,
  threshold,
  segmentLabels,
  className = '',
}: IndicatorBarProps) {
  const empty = status === 'none'

  // Posição contínua a partir do valor; na falta, centro da zona do status.
  const fraction = empty ? null : markerFraction(value, threshold)
  const fallback = status === 'none' ? undefined : ZONE_FALLBACK[status]
  const leftPct = fraction !== null ? fraction * 100 : fallback?.leftPct

  // Cor do marcador: gradual (amostra a barra no ponto) quando há posição
  // contínua; sólida (cor do status) no fallback.
  const markerStyle =
    fraction !== null
      ? {
          left: `${leftPct}%`,
          background: BAR_GRADIENT,
          backgroundSize: 'var(--spacing-gutter) 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPositionX: `calc(var(--spacing-sm) / 2 - var(--spacing-gutter) * ${fraction})`,
          backgroundPositionY: 'center',
        }
      : fallback
        ? { left: `${leftPct}%`, background: fallback.color }
        : undefined

  return (
    <div
      className={`flex flex-col gap-xs w-[var(--spacing-gutter)] ${empty ? 'invisible' : ''} ${className}`}
      aria-hidden={empty || undefined}
    >
      <div className="relative h-[var(--spacing-2xs)] w-full" style={{ background: BAR_GRADIENT }}>
        {markerStyle && (
          <div
            className="absolute size-[var(--spacing-sm)] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
            style={{
              ...markerStyle,
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.35)',
            }}
          />
        )}
      </div>
      {segmentLabels && (
        <div className="flex items-center justify-between w-full">
          {segmentLabels.map((label, i) => (
            <span key={i} className="typo-body-xs">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
