// Mapa interativo da Paraíba — Leaflet + Carto Positron + GeoJSON local
// Polígonos de municípios com badges de valor (estilo QuintoAndar)

import { useMemo, useCallback, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import type { Feature } from 'geojson'
import 'leaflet/dist/leaflet.css'

import geoData from '@/data/paraiba-municipios.json'
import type { IndicadorKey } from '@/data/mapa-indicadores'
import { getCSSVar, getResolvedStatusFill, getStatus } from '@/utils/mapHelpers'
import ValueBadges from '@/components/map/ValueBadges'

interface ParaibaMapProps {
  selectedId: string
  indicador: IndicadorKey
  className?: string
}

// Limites da Paraíba para restringir pan
const PARAIBA_BOUNDS: L.LatLngBoundsExpression = [
  [-8.4, -38.8], // sudoeste
  [-5.9, -34.7], // nordeste
]

export default function ParaibaMap({ selectedId, indicador, className = '' }: ParaibaMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [active, setActive] = useState(false)

  function activateMap() {
    if (active || !mapRef.current) return
    setActive(true)
    mapRef.current.scrollWheelZoom.enable()
    mapRef.current.dragging.enable()
  }

  function deactivateMap() {
    if (!mapRef.current) return
    setActive(false)
    mapRef.current.scrollWheelZoom.disable()
    mapRef.current.dragging.disable()
  }

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
    <div
      className={`relative group ${className}`}
      onMouseLeave={deactivateMap}
    >
      <MapContainer
        center={[-7.1, -36.5]}
        zoom={8}
        minZoom={7}
        maxZoom={12}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={true}
        attributionControl={false}
        maxBounds={PARAIBA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '480px', width: '100%' }}
        className="radius-sm"
        ref={mapRef}
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

      {/* Overlay — click to interact */}
      {!active && (
        <div
          onClick={activateMap}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center radius-sm cursor-pointer z-[1000]"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface typo-body-bold px-md py-sm radius-full shadow-lg">
            Clique para interagir com o mapa
          </span>
        </div>
      )}
    </div>
  )
}
