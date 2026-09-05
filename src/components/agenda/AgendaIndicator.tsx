// Linha de indicador no AgendaCard floating: label (font-body 14px) à
// esquerda, valor grande (font-body bold 18px) ao centro-direita, barra
// rainbow (145px) com marcador e rótulos de zona à direita.

import type { StatusType, IndicatorThreshold } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'
import { thresholdSegmentLabels } from '@/utils/segmentLabels'

interface AgendaIndicatorProps {
  id?: string
  label: string
  /** Texto exibido ao lado da barra. */
  value: string | number
  /** Valor numérico — posiciona o marcador da barra (o texto é arredondado). */
  numericValue?: number | null
  status: StatusType
  /** Faixa oficial — deriva os rótulos das zonas da barra. */
  threshold?: IndicatorThreshold
  /** Sobrepõe os rótulos derivados do threshold (opcional). */
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
  // Indicador sem faixa ('none') → sem rótulos (e a barra fica invisível).
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
      <div className="flex-col-start items-center gap-xs">
        <span className="typo-body-lg-bold text-primary" >
          {value}
        </span>
        <IndicatorBar
          status={status}
          numericValue={numericValue}
          threshold={threshold}
          segmentLabels={labels}
        />
      </div>
    </div>
  )
}
