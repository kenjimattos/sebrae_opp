import type { Catalog } from '../indicadores/catalog.js'
import { computeStatus } from '../indicadores/status.js'
import { indexValues, isLowConfidence } from '../indicadores/values.js'
import type {
  IndicatorsData,
  IndicatorValueDoc,
  MunicipalityDoc,
} from '../types/index.js'

// Monta GET /api/municipalities/:id — agendas + base econômica de um município,
// com o status já calculado. Espelha o buildIndicators() que o frontend tinha.
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
      const suppressed = isLowConfidence(v)
      return {
        id: ind._id,
        label: ind.label,
        value: suppressed ? '—' : v?.rawValue ?? '—',
        // O número vai junto do texto: o frontend precisa dele para posicionar o
        // marcador da IndicatorBar, e reconstruí-lo do `value` custaria a mesma
        // precisão que o semáforo já perdia.
        numericValue: suppressed ? null : v?.numericValue ?? null,
        variation: suppressed ? undefined : v?.variation,
        status: suppressed ? 'none' : computeStatus(ind.threshold, v),
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
