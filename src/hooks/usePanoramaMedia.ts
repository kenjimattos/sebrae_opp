// Calculates state average for the selected indicator across all municipalities

import { useMemo } from 'react'
import {
  indicadorOptions,
  municipiosMapData,
  type IndicadorKey,
} from '@/data/mapa-indicadores'

interface MediaInfo {
  label: string
  formatted: string
  count: number
  municipioFormatted: string | null
  maiorFormatted: string
  maiorMunicipioNome: string
}

function formatValue(value: number, exemplo: string): string {
  if (exemplo.includes('%')) {
    return `${value.toFixed(1)}%`
  } else if (exemplo.includes('R$')) {
    return `R$ ${Math.round(value).toLocaleString('pt-BR')}`
  } else if (exemplo.includes(',') && !exemplo.includes('.') && value < 10) {
    return value.toFixed(3).replace('.', ',')
  } else if (value < 100) {
    return value.toFixed(1).replace('.', ',')
  } else {
    return Math.round(value).toLocaleString('pt-BR')
  }
}

export function usePanoramaMedia(indicador: IndicadorKey, municipioId: string): MediaInfo | null {
  return useMemo(() => {
    const valores: number[] = []
    for (const data of Object.values(municipiosMapData)) {
      const entry = data.indicadores[indicador]
      if (entry?.valorNumerico !== undefined) {
        valores.push(entry.valorNumerico)
      }
    }
    if (valores.length === 0) return null
    const soma = valores.reduce((acc, v) => acc + v, 0)
    const media = soma / valores.length
    const maior = Math.max(...valores)

    const opt = indicadorOptions.find((o) => o.value === indicador)
    const label = opt?.shortLabel ?? ''

    // Detect format from example value
    const exemplo = Object.values(municipiosMapData)[0]?.indicadores[indicador]?.valor ?? ''

    const formatted = formatValue(media, exemplo)
    const maiorFormatted = formatValue(maior, exemplo)

    // Selected municipality value
    const municipioEntry = municipiosMapData[municipioId]?.indicadores[indicador]
    const municipioFormatted = municipioEntry?.valorNumerico !== undefined
      ? formatValue(municipioEntry.valorNumerico, exemplo)
      : null

    const maiorMunicipioNome = Object.values(municipiosMapData).find(data => {
      const val = data.indicadores[indicador]?.valorNumerico
      return val === maior
    })?.nome ?? ''

      return { label, formatted, count: valores.length, municipioFormatted, maiorFormatted, maiorMunicipioNome }
  }, [indicador, municipioId])
}
