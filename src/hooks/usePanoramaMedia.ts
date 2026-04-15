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
}

export function usePanoramaMedia(indicador: IndicadorKey): MediaInfo | null {
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

    const opt = indicadorOptions.find((o) => o.value === indicador)
    const label = opt?.shortLabel ?? ''

    // Detect format from example value
    const exemplo = Object.values(municipiosMapData)[0]?.indicadores[indicador]?.valor ?? ''
    let formatted: string
    if (exemplo.includes('%')) {
      formatted = `${media.toFixed(1)}%`
    } else if (exemplo.includes('R$')) {
      formatted = `R$ ${Math.round(media).toLocaleString('pt-BR')}`
    } else if (exemplo.includes(',') && !exemplo.includes('.') && media < 10) {
      formatted = media.toFixed(3).replace('.', ',')
    } else if (media < 100) {
      formatted = media.toFixed(1).replace('.', ',')
    } else {
      formatted = Math.round(media).toLocaleString('pt-BR')
    }

    return { label, formatted, count: valores.length }
  }, [indicador])
}
