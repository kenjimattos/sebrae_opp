import type { StatusType } from '@/types/indicadores'

/** AgendaStats — status labels */
export const statusLabels: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
} as const

/** PanoramaLegend — status labels (uses "Crítico" instead of "Alerta") */
export const statusLabelsMap: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Crítico',
} as const

/** CTA labels used across components */
export const ctaLabels = {
  verEstudoDeCaso: 'Ver estudo de caso',
  verTrilhaCompleta: 'Ver trilha completa',
  verCurso: 'Ver curso',
} as const

/** Panorama section labels */
export const panoramaLabels = {
  indicadorNoMapa: 'Indicador no mapa',
  mediaEstadual: 'Média estadual',
} as const

/** AgendaStats label */
export const agendaStatsLabel = 'indicadores avaliados' as const

/** Default user name */
export const defaultUserName = 'João Maria' as const
