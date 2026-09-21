import type { Catalog } from '../indicadores/catalog.js'
import { computeStatus } from '../indicadores/status.js'
import { indexValues, isLowConfidence } from '../indicadores/values.js'
import type {
  IndicatorValueDoc,
  MapData,
  MapMunicipality,
  MunicipalityDoc,
} from '../types/index.js'

// Monta GET /api/map: um valor por município para cada indicador de agenda, que
// é o que colore o mapa, mais as opções do dropdown.
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
      if (isLowConfidence(v)) continue
      const n = v.numericValue
      if (typeof n !== 'number' || !Number.isFinite(n)) continue
      indicators[indicatorId] = {
        value: v.rawValue,
        numericValue: n,
        status: computeStatus(catalog.byId.get(indicatorId)?.threshold, v),
      }
    }
    out[m._id] = { name: m.name, indicators }
  }

  return { options, municipalities: out }
}
