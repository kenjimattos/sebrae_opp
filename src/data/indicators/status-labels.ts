import type { StatusType } from '@/types/indicadores'

// Textos curtos do enum StatusType (AgendaStats, pills de status).
export const statusLabels: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
} as const

// Variante da legenda do ParaibaMap. "Crítico" comunica impacto melhor
// que "Alerta" no contexto visual do mapa — mesmo enum, vocabulário
// específico da seção Panorama.
export const statusLabelsPanorama: Record<StatusType, string> = {
  ...statusLabels,
  alert: 'Crítico',
} as const
