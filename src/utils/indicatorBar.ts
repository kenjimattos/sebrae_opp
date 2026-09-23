// Posição contínua do marcador no IndicatorBar a partir do valor real e da faixa
// oficial (threshold). Substitui as 3 posições fixas por zona (alert/warning/
// success) por uma escala linear onde os dois cortes da faixa ficam em 1/3 e 2/3
// da barra, com uma zona-largura de folga em cada extremo (clampado a [0,1]).
//
// Eixo da barra = "pior→melhor" (esquerda→direita, gradiente vermelho→verde):
//   higher-better: valor baixo à esquerda, alto à direita
//   lower-better:  valor alto à esquerda,  baixo à direita
// Nos dois casos os cortes `warning` e `success` caem em 1/3 e 2/3.

import type { Indicator, IndicatorThreshold } from '@/types/indicators'

// Espelho de `classifiedNumber` (server/src/indicadores/status.ts): o número na
// unidade da régua. Faixa oficial usa o valor da fonte; faixa relativa usa o
// normalizado e SÓ ele.
//
// Importa aqui, e não só no servidor, porque é este número que posiciona o
// marcador: `value` é "70.626" e o corte é 44,5/1k hab. Passar o bruto jogaria o
// marcador no extremo direito de toda barra per capita — sem erro, sem aviso, e
// parecendo que todo município do estado vai bem.
export function classifiedValue(
  ind: Pick<Indicator, 'numericValue' | 'normalizedValue' | 'threshold'>,
): number | null {
  const n =
    ind.threshold?.provenance === 'relativo-pb' ? ind.normalizedValue : ind.numericValue
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

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
