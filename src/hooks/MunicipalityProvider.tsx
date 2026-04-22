import { useMemo, useState, useCallback, type ReactNode } from 'react'
import {
  MunicipalityContext,
  type MunicipalityChangeOrigin,
  type MunicipalityState,
} from '@/hooks/useMunicipality'
import type { IndicatorsData, MunicipalityValues } from '@/types/indicators'
import { catalog } from '@/data/indicators/catalog'
import { deriveStatus } from '@/data/indicators/thresholds'
import { valuesMap } from '@/data/indicators/values/index'
import { setTag, trackEvent } from '@/utils/analytics'

// Merges catalog (structure) with municipality values and applies thresholds.
function buildIndicators(values: MunicipalityValues): IndicatorsData {
  return {
    municipality: values.municipality,
    agendas: catalog.agendas.map((a) => ({
      id: a.id,
      name: a.name,
      indicators: a.indicators.map((i) => {
        const value = values.agendas[i.id] ?? '—'
        return {
          id: i.id,
          label: i.label,
          value,
          status: deriveStatus(i.id, value),
        }
      }),
    })),
    economicBase: catalog.economicBase.map((b) => {
      const v = values.economicBase[b.id] ?? { value: '—', variation: '' }
      return {
        id: b.id,
        label: b.label,
        value: v.value,
        variation: v.variation,
        icon: b.icon,
      }
    }),
  }
}

const dataMap: Record<string, IndicatorsData> = Object.fromEntries(
  Object.entries(valuesMap).map(([id, v]) => [id, buildIndicators(v)]),
)

const defaultId = '2504009'
const defaultMunicipality: MunicipalityState = {
  id: defaultId,
  name: dataMap[defaultId].municipality,
  data: dataMap[defaultId],
}

export default function MunicipalityProvider({ children }: { children: ReactNode }) {
  const [municipality, setMunicipalityState] = useState<MunicipalityState>(defaultMunicipality)

  const setMunicipality = useCallback(
    (id: string, name: string, origin?: MunicipalityChangeOrigin) => {
      setMunicipalityState((prev) => {
        if (prev.id !== id) {
          trackEvent('municipio_alterado', {
            de: prev.name,
            para: name,
            origem: origin ?? 'desconhecida',
          })
          setTag('municipio', name)
        }
        return { id, name, data: dataMap[id] ?? null }
      })
    },
    [],
  )

  const value = useMemo(() => ({ municipality, setMunicipality }), [municipality, setMunicipality])

  return <MunicipalityContext.Provider value={value}>{children}</MunicipalityContext.Provider>
}
