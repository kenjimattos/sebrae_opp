// Derives dropdown options from the catalog (all agenda indicators).
// Since MunicipioProvider merges every municipality with the same catalog,
// the option list is identical regardless of the selected municipality.

import { indicadorOptions } from '@/data/indicadores/mapa'

const options = indicadorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))

export function usePanoramaIndicadores() {
  return options
}
