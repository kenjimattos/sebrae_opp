// Deriva os 3 rótulos de zona do IndicatorBar a partir da faixa oficial do
// indicador. Ordem = esquerda→direita da barra (gradiente vermelho→verde):
// [alert, warning, success]. Sem faixa (ou enum) → undefined (barra sem rótulos).

import type { IndicatorThreshold } from '@/types/indicators'

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function thresholdSegmentLabels(
  t?: IndicatorThreshold,
): [string, string, string] | undefined {
  if (!t || t.kind === 'enum' || t.success === undefined || t.warning === undefined) {
    return undefined
  }
  const s = fmt(t.success)
  const w = fmt(t.warning)

  // Quando a régua não está na unidade exibida (contagem bruta no card, faixa
  // per capita), os rótulos precisam dizer em que unidade estão — senão "≥ 44,5"
  // ao lado de "70.626" lê como um corte que o valor já passou por muito.
  //
  // A unidade vai só no rótulo da DIREITA: os três dividem 145px em typo-body-xs,
  // e sufixar os três estoura a linha. A escala se lê como uma coisa só, então
  // uma marca de unidade basta.
  const u = t.basis ? t.basis.unit : ''

  if (t.kind === 'higher-better') {
    // maior = melhor: esquerda(alert) baixo → direita(success) alto
    return [`< ${w}`, `${w}–${s}`, `≥ ${s}${u}`]
  }
  // menor = melhor: esquerda(alert) alto → direita(success) baixo
  return [`> ${w}`, `${s}–${w}`, `≤ ${s}${u}`]
}
