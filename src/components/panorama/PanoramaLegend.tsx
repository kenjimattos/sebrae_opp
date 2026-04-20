// Status legend for the Panorama map section

import type { StatusType } from '@/types/indicadores'
import { statusLabelsMap } from '@/data/labels'

const legendItems: { status: StatusType; cssClass: string }[] = [
  { status: 'success', cssClass: 'status-success-dot' },
  { status: 'warning', cssClass: 'status-warning-dot' },
  { status: 'alert',   cssClass: 'status-alert-dot' },
]

export default function PanoramaLegend() {
  return (
    <div className="flex-center gap-md">
      {legendItems.map(({ status, cssClass }) => (
        <div key={status} className="flex-center gap-2xs">
          <span className={`w-[12px] h-[12px] rounded-full ${cssClass}`} />
          <span className="typo-body-sm text-inactive">{statusLabelsMap[status]}</span>
        </div>
      ))}
    </div>
  )
}
