// Derivado de catalogo.ts + municipios/*.ts + thresholds.ts.
// Converte valores "em linguagem humana" (ex: "R$ 185M", "12,84", "+3,2%*")
// em entradas { valor, valorNumerico, status } consumidas pelo ParaibaMap,
// ValueBadges e usePanoramaMedia.

import type { StatusType } from '@/types/indicators'
import { catalog } from '@/data/indicators/catalog'
import { valuesMap } from '@/data/indicators/values/index'
import { parseNumeric, deriveStatus } from '@/data/indicators/thresholds'

export const indicatorOptions = catalog.agendas.flatMap((a) =>
  a.indicators.map((i) => ({
    label: i.label,
    shortLabel: i.label,
    value: i.id,
  })),
)

export type IndicatorKey = string

interface MapIndicatorEntry {
  value: string
  numericValue?: number
  status: StatusType
}

interface MunicipalityMapData {
  name: string
  indicators: Record<string, MapIndicatorEntry>
}

function buildMunicipalityMapData(): Record<string, MunicipalityMapData> {
  const out: Record<string, MunicipalityMapData> = {}
  for (const [ibgeId, values] of Object.entries(valuesMap)) {
    const indicators: Record<string, MapIndicatorEntry> = {}
    for (const agenda of catalog.agendas) {
      for (const ind of agenda.indicators) {
        const raw = values.agendas[ind.id]
        if (raw === undefined) continue
        const n = parseNumeric(raw)
        if (n === null) continue
        indicators[ind.id] = {
          value: String(raw),
          numericValue: n,
          status: deriveStatus(ind.id, raw),
        }
      }
    }
    out[ibgeId] = { name: values.municipality, indicators }
  }
  return out
}

export const municipalitiesMapData: Record<string, MunicipalityMapData> = buildMunicipalityMapData()
