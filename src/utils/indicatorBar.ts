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

// Converte "18,6h", "0,763", "44,73", "12.840", "R$ 185M" no número, assumindo
// formato brasileiro (ponto = milhar, vírgula = decimal). Devolve null para
// placeholders ("—", "N/D") ou quando não há número.
export function parseIndicatorValue(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const s = String(raw).trim()
  if (!s || s === '—' || s === 'N/D' || s.toUpperCase() === 'N/A') return null

  const match = s.match(/[+-]?[\d.,]+/)
  if (!match) return null
  const token = match[0]
  const lastComma = token.lastIndexOf(',')
  const lastDot = token.lastIndexOf('.')

  let cleaned: string
  if (lastComma > lastDot) {
    cleaned = token.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    const parts = token.split('.')
    const treatsAsThousands =
      parts.length > 2 || (parts.length === 2 && parts[1]!.length === 3 && lastComma === -1)
    cleaned = treatsAsThousands ? parts.join('') : token
  } else {
    cleaned = token
  }
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

// Fração [0,1] da posição do marcador (0 = extremo esquerdo/pior, 1 = direito/
// melhor). Devolve null quando não é possível calcular (sem faixa, faixa enum,
// cortes ausentes/iguais ou valor não-numérico) — o chamador cai no fallback
// por zona de status.
export function markerFraction(
  value: string | number | null | undefined,
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
  const v = parseIndicatorValue(value)
  if (v === null) return null

  const { success: s, warning: w } = threshold
  const d = Math.abs(s - w)
  if (d === 0) return null

  // g = 1/3 quando value = warning, 2/3 quando value = success; linear entre e
  // além, com folga de uma zona-largura (d) em cada ponta.
  const g =
    threshold.kind === 'higher-better'
      ? (v - w) / (3 * d) + 1 / 3
      : (w - v) / (3 * d) + 1 / 3

  return Math.min(1, Math.max(0, g))
}
