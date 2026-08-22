import type { Agenda, StatusType } from '@/types/indicators'

// `bg` saiu do mapa: o Card referencia as classes `status-*-bg` diretamente no
// seu próprio `surfaceClass`, então a cópia aqui não tinha leitor.
export const statusStyles: Record<StatusType, { dot: string; glow: string }> = {
  success: { dot: 'status-success-dot', glow: 'status-success-glow' },
  warning: { dot: 'status-warning-dot', glow: 'status-warning-glow' },
  alert:   { dot: 'status-alert-dot',   glow: 'status-alert-glow' },
  // Sem faixa oficial: neutro, sem glow (não sinaliza cor).
  none:    { dot: 'status-neutral-dot', glow: '' },
}

// Cor da agenda REMOVIDA por decisão de produto: o agregado por agenda é ele
// mesmo um semáforo sem faixa oficial, então — pela regra de fonte primária —
// não sinalizamos cor no nível da agenda. Retorna sempre 'none' (glow neutro).
// O único semáforo exibido é o IndicatorBar dos 6 indicadores com faixa oficial.
// (Para restaurar a média por gravidade no futuro, ver histórico deste arquivo.)
export function agendaStatus(_agenda: Agenda): StatusType {
  return 'none'
}
