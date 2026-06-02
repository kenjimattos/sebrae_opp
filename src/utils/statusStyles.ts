import type { Agenda, StatusType } from '@/types/indicators'

export const statusStyles: Record<
  StatusType,
  { bg: string; dot: string; glow: string }
> = {
  success: { bg: 'status-success-bg', dot: 'status-success-dot', glow: 'status-success-glow' },
  warning: { bg: 'status-warning-bg', dot: 'status-warning-dot', glow: 'status-warning-glow' },
  alert:   { bg: 'status-alert-bg',   dot: 'status-alert-dot',   glow: 'status-alert-glow' },
}

// Regra de cor da agenda: pontua cada indicador por gravidade e tira a média,
// caindo no status mais próximo. Distingue 'warning' de 'alert' — amarelos só
// puxam para vermelho quando há vermelhos de verdade na conta.
//   success = 2, warning = 1, alert = 0  →  média em [0, 2]
//   média >= 1.5  → verde   (success)
//   média >= 0.5  → amarelo (warning)
//   média <  0.5  → vermelho (alert)
const STATUS_SCORE: Record<StatusType, number> = {
  success: 2,
  warning: 1,
  alert: 0,
}

export function agendaStatus(agenda: Agenda): StatusType {
  const total = agenda.indicators.length
  if (total === 0) return 'success'

  const sum = agenda.indicators.reduce(
    (acc, i) => acc + STATUS_SCORE[i.status],
    0,
  )
  const average = sum / total

  if (average >= 1.5) return 'success'
  if (average >= 0.5) return 'warning'
  return 'alert'
}
