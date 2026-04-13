// Mapa interativo da Paraíba — Leaflet + Carto Positron + GeoJSON local
// Polígonos de municípios com badges de valor (estilo QuintoAndar)

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import type { Feature } from 'geojson'
import 'leaflet/dist/leaflet.css'

import geoData from '@/data/paraiba-municipios.json'
import {
  municipiosMapData,
  type IndicadorKey,
} from '@/data/mapa-indicadores'
import type { StatusType } from '@/types/indicadores'

interface ParaibaMapProps {
  selectedId: string
  indicador: IndicadorKey
  className?: string
}

// Leaflet não resolve CSS variables — extraímos valores computados
function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getResolvedStatusFill(status: StatusType): string {
  const map: Record<StatusType, string> = {
    success: getCSSVar('--semantic-success-surface'),
    warning: getCSSVar('--semantic-warning-surface'),
    alert: getCSSVar('--semantic-alert-surface'),
  }
  return map[status]
}

function getStatus(id: string, indicador: IndicadorKey): StatusType | null {
  const data = municipiosMapData[id]
  if (!data) return null
  return data.indicadores[indicador]?.status ?? null
}

function getDisplayValue(id: string, indicador: IndicadorKey): string | null {
  const data = municipiosMapData[id]
  if (!data) return null
  return data.indicadores[indicador]?.valor ?? null
}

// Calcula centróide de um Polygon
function getCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0]
  let latSum = 0
  let lonSum = 0
  for (const [lon, lat] of ring) {
    latSum += lat
    lonSum += lon
  }
  return [latSum / ring.length, lonSum / ring.length]
}

// Limites da Paraíba para restringir pan
const PARAIBA_BOUNDS: L.LatLngBoundsExpression = [
  [-8.4, -38.8], // sudoeste
  [-5.9, -34.7], // nordeste
]

// Componente de badges (markers com DivIcon) sobre o mapa
function ValueBadges({ indicador }: { indicador: IndicadorKey }) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Limpar markers anteriores
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

export default function ParaibaMap({ selectedId, indicador, className = '' }: ParaibaMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  const styleFeature = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature?.properties) return { fillOpacity: 0 }

      const id = String(feature.properties.id)
      const isSelected = id === selectedId
      const status = getStatus(id, indicador)
      const hasData = status !== null

      let fillColor: string
      let fillOpacity: number
      if (isSelected) {
        fillColor = getCSSVar('--semantic-surface-tertiary')
        fillOpacity = 0.6
      } else if (hasData) {
        fillColor = getResolvedStatusFill(status)
        fillOpacity = 0.35
      } else {
        fillColor = getCSSVar('--semantic-surface-secondary')
        fillOpacity = 0.15
      }

      return {
        fillColor,
        fillOpacity,
        color: isSelected
          ? getCSSVar('--semantic-text-primary')
          : getCSSVar('--semantic-surface-tertiary'),
        weight: isSelected ? 2 : 0.8,
      }
    },
    [selectedId, indicador],
  )

  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      const id = String(feature.properties?.id)
      const status = getStatus(id, indicador)
      const hasData = status !== null

      const path = layer as L.Path
      path.on({
        mouseover: (e: LeafletMouseEvent) => {
          if (!hasData) return
          const isSelected = id === selectedId
          if (isSelected) return
          e.target.setStyle({
            fillOpacity: 0.55,
            weight: 1.5,
          })
        },
        mouseout: () => {
          if (!hasData) return
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(path)
          }
        },
      })
    },
    [selectedId, indicador],
  )

  const geoKey = useMemo(() => `${indicador}-${selectedId}`, [indicador, selectedId])

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[-7.1, -36.5]}
        zoom={8}
        minZoom={7}
        maxZoom={12}
        zoomControl={true}
        attributionControl={false}
        maxBounds={PARAIBA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '480px', width: '100%' }}
        className="rounded-[var(--radius-sm)]"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <GeoJSON
          key={geoKey}
          ref={geoJsonRef}
          data={geoData as GeoJSON.FeatureCollection}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
        <ValueBadges indicador={indicador} />
      </MapContainer>
    </div>
  )
}
