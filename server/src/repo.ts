import { getDb } from './db.js'
import type {
  AgendaDoc,
  IndicatorDoc,
  IndicatorValueDoc,
  MunicipalityDoc,
} from './types.js'

// Camada de acesso ao Mongo. Só faz queries; a transformação em respostas da API
// fica em services.ts.

export interface Catalog {
  agendas: AgendaDoc[] // ordenadas por `order`
  indicatorsByAgenda: Map<string, IndicatorDoc[]> // agendaId → indicadores ordenados
  socialeconomic: IndicatorDoc[] // indicadores da base econômica, ordenados
  byId: Map<string, IndicatorDoc> // lookup rápido por indicators._id
}

// Carrega a estrutura fixa (agendas + indicadores + placements) do banco. É a
// mesma para todos os municípios, então o service pode cachear entre requisições.
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

export async function listMunicipalities(): Promise<MunicipalityDoc[]> {
  return getDb()
    .collection<MunicipalityDoc>('municipalities')
    .find()
    .sort({ name: 1 })
    .toArray()
}

export async function getMunicipality(id: string): Promise<MunicipalityDoc | null> {
  return getDb().collection<MunicipalityDoc>('municipalities').findOne({ _id: id })
}

export async function getValuesForMunicipality(id: string): Promise<IndicatorValueDoc[]> {
  return getDb()
    .collection<IndicatorValueDoc>('indicatorValues')
    .find({ municipalityId: id })
    .toArray()
}

export async function getAllValues(): Promise<IndicatorValueDoc[]> {
  return getDb().collection<IndicatorValueDoc>('indicatorValues').find().toArray()
}
