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
  verCurso: 'ver curso',
} as const

/** Panorama section labels */
export const panoramaLabels = {
  indicadorNoMapa: 'Indicador',
  municipio: 'Municipio selecionado',
  mediaEstadual: 'Média estadual',
  maior: 'Maior valor do estado'
} as const

/** AgendaStats label */
export const agendaStatsLabel =
  'indicadores alinhados às agendas estratégicas ' +
  'para melhorar o ambiente de negócios do seu município'

/** Default user name */
export const defaultUserName = 'João Maria' as const
