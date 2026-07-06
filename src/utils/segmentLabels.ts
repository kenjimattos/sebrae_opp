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

  if (t.kind === 'higher-better') {
    // maior = melhor: esquerda(alert) baixo → direita(success) alto
    return [`< ${w}`, `${w}–${s}`, `≥ ${s}`]
  }
  // menor = melhor: esquerda(alert) alto → direita(success) baixo
  return [`> ${w}`, `${s}–${w}`, `≤ ${s}`]
}
