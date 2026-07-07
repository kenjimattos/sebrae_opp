import type { Catalog } from './repo.js'
import { computeStatus, parseNumeric } from './status.js'
import type {
  IndicatorDoc,
  IndicatorsData,
  IndicatorValueDoc,
  MapData,
  MapMunicipality,
  MunicipalityDoc,
} from './types.js'

// Monta as respostas da API a partir do catálogo (estrutura) + valores por
// município. Espelha buildIndicators()/buildMunicipalityMapData() do frontend.

// De vários docs do mesmo indicador (série histórica por ano), escolhe o do ano
// de referência default do indicador; na falta, o ano mais recente.
function pickValue(
  docs: IndicatorValueDoc[],
  defaultYear?: string,
): IndicatorValueDoc | undefined {
  if (docs.length === 0) return undefined
  if (defaultYear) {
    const exact = docs.find((d) => d.referenceYear === defaultYear)
    if (exact) return exact
  }
  return docs.reduce((a, b) => (b.referenceYear > a.referenceYear ? b : a))
}

// Indexa os valores de um município por indicatorId, já resolvendo o ano default.
function indexValues(
  values: IndicatorValueDoc[],
  byId: Map<string, IndicatorDoc>,
): Map<string, IndicatorValueDoc> {
  const grouped = new Map<string, IndicatorValueDoc[]>()
  for (const v of values) {
    const list = grouped.get(v.indicatorId) ?? []
    list.push(v)
    grouped.set(v.indicatorId, list)
  }
  const out = new Map<string, IndicatorValueDoc>()
  for (const [indicatorId, docs] of grouped) {
    const picked = pickValue(docs, byId.get(indicatorId)?.referenceYear)
    if (picked) out.set(indicatorId, picked)
  }
  return out
}

export function buildIndicatorsData(
  municipality: MunicipalityDoc,
  catalog: Catalog,
  values: IndicatorValueDoc[],
): IndicatorsData {
  const byIndicator = indexValues(values, catalog.byId)

  const agendas = catalog.agendas.map((a) => ({
    id: a._id,
    name: a.name,
    indicators: (catalog.indicatorsByAgenda.get(a._id) ?? []).map((ind) => {
      const v = byIndicator.get(ind._id)
      return {
        id: ind._id,
        label: ind.label,
        value: v?.rawValue ?? '—',
        variation: v?.variation,
        status: computeStatus(ind.threshold, v?.rawValue),
        // threshold vai pro frontend derivar os rótulos das zonas da barra
        // (só existe nos indicadores com faixa oficial).
        threshold: ind.threshold,
      }
    }),
  }))

  const economicBase = catalog.socialeconomic.map((ind) => {
    const v = byIndicator.get(ind._id)
    return {
      id: ind._id,
      label: ind.label,
      value: v?.rawValue ?? '—',
      variation: v?.variation ?? '',
      referenceYear: v?.referenceYear ?? ind.referenceYear ?? '',
    }
  })

  return { municipality: municipality.name, agendas, economicBase }
}

export function buildMapData(
  catalog: Catalog,
  municipalities: MunicipalityDoc[],
  allValues: IndicatorValueDoc[],
): MapData {
  // Opções do dropdown = todos os indicadores de agenda (mesma regra do
  // indicatorOptions do frontend).
  const agendaIndicators = catalog.agendas.flatMap(
    (a) => catalog.indicatorsByAgenda.get(a._id) ?? [],
  )
  const options = agendaIndicators.map((ind) => ({
    label: ind.label,
    shortLabel: ind.label,
    value: ind._id,
  }))
  const agendaIndicatorIds = new Set(agendaIndicators.map((i) => i._id))

  // Agrupa valores por município.
  const valuesByMunicipality = new Map<string, IndicatorValueDoc[]>()
  for (const v of allValues) {
    const list = valuesByMunicipality.get(v.municipalityId) ?? []
    list.push(v)
    valuesByMunicipality.set(v.municipalityId, list)
  }

  const out: Record<string, MapMunicipality> = {}
  for (const m of municipalities) {
    const byIndicator = indexValues(valuesByMunicipality.get(m._id) ?? [], catalog.byId)
    const indicators: MapMunicipality['indicators'] = {}
    for (const [indicatorId, v] of byIndicator) {
      if (!agendaIndicatorIds.has(indicatorId)) continue
      const n = parseNumeric(v.rawValue)
      if (n === null) continue
      indicators[indicatorId] = {
        value: v.rawValue,
        numericValue: n,
        status: computeStatus(catalog.byId.get(indicatorId)?.threshold, v.rawValue),
      }
    }
    out[m._id] = { name: m.name, indicators }
  }

  return { options, municipalities: out }
}
