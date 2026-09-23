import type {
  Indicator,
  IndicatorThreshold,
  StatusType,
  ThresholdProvenance,
} from '@/types/indicators'

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

// Uma linha de indicador para o contexto da IA. Vive aqui, e não dentro de cada
// componente, porque a `AIAnalysis` e o `ChatPanel` mandavam resumos diferentes
// do MESMO dado: a análise cravava "faixa oficial" para todo indicador com
// zonas (falso desde que existe tercil), e o chat não mandava régua nenhuma —
// o que fazia o modelo tratar qualquer 'Bom' como padrão atingido.
//
// O prompt (`api/_lib/prompts.ts`, ORIGEM DA CLASSIFICAÇÃO) ramifica pelo texto
// desta linha, então as duas superfícies têm de falar a mesma língua.
export function indicatorAiLine(
  i: Pick<Indicator, 'label' | 'value' | 'status' | 'threshold' | 'normalizedValue'>,
  zonas?: [string, string, string],
): string {
  const criterio = thresholdCriterion(i.threshold)
  const faixa =
    criterio && zonas
      ? ` — ${criterio}: ${statusLabels.alert} ${zonas[0]}; ${statusLabels.warning} ${zonas[1]}; ${statusLabels.success} ${zonas[2]}`
      : criterio
        ? ` — ${criterio}`
        : ''

  // Quando a régua é per capita, o número comparado precisa ir junto: sem ele a
  // linha diz "3.865" e "corte ≥ 0,766/1k hab.", e o modelo não tem como fechar
  // a conta — ou conclui que 3.865 passou o corte com folga absurda, ou que os
  // números se contradizem. Os dois levam a texto errado com ar de precisão.
  const basis = i.threshold?.basis
  const normalizado =
    basis && typeof i.normalizedValue === 'number'
      ? ` [${i.normalizedValue.toLocaleString('pt-BR')}${basis.unit}]`
      : ''

  return `${i.label}: ${i.value}${normalizado} (${statusLabels[i.status]}${faixa})`
}
