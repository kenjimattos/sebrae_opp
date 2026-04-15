// Derives dropdown options from the selected municipality's agenda indicators

import { useMemo } from 'react'
import { useMunicipio } from '@/hooks/useMunicipio'
import {
  indicadorOptions,
  labelToKey,
} from '@/data/mapa-indicadores'

export function usePanoramaIndicadores() {
  const { municipio } = useMunicipio()

  const dropdownOptions = useMemo(() => {
    if (!municipio.dados) return indicadorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))
    const options: { label: string; value: string }[] = []
    for (const agenda of municipio.dados.agendas) {
      for (const ind of agenda.indicadores) {
        const key = labelToKey[ind.label]
        if (key) {
          const opt = indicadorOptions.find((o) => o.value === key)
          if (opt) options.push({ label: opt.shortLabel, value: opt.value })
        }
      }
    }
    return options.length > 0 ? options : indicadorOptions.map((o) => ({ label: o.shortLabel, value: o.value }))
  }, [municipio.dados])

  return dropdownOptions
}
