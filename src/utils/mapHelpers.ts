// Helper functions for the Paraíba interactive map

import {
  municipiosMapData,
  type IndicadorKey,
} from '@/data/indicadores/mapa'
import type { StatusType } from '@/types/indicadores'

/** Leaflet can't resolve CSS variables — extract computed values */
export function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function getResolvedStatusFill(status: StatusType): string {
  const map: Record<StatusType, string> = {
    success: getCSSVar('--semantic-success-surface'),
    warning: getCSSVar('--semantic-warning-surface'),
    alert: getCSSVar('--semantic-alert-surface'),
  }
  return map[status]
}

export function getStatus(id: string, indicador: IndicadorKey): StatusType | null {
  const data = municipiosMapData[id]
  if (!data) return null
  return data.indicadores[indicador]?.status ?? null
}

export function getDisplayValue(id: string, indicador: IndicadorKey): string | null {
  const data = municipiosMapData[id]
  if (!data) return null
  return data.indicadores[indicador]?.valor ?? null
}

/** Compute centroid of a Polygon ring */
export function getCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0]
  let latSum = 0
  let lonSum = 0
  for (const [lon, lat] of ring) {
    latSum += lat
    lonSum += lon
  }
  return [latSum / ring.length, lonSum / ring.length]
}
