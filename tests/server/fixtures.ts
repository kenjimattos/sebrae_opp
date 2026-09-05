// Fábrica de catálogo e documentos para os testes de costura (services.ts).
// Reproduz a garantia de repo.ts: `byId` e `indicatorsByAgenda` guardam
// referência aos MESMOS objetos — é isso que impede o detalhe e o mapa de
// lerem thresholds diferentes.
import type { Catalog } from '../../server/src/repo.js'
import type {
  AgendaDoc,
  IndicatorDoc,
  IndicatorValueDoc,
  MunicipalityDoc,
} from '../../server/src/types.js'

export const AGENDA: AgendaDoc = { _id: 'ambiente', name: 'Ambiente de negócio', order: 1 }

export const CAMPINA: MunicipalityDoc = {
  _id: '2504009',
  name: 'Campina Grande',
  slug: 'campina-grande',
}

export function agendaIndicator(
  id: string,
  extra: Partial<Omit<IndicatorDoc, '_id' | 'placements'>> = {},
): IndicatorDoc {
  return {
    _id: id,
    label: id,
    placements: [{ section: 'agenda', agendaId: AGENDA._id, order: 1 }],
    ...extra,
  }
}

export function socioeconomicIndicator(
  id: string,
  extra: Partial<Omit<IndicatorDoc, '_id' | 'placements'>> = {},
): IndicatorDoc {
  return {
    _id: id,
    label: id,
    placements: [{ section: 'socialeconomic', order: 1 }],
    ...extra,
  }
}

export function makeCatalog(indicators: IndicatorDoc[], agendas: AgendaDoc[] = [AGENDA]): Catalog {
  const indicatorsByAgenda = new Map<string, IndicatorDoc[]>()
  const socialeconomic: IndicatorDoc[] = []
  for (const ind of indicators) {
    for (const p of ind.placements) {
      if (p.section === 'agenda' && p.agendaId) {
        const list = indicatorsByAgenda.get(p.agendaId) ?? []
        list.push(ind)
        indicatorsByAgenda.set(p.agendaId, list)
      } else if (p.section === 'socialeconomic') {
        socialeconomic.push(ind)
      }
    }
  }
  return {
    agendas,
    indicatorsByAgenda,
    socialeconomic,
    byId: new Map(indicators.map((i) => [i._id, i])),
  }
}

export function valueDoc(
  indicatorId: string,
  referenceYear: string,
  numericValue: number | null | undefined,
  extra: Partial<IndicatorValueDoc> = {},
): IndicatorValueDoc {
  return {
    municipalityId: CAMPINA._id,
    indicatorId,
    referenceYear,
    numericValue,
    rawValue: numericValue == null ? '—' : String(numericValue).replace('.', ','),
    isFictional: false,
    ...extra,
  }
}
