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
//
// As faixas ficam no TOOLTIP do hover, não sob a barra: os três rótulos somavam
// até 37 caracteres em 180px a 8px e quebravam em duas linhas nos indicadores de
// régua relativa. No tooltip cabem por extenso, com o nome da zona ao lado, e o
// leitor de tela os recebe pelo `aria-label` da barra — não é informação que
// existe só no hover.

import type { StatusType, IndicatorThreshold } from '@/types/indicators'
import { markerFraction } from '@/utils/indicatorBar'
import { statusLabels } from '@/data/indicators/status-labels'
import Tooltip from '@/components/ui/Tooltip'

interface IndicatorBarProps {
  status: StatusType
  /** Valor numérico (do ETL, via API) — posiciona o marcador na barra. */
  numericValue?: number | null
  /** Faixa oficial — define a escala contínua do marcador. */
  threshold?: IndicatorThreshold
  /**
   * Faixas por zona (ex.: ["< 4.0", "4.0–7.0", "> 7.0"]), na ordem
   * alert→warning→success. Aparecem no tooltip do hover da barra.
   */
  segmentLabels?: [string, string, string]
  className?: string
}

// Fallback por zona (quando não dá para calcular a posição contínua): centro de
// cada terço + cor sólida do status.
const ZONE_FALLBACK: Record<
  Exclude<StatusType, 'none'>,
  { color: string; leftPct: number }
> = {
  alert:   { color: 'var(--semantic-alert-vivid)', leftPct: 16.6 },
  warning: { color: 'var(--semantic-warning-vivid)', leftPct: 50 },
  success: { color: 'var(--semantic-success-vivid)', leftPct: 83.4 },
}

// Zonas na ordem da barra (esquerda→direita): pior → melhor.
const ZONES = ['alert', 'warning', 'success'] as const

const BAR_GRADIENT =
  'linear-gradient(to right, var(--semantic-alert-vivid) 0%, var(--semantic-warning-vivid) 53.365%, var(--semantic-success-vivid) 100%)'

// O marcador anda pela BORDA, não pelo centro: `left: 100%` centralizado deixaria
// metade do cubo fora da barra, e é o que fazia todo indicador no topo da faixa
// vazar à direita. O trajeto útil é a largura da barra menos a do próprio cubo.
const markerLeft = (fraction: number) => `calc(${fraction} * (100% - var(--spacing-sm)))`

export default function IndicatorBar({
  status,
  numericValue,
  threshold,
  segmentLabels,
  className = '',
}: IndicatorBarProps) {
  const empty = status === 'none'

  // Posição contínua a partir do valor; na falta, centro da zona do status.
  const fraction = empty ? null : markerFraction(numericValue, threshold)
  const fallback = status === 'none' ? undefined : ZONE_FALLBACK[status]

  // Cor do marcador: gradual (amostra a barra no ponto) quando há posição
  // contínua; sólida (cor do status) no fallback.
  const markerStyle =
    fraction !== null
      ? {
          left: markerLeft(fraction),
          background: BAR_GRADIENT,
          backgroundSize: 'var(--spacing-gutter) 100%',
          backgroundRepeat: 'no-repeat',
          // Amostra a fatia da barra sob o cubo: desloca o gradiente pelo tanto
          // que o cubo já andou (mesmo trajeto encurtado do `markerLeft`).
          backgroundPositionX: `calc(-1 * ${fraction} * (var(--spacing-gutter) - var(--spacing-sm)))`,
          backgroundPositionY: 'center',
        }
      : fallback
        ? { left: markerLeft(fallback.leftPct / 100), background: fallback.color }
        : undefined

  // As faixas (antes três rótulos sob a barra) e a leitura por leitor de tela
  // saem do mesmo array, para o que se lê e o que se ouve não divergirem.
  const zonesText = segmentLabels
    ? ZONES.map((z, i) => `${statusLabels[z]} ${segmentLabels[i]}`).join('; ')
    : undefined

  const bar = (
    <div
      className="relative h-[var(--spacing-2xs)] w-full"
      style={{ background: BAR_GRADIENT }}
      role={zonesText ? 'img' : undefined}
      aria-label={zonesText ? `Faixas de classificação: ${zonesText}` : undefined}
    >
        {markerStyle && (
          <div
            className="absolute size-[var(--spacing-sm)] top-1/2 -translate-y-1/2 rounded-xs"
            style={{
              ...markerStyle,
              // O anel destaca o marcador da barra colorida e do fundo da página
              // (o marcador é mais alto que a barra, então sobra dos dois lados).
              // Por isso acompanha o texto — branco no escuro, quase preto no
              // claro — em vez de ser branco fixo. A sombra é sombra: preta nos
              // dois temas.
              boxShadow:
                '0 0 0 1.5px color-mix(in srgb, var(--semantic-text-primary) 90%, transparent), 0 1px 2px rgb(0 0 0 / 0.35)',
            }}
          />
        )}
    </div>
  )

  return (
    <div
      className={`w-gutter pb-xs ${empty ? 'invisible' : ''} ${className}`}
      aria-hidden={empty || undefined}
    >
      {segmentLabels && !empty ? (
        // `py-xs -my-xs` amplia a área de hover sem mexer no layout: a barra tem
        // 4px de altura e acertá-la com o mouse seria trabalho.
        <Tooltip
          followCursor
          portal
          width={220}
          className="py-xs -my-xs"
          content={
            <div className="flex flex-col gap-2xs">
              {ZONES.map((zone, i) => (
                <div key={zone} className="flex items-center gap-xs">
                  <span className={`status-${zone}-dot`} />
                  <span className="typo-body-sm text-inactive w-[52px] shrink-0">
                    {statusLabels[zone]}
                  </span>
                  <span className="typo-body-sm">{segmentLabels[i]}</span>
                </div>
              ))}
            </div>
          }
        >
          {bar}
        </Tooltip>
      ) : (
        bar
      )}
    </div>
  )
}
