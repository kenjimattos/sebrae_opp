// Linha de indicador no AgendaCard floating: label (font-body 14px) à
// esquerda, valor grande (font-body bold 18px) ao centro-direita, barra
// rainbow com marcador à direita. As faixas da régua saem no tooltip do hover
// da barra (ver IndicatorBar).

import type { StatusType, IndicatorThreshold } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'
import { thresholdSegmentLabels } from '@/utils/segmentLabels'

interface AgendaIndicatorProps {
  id?: string
  label: string
  /** Texto exibido ao lado da barra. */
  value: string | number
  /**
   * O número **na unidade da régua** — posiciona o marcador. Não é
   * necessariamente o mesmo que `value` mostra: numa faixa relativa per capita,
   * `value` é a contagem bruta e este é o normalizado. Quem monta resolve com
   * `classifiedValue()`.
   */
  numericValue?: number | null
  status: StatusType
  /** A régua — deriva os rótulos das zonas da barra e a unidade deles. */
  threshold?: IndicatorThreshold
  /** Sobrepõe as faixas derivadas do threshold (opcional). */
  segmentLabels?: [string, string, string]
  /** Quando presente, o label vira botão (abre o modal "IA" do indicador). */
  onLabelClick?: () => void
  className?: string
}

export default function AgendaIndicator({
  label,
  value,
  numericValue,
  status,
  threshold,
  segmentLabels,
  onLabelClick,
  className = '',
}: AgendaIndicatorProps) {
  // Rótulos das zonas = cortes da faixa oficial (ex.: "< 5,01 · 5,01–7,51 · ≥ 7,51").
  // Indicador sem faixa → sem rótulos e sem barra; o `min-w-gutter` da coluna
  // do valor guarda a largura que a barra ocuparia.
  const labels = segmentLabels ?? thresholdSegmentLabels(threshold)

  return (
    <div className={`flex items-center gap-lg ${className}`}>
      {onLabelClick ? (
        <button
          type="button"
          onClick={onLabelClick}
          className="flex-1 text-left typo-body-bold cursor-pointer transition-colors hover:text-accent hover:underline underline-offset-2"
        >
          {label}
        </button>
      ) : (
        <span className="flex-1 typo-body-bold">{label}</span>
      )}
      <div className="flex-col-start items-center gap-xs min-w-gutter">
        <span className="typo-body-lg-bold text-primary">
          {value}
        </span>
        {threshold && (
          <IndicatorBar
            status={status}
            numericValue={numericValue}
            threshold={threshold}
            segmentLabels={labels}
          />
        )}
      </div>
    </div>
  )
}
