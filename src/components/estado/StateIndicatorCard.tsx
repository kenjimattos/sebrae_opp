// Card de um indicador estadual.
//
// Mesma anatomia do EconomicsCard (rótulo, número grande, variação à direita,
// ano no pé) com duas adições que o grão estadual exige:
//   1. a posição entre UFs, que ocupa o lugar do semáforo — SEM cor;
//   2. um gráfico escolhido pelo que o dado é (ver EstadoChart em
//      src/data/home/estado.ts).
// A descrição e a fonte vêm da API e moram no tooltip: oito cards com parágrafo
// aberto viram uma parede de texto, e o número é o que se vem ler.

import InfoTooltip from '@/components/ui/InfoTooltip'
import BreakdownBars from '@/components/estado/BreakdownBars'
import SeriesLine from '@/components/estado/SeriesLine'
import StatePositionLine from '@/components/estado/StatePosition'
import type { EstadoCardView } from '@/data/home/estado'
import type { StateIndicator } from '@/types/estado'
import { toEconomicVariation, formatVariationPct } from '@/utils/economics'
import { formatNumberBR, readDistribution, readNumber, readPosition, readSeries } from '@/utils/estado'

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

  // Quanto o card representa de um todo maior — hoje, o emprego em MPE dentro do
  // emprego formal do estado. Sai do breakdown: a conta muda a cada carga.
  const chart = view.chart
  let parte = ''
  if (chart.kind === 'bars' && chart.totalKey) {
    const total = readNumber(indicator.breakdown, chart.totalKey)
    if (total !== null && total > 0 && indicator.numericValue !== null) {
      parte = `${formatNumberBR((indicator.numericValue / total) * 100)}% ${chart.totalLabel ?? ''}`.trim()
    }
  }

  const detalhe = [indicator.description, view.nota, indicator.source && `Fonte: ${indicator.source}`]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={`flex flex-col bg-surface p-sm gap-sm transition-opacity duration-300 motion-reduce:transition-none ${
        dimmed ? 'opacity-40 hover:opacity-100 focus-within:opacity-100' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2xs">
        <h4 className="typo-body-sm uppercase">{indicator.label}</h4>
        {detalhe && (
          <InfoTooltip
            label={`Sobre ${indicator.label}`}
            title={indicator.label}
            subtitle={detalhe}
          />
        )}
      </div>

      <div className="flex items-baseline justify-between gap-xs">
        <span className="typo-display-sm tabular-nums">{indicator.value}</span>
        {variation && (
          <span
            className="typo-body-sm-bold tabular-nums"
            title={`vs ${variation.previousYear}: ${variation.previousValue}`}
          >
            {formatVariationPct(variation)}
          </span>
        )}
      </div>

      {position && <StatePositionLine position={position} />}

      {/* mt-auto gruda o gráfico e o ano no pé: numa grade, cards de alturas
          diferentes alinhariam os gráficos em linhas quebradas. */}
      <div className="mt-auto flex flex-col gap-xs pt-2xs">
        {chart.kind === 'bars' && (
          <>
            <BreakdownBars
              slices={readDistribution(indicator.breakdown, chart.key)}
              max={chart.max}
              caption={chart.caption}
            />
            {parte && <p className="typo-body-sm text-inactive">{parte}</p>}
          </>
        )}
        {chart.kind === 'line' && (
          <SeriesLine points={readSeries(indicator)} label={indicator.label} />
        )}
        <span className="typo-body-sm text-inactive text-right tabular-nums">
          {indicator.referenceYear}
        </span>
      </div>
    </article>
  )
}
