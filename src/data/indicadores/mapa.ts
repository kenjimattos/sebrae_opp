// Derivado de catalogo.ts + municipios/*.ts + thresholds.ts.
// Converte valores "em linguagem humana" (ex: "R$ 185M", "12,84", "+3,2%*")
// em entradas { valor, valorNumerico, status } consumidas pelo ParaibaMap,
// ValueBadges e usePanoramaMedia.

import type { StatusType } from '@/types/indicadores'
import { catalogo } from '@/data/indicadores/catalogo'
import { valoresMap } from '@/data/indicadores/valores/index'
import { parseNumeric, deriveStatus } from '@/data/indicadores/thresholds'

export const indicadorOptions = catalogo.agendas.flatMap((a) =>
  a.indicadores.map((i) => ({
    label: i.label,
    shortLabel: i.label,
    value: i.id,
  })),
)

export type IndicadorKey = string

interface MapIndicadorEntry {
  valor: string
  valorNumerico?: number
  status: StatusType
}

interface MunicipioMapData {
  nome: string
  indicadores: Record<string, MapIndicadorEntry>
}

function buildMunicipioMapData(): Record<string, MunicipioMapData> {
  const out: Record<string, MunicipioMapData> = {}
  for (const [ibgeId, valores] of Object.entries(valoresMap)) {
    const indicadores: Record<string, MapIndicadorEntry> = {}
    for (const agenda of catalogo.agendas) {
      for (const ind of agenda.indicadores) {
        const raw = valores.agendas[ind.id]
        if (raw === undefined) continue
        const n = parseNumeric(raw)
        if (n === null) continue
        indicadores[ind.id] = {
          valor: String(raw),
          valorNumerico: n,
          status: deriveStatus(ind.id, raw),
        }
      }
    }
    out[ibgeId] = { nome: valores.municipio, indicadores }
  }
  return out
}

export const municipiosMapData: Record<string, MunicipioMapData> = buildMunicipioMapData()
