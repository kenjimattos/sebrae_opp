// Helper functions for the Paraíba interactive map

import {
  municipalitiesMapData,
  type IndicatorKey,
} from '@/data/indicators/map-data'
import type { StatusType } from '@/types/indicators'

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

export function getStatus(id: string, indicator: IndicatorKey): StatusType | null {
  const data = municipalitiesMapData[id]
  if (!data) return null
  return data.indicators[indicator]?.status ?? null
}

export function getDisplayValue(id: string, indicator: IndicatorKey): string | null {
  const data = municipalitiesMapData[id]
  if (!data) return null
  return data.indicators[indicator]?.value ?? null
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
