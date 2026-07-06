// Régua de classificação por indicador. Converte o valor bruto em StatusType
// usando escalas oficiais (IDH-M/PNUD, ISDEL/Sebrae) ou heurísticas baseadas
// em benchmarks públicos. O Provider aplica `deriveStatus(id, valor)` no
// merge catálogo × valores para produzir o `Indicador` consumido pela UI.

import type { StatusType } from '@/types/indicators'

type Threshold =
  | { kind: 'higher-better'; success: number; warning: number } // x ≥ success → success; x ≥ warning → warning; else alert
  | { kind: 'lower-better'; success: number; warning: number }  // x ≤ success → success; x ≤ warning → warning; else alert
  | { kind: 'enum'; map: Record<string, StatusType> }

// Converte string tipo "R$ 185M", "22 dias", "+3,2%", "58,24", "12.840", "0,763"
// em número, assumindo formato brasileiro (ponto = milhar, vírgula = decimal).
// Retorna null quando o valor é placeholder ("—", "N/D", vazio).
export function parseNumeric(raw: string | number): number | null {
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
    // "0,763" / "12.840,5" — vírgula decimal, pontos são milhares
    cleaned = token.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    const parts = token.split('.')
    // Vários pontos OU um único ponto seguido de 3 dígitos → separador de milhar
    const treatsAsThousands =
      parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && lastComma === -1)
    cleaned = treatsAsThousands ? parts.join('') : token
  } else {
    cleaned = token
  }
  return parseFloat(cleaned)
}

// Chave = id do indicador no catálogo.
//
// REGRA DE FONTE PRIMÁRIA: só existe threshold quando a fonte publica faixa de
// classificação oficial — nunca inventamos cortes (ver database/MAPEAMENTO_BASE_DOS_DADOS.md,
// seção "Semáforo"). São apenas 6 indicadores de agenda. Os demais retornam 'none'
// (sem semáforo → não mostram IndicatorBar).
const thresholds: Record<string, Threshold> = {
  // IGM-CFA (CFA): ≥7,51 Bom · 5,01–7,50 Atenção · <5,01 Alerta
  'igm-cfa': { kind: 'higher-better', success: 7.51, warning: 5.01 },

  // IDH-M (PNUD/Atlas): ≥0,700 · 0,600–0,699 · <0,600
  'idh-m': { kind: 'higher-better', success: 0.7, warning: 0.6 },

  // ISDEL – Governança (Sebrae, ISDEL 2.0): ≥0,471 · 0,311–0,470 · <0,311
  // (a subdimensão Educação Empreendedora NÃO tem faixa própria → sem threshold)
  'isdel-governanca': { kind: 'higher-better', success: 0.471, warning: 0.311 },

  // IGMA (Áquila): Desenvolvido ≥65 · Em desenvolvimento 50–64 · Crítico <50
  'igma': { kind: 'higher-better', success: 65, warning: 50 },

  // Tempo de abertura/viabilidade (Redesim, marco P75, horas úteis):
  // ≤72h Bom · 72–168h Atenção · >168h Alerta
  'tempo-abertura': { kind: 'lower-better', success: 72, warning: 168 },
  'tempo-viabilidade': { kind: 'lower-better', success: 72, warning: 168 },
}

export function deriveStatus(indicadorId: string, rawValor: string | number): StatusType {
  const rule = thresholds[indicadorId]
  if (!rule) return 'none'

  if (rule.kind === 'enum') {
    const v = String(rawValor).trim()
    return rule.map[v] ?? 'none'
  }

  const n = parseNumeric(rawValor)
  if (n === null) return 'none'

  if (rule.kind === 'higher-better') {
    if (n >= rule.success) return 'success'
    if (n >= rule.warning) return 'warning'
    return 'alert'
  }

  // lower-better
  if (n <= rule.success) return 'success'
  if (n <= rule.warning) return 'warning'
  return 'alert'
}
