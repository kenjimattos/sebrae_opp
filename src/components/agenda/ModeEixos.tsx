// Modo "Eixos prioritários" da aba Ambiente.
// Grid de cards expansíveis: cada agenda vira um AgendaIndicatorItem que abre
// mostrando os indicadores (barra rainbow). Toggle independente por card.

import { useState } from 'react'
import { useMunicipality } from '@/hooks/useMunicipality'
import AgendaIndicatorItem from '@/components/agenda/AgendaIndicatorItem'
import { agendaStatus } from '@/utils/statusStyles'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'

export default function ModeEixos() {
  const { municipality } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Ordem por coluna: a 1ª metade na esquerda, a 2ª na direita (1,2,3 | 4,5,6).
  const half = Math.ceil(agendas.length / 2)
  const columns = [agendas.slice(0, half), agendas.slice(half)]

  return (
    <div className="flex w-full gap-sm items-start">
      {columns.map((column, c) => (
        <div key={c} className="flex flex-1 flex-col gap-sm">
          {column.map((agenda) => {
            const id = agenda.id ?? agenda.name
            return (
              <div key={id}>
                <AgendaIndicatorItem
                  title={agenda.name}
                  indicators={agenda.indicators.slice(0, 3)}
                  status={agendaStatus(agenda)}
                  expanded={expandedIds.has(id)}
                  onToggle={() => toggle(id)}
                  description={agendaObjectives[agenda.id]}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
