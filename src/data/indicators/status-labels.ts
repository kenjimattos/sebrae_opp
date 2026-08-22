import type { StatusType } from '@/types/indicators'

// Textos curtos do enum StatusType (pills de status).
export const statusLabels: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
  none: 'Sem classificação',
} as const
