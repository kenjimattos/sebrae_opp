import type { IndicatorThreshold, StatusType, ThresholdProvenance } from '@/types/indicators'

// Textos curtos do enum StatusType (pills de status).
export const statusLabels: Record<StatusType, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
  none: 'Sem classificação',
} as const

// Fonte única da frase de procedência. Um 'Bom' não quer dizer a mesma coisa nas
// duas réguas — oficial é "atende ao padrão da fonte", relativo é "está no terço
// de cima da Paraíba" — e nada na cor distingue os dois. Esta frase é a única
// coisa que distingue, então ela é obrigatória onde a classificação é explicada
// (IndicatorModal, prompts da IA) e mora num lugar só para não divergir.
export const thresholdProvenanceLabels: Record<ThresholdProvenance, string> = {
  fonte: 'faixa oficial da fonte',
  'relativo-pb': 'comparação entre os 223 municípios da PB',
} as const

// A frase da régua de um indicador, ou undefined quando ele não classifica.
// Indicador com faixa per capita acrescenta a unidade, senão "Bom" ao lado de
// uma contagem bruta não diz sobre o que a comparação foi feita.
export function thresholdCriterion(t?: IndicatorThreshold): string | undefined {
  if (!t) return undefined
  const base = thresholdProvenanceLabels[t.provenance ?? 'fonte']
  return t.basis ? `${base}, ${t.basis.label}` : base
}
