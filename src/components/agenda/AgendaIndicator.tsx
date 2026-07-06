// Linha de indicador no AgendaCard floating: label (font-body 14px) à
// esquerda, valor grande (font-body bold 18px) ao centro-direita, barra
// rainbow (145px) com marcador e rótulos de zona à direita.

import type { StatusType, IndicatorThreshold } from '@/types/indicators'
import IndicatorBar from '@/components/agenda/IndicatorBar'
import { thresholdSegmentLabels } from '@/utils/segmentLabels'

interface AgendaIndicatorProps {
  id?: string
  label: string
  value: string | number
  status: StatusType
  /** Faixa oficial — deriva os rótulos das zonas da barra. */
  threshold?: IndicatorThreshold
  /** Sobrepõe os rótulos derivados do threshold (opcional). */
  segmentLabels?: [string, string, string]
  className?: string
}

export default function AgendaIndicator({
  label,
  value,
  status,
  threshold,
  segmentLabels,
  className = '',
}: AgendaIndicatorProps) {
  // Rótulos das zonas = cortes da faixa oficial (ex.: "< 5,01 · 5,01–7,51 · ≥ 7,51").
  // Indicador sem faixa ('none') → sem rótulos (e a barra fica invisível).
  const labels = segmentLabels ?? thresholdSegmentLabels(threshold)

  return (
    <div className={`flex items-center gap-lg ${className}`}>
      <span
        className="flex-1 typo-body-bold"
      >
        {label}
      </span>
      <div className="flex-col-start items-center gap-xs">
        <span className="typo-body-lg-bold text-white" >
          {value}
        </span>
        <IndicatorBar status={status} segmentLabels={labels} />
      </div>
    </div>
  )
}
