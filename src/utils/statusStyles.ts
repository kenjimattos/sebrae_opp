import type { StatusType } from '@/types/indicadores'

export const statusStyles: Record<StatusType, { bg: string; dot: string }> = {
  success: { bg: 'status-success-bg', dot: 'status-success-dot' },
  warning: { bg: 'status-warning-bg', dot: 'status-warning-dot' },
  alert:   { bg: 'status-alert-bg',   dot: 'status-alert-dot' },
}
