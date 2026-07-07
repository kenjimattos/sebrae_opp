// Helpers da base econômica (modo "Panorâma Sócioeconômico").
// A API repassa `variation` do banco: um objeto estruturado quando há variação,
// ou string vazia quando não há. Estes helpers normalizam e formatam esse dado
// para exibição — o card nunca deve renderizar o objeto cru (React error #31).

import type { EconomicVariation } from '@/types/indicators'

// Normaliza o `variation` cru da API para o objeto ou `null` (quando vazio/ausente).
export function toEconomicVariation(
  raw: EconomicVariation | string | null | undefined,
): EconomicVariation | null {
  return raw != null && typeof raw === 'object' ? raw : null
}

// Formata o delta percentual para exibição em pt-BR, com sinal explícito.
// Ex.: 12.2 → "+12,2%"; -0.2 → "-0,2%".
export function formatVariationPct(v: EconomicVariation): string {
  const sign = v.deltaPct > 0 ? '+' : ''
  const pct = v.deltaPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return `${sign}${pct}%`
}
