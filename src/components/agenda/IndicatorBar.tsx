// Barra segmentada em 3 zonas (alert | warning | success) com marcador
// posicionado pela classificação do indicador. Usada no AgendaCard refatorado.

import type { StatusType } from '@/types/indicators'
import { statusStyles } from '@/utils/statusStyles'

interface IndicatorBarProps {
  status: StatusType
  /** Rótulos opcionais por segmento (ex.: ["< 4.0", "4.0–7.0", "> 7.0"]). */
  segmentLabels?: [string, string, string]
  className?: string
}

const STATUS_TO_INDEX: Record<StatusType, 0 | 1 | 2> = {
  alert: 0,
  warning: 1,
  success: 2,
}

export default function IndicatorBar({
  status,
  segmentLabels,
  className = '',
}: IndicatorBarProps) {
  const activeIndex = STATUS_TO_INDEX[status]
  const dotStyle = statusStyles[status].dot

  return (
    <div className={`flex flex-col gap-2xs w-full ${className}`}>
      <div className="grid grid-cols-3 gap-2xs items-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative h-[4px]">
            <div className="absolute inset-0 rounded-full bg-[var(--semantic-surface-secondary)]" />
            {i === activeIndex && (
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[9px] rounded-full ${dotStyle}`}
              />
            )}
          </div>
        ))}
      </div>
      {segmentLabels && (
        <div className="grid grid-cols-3 gap-2xs">
          {segmentLabels.map((label, i) => (
            <span
              key={i}
              className="typo-body-sm text-inactive text-[10px] leading-none"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
