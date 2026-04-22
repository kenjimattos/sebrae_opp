// Calculates state average for the selected indicator across all municipalities

import { useMemo } from 'react'
import {
  indicatorOptions,
  municipalitiesMapData,
  type IndicatorKey,
} from '@/data/indicators/map-data'

interface AverageInfo {
  label: string
  formatted: string
  count: number
  municipalityFormatted: string | null
  highestFormatted: string
  highestMunicipalityName: string
}

function formatValue(value: number, example: string): string {
  if (example.includes('%')) {
    return `${value.toFixed(1)}%`
  } else if (example.includes('R$')) {
    return `R$ ${Math.round(value).toLocaleString('pt-BR')}`
  } else if (example.includes(',') && !example.includes('.') && value < 10) {
    return value.toFixed(3).replace('.', ',')
  } else if (value < 100) {
    return value.toFixed(1).replace('.', ',')
  } else {
    return Math.round(value).toLocaleString('pt-BR')
  }
}

export function usePanoramaMedia(indicator: IndicatorKey, municipalityId: string): AverageInfo | null {
  return useMemo(() => {
    const values: number[] = []
    for (const data of Object.values(municipalitiesMapData)) {
      const entry = data.indicators[indicator]
      if (entry?.numericValue !== undefined) {
        values.push(entry.numericValue)
      }
    }
    if (values.length === 0) return null
    const sum = values.reduce((acc, v) => acc + v, 0)
    const average = sum / values.length
    const highest = Math.max(...values)

    const opt = indicatorOptions.find((o) => o.value === indicator)
    const label = opt?.shortLabel ?? ''

    // Detect format from example value
    const example = Object.values(municipalitiesMapData)[0]?.indicators[indicator]?.value ?? ''

    const formatted = formatValue(average, example)
    const highestFormatted = formatValue(highest, example)

    // Selected municipality value
    const municipalityEntry = municipalitiesMapData[municipalityId]?.indicators[indicator]
    const municipalityFormatted = municipalityEntry?.numericValue !== undefined
      ? formatValue(municipalityEntry.numericValue, example)
      : null

    const highestMunicipalityName = Object.values(municipalitiesMapData).find(data => {
      const val = data.indicators[indicator]?.numericValue
      return val === highest
    })?.name ?? ''

      return { label, formatted, count: values.length, municipalityFormatted, highestFormatted, highestMunicipalityName }
  }, [indicator, municipalityId])
}
