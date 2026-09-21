// Seleção de riscos a partir das agendas: indicadores com status alert/warning,
// ordenados alert-first, limitados ao topo N.
//
// Nasceu para o modo "Riscos estratégicos" da Jornada, que não existe mais. Hoje
// o único consumidor é `formulator/steps/StepJustification.tsx`, que monta com
// isto o contexto de "Evidências e Dados" — por isso o arquivo continua aqui.

import type { Agenda, Indicator } from '@/types/indicators'

export type RiskItem = Indicator & { agenda: string }

export function selectTopRisks(agendas: Agenda[], limit = 3): RiskItem[] {
  return agendas
    .flatMap((a) =>
      a.indicators
        .filter((i) => i.status === 'alert' || i.status === 'warning')
        .map((i) => ({ ...i, agenda: a.name })),
    )
    .sort((a, b) => {
      if (a.status === 'alert' && b.status !== 'alert') return -1
      if (a.status !== 'alert' && b.status === 'alert') return 1
      return 0
    })
    .slice(0, limit)
}
