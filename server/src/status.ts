import type { StatusType, Threshold } from './types.js'

// Portado de src/data/indicators/thresholds.ts do frontend. A diferença: aqui a
// régua NÃO é uma tabela hardcoded — vem do campo `threshold` de cada documento
// em indicators. O banco é a fonte única da classificação.

// Converte "R$ 185M", "22 dias", "+3,2%", "58,24", "12.840", "0,763" em número,
// assumindo formato brasileiro (ponto = milhar, vírgula = decimal). Retorna null
// para placeholders ("—", "N/D", vazio).
export function parseNumeric(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return raw
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

// Deriva o status a partir do threshold do indicador. Sem threshold (indicador
// sem faixa oficial) ou valor não-parseável → 'none' (sem semáforo).
export function computeStatus(
  threshold: Threshold | undefined,
  rawValue: string | number | null | undefined,
): StatusType {
  if (!threshold) return 'none'

  if (threshold.kind === 'enum') {
    const v = String(rawValue ?? '').trim()
    return threshold.map[v] ?? 'none'
  }

  const n = parseNumeric(rawValue)
  if (n === null) return 'none'

  if (threshold.kind === 'higher-better') {
    if (n >= threshold.success) return 'success'
    if (n >= threshold.warning) return 'warning'
    return 'alert'
  }

  // lower-better
  if (n <= threshold.success) return 'success'
  if (n <= threshold.warning) return 'warning'
  return 'alert'
}
