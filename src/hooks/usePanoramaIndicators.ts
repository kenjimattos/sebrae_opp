// Derives dropdown options from the catalog (all agenda indicators).
// Since MunicipalityProvider merges every municipality with the same catalog,
// the option list is identical regardless of the selected municipality.

import { indicatorOptions } from '@/data/indicators/map-data'

const options = indicatorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))

export function usePanoramaIndicators() {
  return options
}
