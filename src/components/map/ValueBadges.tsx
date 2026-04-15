// Badge markers (DivIcon) displayed over municipality centroids on the map

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { StatusType } from '@/types/indicadores'
import type { IndicadorKey } from '@/data/mapa-indicadores'
import geoData from '@/data/paraiba-municipios.json'
import { getCSSVar, getStatus, getDisplayValue, getCentroid } from '@/utils/mapHelpers'

export default function ValueBadges({ indicador }: { indicador: IndicadorKey }) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Clear previous markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const features = (geoData as GeoJSON.FeatureCollection).features
    for (const feature of features) {
      const id = String(feature.properties?.id)
      const status = getStatus(id, indicador)
      if (!status) continue

      const valor = getDisplayValue(id, indicador)
      if (!valor) continue

      const geom = feature.geometry as GeoJSON.Polygon
      const [lat, lon] = getCentroid(geom.coordinates)

      const statusColorMap: Record<StatusType, { bg: string; text: string; border: string }> = {
        success: {
          bg: getCSSVar('--semantic-success-surface'),
          text: getCSSVar('--semantic-success'),
          border: getCSSVar('--semantic-success'),
        },
        warning: {
          bg: getCSSVar('--semantic-warning-surface'),
          text: getCSSVar('--semantic-warning'),
          border: getCSSVar('--semantic-warning'),
        },
        alert: {
          bg: getCSSVar('--semantic-alert-surface'),
          text: getCSSVar('--semantic-alert'),
          border: getCSSVar('--semantic-alert'),
        },
      }

      const colors = statusColorMap[status]

      const icon = L.divIcon({
        className: 'mapa-badge',
        html: `<div class="mapa-badge-inner" style="
          background: ${colors.bg};
          color: ${colors.text};
          border: 1px solid ${colors.border};
        ">${valor}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([lat, lon], { icon, interactive: false })
      marker.addTo(map)
      markersRef.current.push(marker)
    }

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [map, indicador])

  return null
}
