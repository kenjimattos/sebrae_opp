// Modo "Eixos prioritários" da aba Ambiente.
// Grid de cards expansíveis: cada agenda vira um AgendaIndicatorItem que abre
// mostrando os indicadores (barra rainbow). Toggle independente por card.

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMunicipality } from '@/hooks/useMunicipality'
import AgendaIndicatorItem from '@/components/agenda/AgendaIndicatorItem'
import { agendaStatus } from '@/utils/statusStyles'
import { agendaObjectives } from '@/data/indicators/descriptions/agendas'

export default function ModeEixos() {
  const { municipality } = useMunicipality()
  // `?? []` cria um array novo a cada render — memoizado para servir de dep
  // estável do useCallback abaixo (senão o listener de resize se re-registra
  // em todo render, e o React Compiler desiste de otimizar o componente).
  const agendas = useMemo(() => municipality.data?.agendas ?? [], [municipality.data])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  // Um ref por card (índice global), usado para medir/igualar alturas por linha.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Duas colunas independentes (masonry): abrir um card cresce só a sua coluna,
  // sem mover a outra. Como os cards fechados têm todos a mesma altura (reservas
  // de título 2 linhas + descrição 4 linhas), as linhas se alinham no fechado.
  // Ordem por coluna (1,2,3 | 4,5,6).
  const half = Math.ceil(agendas.length / 2)
  const columns = [agendas.slice(0, half), agendas.slice(half)]

  // Iguala a altura dos dois cards de uma linha SOMENTE quando ambos estão
  // abertos (o menor ganha min-height = altura do maior). Linhas com 0 ou 1
  // aberto ficam livres, então abrir um card sozinho não mexe na outra coluna.
  const equalizeRows = useCallback(() => {
    const refs = cardRefs.current
    refs.forEach((el) => el && (el.style.minHeight = ''))
    for (let i = 0; i < half; i++) {
      const left = agendas[i]
      const right = agendas[i + half]
      if (!left || !right) continue
      const bothOpen =
        expandedIds.has(left.id ?? left.name) &&
        expandedIds.has(right.id ?? right.name)
      if (!bothOpen) continue
      const a = refs[i]
      const b = refs[i + half]
      if (!a || !b) continue
      const max = Math.max(a.offsetHeight, b.offsetHeight)
      a.style.minHeight = `${max}px`
      b.style.minHeight = `${max}px`
    }
  }, [agendas, expandedIds, half])

  // Recalcula ao abrir/fechar e ao redimensionar (a quebra de linha dos rótulos
  // muda a altura conforme a largura da coluna).
  useLayoutEffect(() => {
    equalizeRows()
    window.addEventListener('resize', equalizeRows)
    return () => window.removeEventListener('resize', equalizeRows)
  }, [equalizeRows])

  return (
    <div className="flex w-full gap-lg items-start">
      {columns.map((column, c) => (
        <div key={c} className="flex flex-1 flex-col gap-lg">
          {column.map((agenda, j) => {
            const id = agenda.id ?? agenda.name
            const index = c * half + j
            return (
              <div
                key={id}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                className="flex flex-col bg-surface"
              >
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
