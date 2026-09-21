import { getDb } from '../infra/db.js'
import type { AgendaDoc, IndicatorDoc } from '../types/index.js'

// A estrutura fixa da plataforma: quais agendas existem, quais indicadores
// moram em cada uma e em que ordem. É igual para os 223 municípios — o que muda
// por município são os valores (ver `municipios/repo.ts`).

export interface Catalog {
  agendas: AgendaDoc[] // ordenadas por `order`
  indicatorsByAgenda: Map<string, IndicatorDoc[]> // agendaId → indicadores ordenados
  socialeconomic: IndicatorDoc[] // indicadores da base econômica, ordenados
  byId: Map<string, IndicatorDoc> // lookup rápido por indicators._id
}

// Monta o catálogo a partir de `agendas` + `indicators.placements`. Por ser o
// mesmo para todo mundo, quem chama é o cache (`catalog-cache.ts`), não a rota.
export async function loadCatalog(): Promise<Catalog> {
  const db = getDb()
  const [agendas, indicators] = await Promise.all([
    db.collection<AgendaDoc>('agendas').find().sort({ order: 1 }).toArray(),
    db.collection<IndicatorDoc>('indicators').find().toArray(),
  ])

  const byId = new Map(indicators.map((i) => [i._id, i]))
  const indicatorsByAgenda = new Map<string, IndicatorDoc[]>()
  const socialeconomic: IndicatorDoc[] = []

  for (const ind of indicators) {
    for (const p of ind.placements ?? []) {
      if (p.section === 'agenda' && p.agendaId) {
        const list = indicatorsByAgenda.get(p.agendaId) ?? []
        list.push(ind)
        indicatorsByAgenda.set(p.agendaId, list)
      } else if (p.section === 'socialeconomic') {
        socialeconomic.push(ind)
      }
    }
  }

  // Ordena cada grupo pela `order` do placement correspondente.
  const placementOrder = (ind: IndicatorDoc, agendaId?: string) =>
    ind.placements.find((p) =>
      agendaId ? p.agendaId === agendaId : p.section === 'socialeconomic',
    )?.order ?? 999

  for (const [agendaId, list] of indicatorsByAgenda) {
    list.sort((a, b) => placementOrder(a, agendaId) - placementOrder(b, agendaId))
  }
  socialeconomic.sort((a, b) => placementOrder(a) - placementOrder(b))

  return { agendas, indicatorsByAgenda, socialeconomic, byId }
}
