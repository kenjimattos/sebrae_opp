// Régua de classificação por indicador. Converte o valor bruto em StatusType
// usando escalas oficiais (IDH-M/PNUD, ISDEL/Sebrae) ou heurísticas baseadas
// em benchmarks públicos. O Provider aplica `deriveStatus(id, valor)` no
// merge catálogo × valores para produzir o `Indicador` consumido pela UI.

import type { StatusType } from '@/types/indicadores'

type Threshold =
  | { kind: 'higher-better'; success: number; warning: number } // x ≥ success → success; x ≥ warning → warning; else alert
  | { kind: 'lower-better'; success: number; warning: number }  // x ≤ success → success; x ≤ warning → warning; else alert
  | { kind: 'enum'; map: Record<string, StatusType> }

// Converte string tipo "R$ 185M", "22 dias", "+3,2%", "58,24", "0,763" em número.
// Retorna null quando o valor é placeholder ("—", "N/D", vazio).
export function parseNumeric(raw: string | number): number | null {
  if (typeof raw === 'number') return raw
  const s = raw.trim()
  if (!s || s === '—' || s === 'N/D' || s.toUpperCase() === 'N/A') return null

  // Extrai primeiro número (aceita vírgula decimal, "1d3h" = extrai 1)
  const match = s.match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return null
  return parseFloat(match[0].replace(',', '.'))
}

// Chave = id do indicador no catálogo.
const thresholds: Record<string, Threshold> = {
  // IGM-CFA: escala 0-10 (sem faixas oficiais — convenção interna)
  'igm-cfa-2025': { kind: 'higher-better', success: 7, warning: 5 },

  // IDH-M/PNUD: <0,6 muito baixo/baixo; 0,6-0,699 médio; ≥0,7 alto/muito alto
  'idh-m-2021': { kind: 'higher-better', success: 0.7, warning: 0.6 },

  // ISDEL/Sebrae: muito baixo 0-0,15; baixo 0,151-0,31; médio 0,311-0,47; alto/mt alto ≥0,471
  'isdel-governanca': { kind: 'higher-better', success: 0.471, warning: 0.311 },
  'educacao-isdel': { kind: 'higher-better', success: 0.471, warning: 0.311 },

  // IGMA/Áquila: escala 0-100 (convenção do projeto)
  'igma': { kind: 'higher-better', success: 65, warning: 50 },

  // Tempos em relação à média PB (≈12h viabilidade, ≈14h abertura — CAGED/Redesim)
  'tempo-viabilidade': { kind: 'lower-better', success: 12, warning: 24 },
  'tempo-abertura': { kind: 'lower-better', success: 14, warning: 24 },

  // Ranking Redesim/PB: escala observada no CSV (maior = melhor)
  'ranking-redesim': { kind: 'higher-better', success: 900, warning: 600 },

  // Tempo de licenciamento (dias)
  'tempo-licenciamento': { kind: 'lower-better', success: 15, warning: 25 },

  // Taxas (%)
  'ensino-superior': { kind: 'higher-better', success: 25, warning: 15 },
  'ensino-medio': { kind: 'higher-better', success: 70, warning: 60 },
  'trabalhadores-tic': { kind: 'higher-better', success: 4, warning: 2 },

  // Taxas de crescimento (%)
  'mpe-eli-sebrae': { kind: 'higher-better', success: 8, warning: 3 },
  'compras-publicas-inovacao': { kind: 'higher-better', success: 10, warning: 3 },
  'bolsa-familia': { kind: 'lower-better', success: 2, warning: 5 },
  'mpe-compras-publicas': { kind: 'higher-better', success: 20, warning: 10 },

  // Contagens (valores absolutos — heurística por porte médio PB)
  'trabalhadores-ct': { kind: 'higher-better', success: 1000, warning: 300 },
  'negocios-abertos': { kind: 'higher-better', success: 1000, warning: 400 },
  'empresas-ativas': { kind: 'higher-better', success: 10000, warning: 3000 },
  'negocios-extintos': { kind: 'lower-better', success: 500, warning: 1500 },
  'apoiados-sebrae': { kind: 'higher-better', success: 1000, warning: 300 },
  'linhas-credito': { kind: 'higher-better', success: 15, warning: 7 },

  // Crédito/financiamento (R$ milhões)
  'credito-financiamento': { kind: 'higher-better', success: 300, warning: 100 },
  'bndes-operacoes': { kind: 'higher-better', success: 50, warning: 20 },
}

export function deriveStatus(indicadorId: string, rawValor: string | number): StatusType {
  const rule = thresholds[indicadorId]
  if (!rule) return 'warning'

  if (rule.kind === 'enum') {
    const v = String(rawValor).trim()
    return rule.map[v] ?? 'warning'
  }

  const n = parseNumeric(rawValor)
  if (n === null) return 'warning'

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
