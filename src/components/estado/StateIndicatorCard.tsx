// Card de um indicador estadual.
//
// Rótulo, número grande, variação e ano, mais o que o grão estadual exige:
//   1. a posição entre UFs, que ocupa o lugar do semáforo — SEM cor;
//   2. onde o dado é composição, as barras (ver EstadoChart em
//      src/data/home/estado.ts).
// A descrição e a fonte vêm da API e moram no tooltip: oito cards com parágrafo
// aberto viram uma parede de texto, e o número é o que se vem ler.
//
// Duas anatomias, pela largura: no `sm` a posição vai ao pé, sob um filete; no
// `lg` ela sobe para o canto direito do cabeçalho, e o resto do card é das barras.

import InfoTooltip from '@/components/ui/InfoTooltip'
import BreakdownBars from '@/components/estado/BreakdownBars'
import StatePositionBlock from '@/components/estado/StatePosition'
import type { EstadoCardView } from '@/data/home/estado'
import type { StateIndicator } from '@/types/estado'
import { toEconomicVariation, formatVariationPct } from '@/utils/economics'
import { formatNumberBR, readDistribution, readNumber, readPosition } from '@/utils/estado'

interface StateIndicatorCardProps {
  indicator: StateIndicator
  view: EstadoCardView
  /** Fora do tema escolhido: continua legível e focável, só recua. */
  dimmed?: boolean
  className?: string
}

export default function StateIndicatorCard({
  indicator,
  view,
  dimmed = false,
  className = '',
}: StateIndicatorCardProps) {
  const variation = toEconomicVariation(indicator.variation)
  const position = readPosition(indicator.breakdown)
  const largo = view.width === 'lg'
  const chart = view.chart

  // Quanto o card representa de um todo maior — hoje, o emprego em MPE dentro do
  // emprego formal do estado. Sai do breakdown: a conta muda a cada carga.
  const total = view.parte ? readNumber(indicator.breakdown, view.parte.totalKey) : null
  const parte =
    view.parte && total !== null && total > 0 && indicator.numericValue !== null
      ? {
          pct: `${formatNumberBR((indicator.numericValue / total) * 100)}%`,
          label: view.parte.totalLabel,
        }
      : null

  // "R$ 3.036,47" já diz a unidade; repetir "R$" ao lado seria ruído.
  const unidade = indicator.unit && !indicator.value.includes(indicator.unit) ? indicator.unit : ''
  const base = [variation && `vs ${variation.previousYear}`, unidade].filter(Boolean).join(' · ')

  const detalhe = [indicator.description, view.nota, indicator.source && `Fonte: ${indicator.source}`]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={`card-raised flex flex-col p-md gap-md transition-opacity duration-300 motion-reduce:transition-none ${
        dimmed ? 'opacity-40 hover:opacity-100 focus-within:opacity-100' : ''
      } ${className}`}
    >
      <div
        className={
          largo ? 'flex items-start justify-between gap-md' : 'flex flex-1 flex-col gap-md'
        }
      >
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <div className="flex items-start gap-xs">
            <h4 className="typo-body-sm uppercase text-inactive flex-1">{indicator.label}</h4>
            <span className="typo-body-sm-bold tabular-nums shrink-0 rounded-full border border-divider px-xs">
              {indicator.referenceYear}
            </span>
            {detalhe && (
              <InfoTooltip
                label={`Sobre ${indicator.label}`}
                title={indicator.label}
                subtitle={detalhe}
              />
            )}
          </div>

          <span className="typo-h2 tabular-nums">{indicator.value}</span>

          {(variation || base) && (
            <p className="flex flex-wrap items-center gap-xs typo-body-sm text-inactive">
              {variation && (
                <span
                  className="typo-body-sm-bold tabular-nums rounded-full bg-accent-surface px-xs"
                  title={`vs ${variation.previousYear}: ${variation.previousValue}`}
                >
                  {formatVariationPct(variation)}
                </span>
              )}
              {base}
            </p>
          )}
        </div>

        {position && (
          <StatePositionBlock
            position={position}
            className={largo ? 'shrink-0' : 'mt-auto border-t border-divider pt-sm'}
          />
        )}
      </div>

      {parte && (
        <p className="typo-body-sm">
          <span className="typo-body-sm-bold">{parte.pct}</span> {parte.label}
        </p>
      )}

      {/* flex-1 + justify-between: quando o card estica para fechar a coluna, a
          sobra se espalha entre as barras em vez de abrir um vazio sob o título. */}
      {chart.kind === 'bars' && (
        <BreakdownBars
          slices={readDistribution(indicator.breakdown, chart.key)}
          max={chart.max}
          caption={chart.caption}
          destaque={chart.destaque}
          className="flex-1 justify-between"
        />
      )}
    </article>
  )
}
