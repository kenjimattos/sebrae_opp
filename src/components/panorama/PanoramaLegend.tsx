// Status legend for the Panorama map section

import type { StatusType } from '@/types/indicadores'
import { statusLabelsMap } from '@/data/labels'

const legendItems: { status: StatusType; cssClass: string; borderClass: string }[] = [
  { status: 'success', cssClass: 'status-success-bg', borderClass: 'border-[var(--semantic-success)]' },
  { status: 'warning', cssClass: 'status-warning-bg', borderClass: 'border-[var(--semantic-warning)]' },
  { status: 'alert',   cssClass: 'status-alert-bg',   borderClass: 'border-[var(--semantic-alert)]' },
]

export default function PanoramaLegend() {
  return (
    <div className="flex-center gap-md">
      {legendItems.map(({ status, cssClass, borderClass }) => (
        <div key={status} className="flex-center gap-2xs">
          <span className={`w-[12px] h-[12px] rounded-full ${cssClass} border ${borderClass}`} />
          <span className="typo-body-sm text-inactive">{statusLabelsMap[status]}</span>
        </div>
      ))}
    </div>
  )
}
