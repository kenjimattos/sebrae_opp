// Posição contínua do marcador no IndicatorBar a partir do valor real e da faixa
// oficial (threshold). Substitui as 3 posições fixas por zona (alert/warning/
// success) por uma escala linear onde os dois cortes da faixa ficam em 1/3 e 2/3
// da barra, com uma zona-largura de folga em cada extremo (clampado a [0,1]).
//
// Eixo da barra = "pior→melhor" (esquerda→direita, gradiente vermelho→verde):
//   higher-better: valor baixo à esquerda, alto à direita
//   lower-better:  valor alto à esquerda,  baixo à direita
// Nos dois casos os cortes `warning` e `success` caem em 1/3 e 2/3.

import type { IndicatorThreshold } from '@/types/indicators'

// Fração [0,1] da posição do marcador (0 = extremo esquerdo/pior, 1 = direito/
// melhor). Devolve null quando não é possível calcular (sem faixa, faixa enum,
// cortes ausentes/iguais ou valor não-numérico) — o chamador cai no fallback
// por zona de status.
export function markerFraction(
  value: number | null | undefined,
  threshold?: IndicatorThreshold,
): number | null {
  if (
    !threshold ||
    threshold.kind === 'enum' ||
    threshold.success === undefined ||
    threshold.warning === undefined
  ) {
    return null
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null

  const { success: s, warning: w } = threshold
  const d = Math.abs(s - w)
  if (d === 0) return null

  // g = 1/3 quando value = warning, 2/3 quando value = success; linear entre e
  // além, com folga de uma zona-largura (d) em cada ponta.
  const g =
    threshold.kind === 'higher-better'
      ? (value - w) / (3 * d) + 1 / 3
      : (w - value) / (3 * d) + 1 / 3

  return Math.min(1, Math.max(0, g))
}
