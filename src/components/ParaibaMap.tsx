// Mapa SVG interativo da Paraíba — React Simple Maps + GeoJSON IBGE
// Coloração por status do indicador (success/warning/alert), tooltip no hover, destaque do município selecionado

import { useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import {
  municipiosMapData,
  type IndicadorKey,
} from '@/data/mapa-indicadores'
import type { StatusType } from '@/types/indicadores'

const GEO_URL =
  'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-25-mun.json'

interface ParaibaMapProps {
  selectedId: string
  indicador: IndicadorKey
  className?: string
}

const statusFill: Record<StatusType, string> = {
  success: 'var(--semantic-success-surface)',
  warning: 'var(--semantic-warning-surface)',
  alert: 'var(--semantic-alert-surface)',
}

const statusHoverFill: Record<StatusType, string> = {
  success: 'var(--semantic-success)',
  warning: 'var(--semantic-warning)',
  alert: 'var(--semantic-alert)',
}

function getStatus(id: string, indicador: IndicadorKey): StatusType | null {
  const data = municipiosMapData[id]
  if (!data) return null
  const entry = data.indicadores[indicador]
  if (!entry) return null
  return entry.status
}

function getDisplayValue(id: string, indicador: IndicadorKey): string | null {
  const data = municipiosMapData[id]
  if (!data) return null
  return data.indicadores[indicador]?.valor ?? null
}

function getMunicipioNome(id: string): string | null {
  return municipiosMapData[id]?.nome ?? null
}

interface TooltipData {
  nome: string
  valor: string
  x: number
  y: number
}

export default function ParaibaMap({ selectedId, indicador, className = '' }: ParaibaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const handleMouseEnter = useCallback(
    (geo: { properties: { id: string; name: string } }, event: React.MouseEvent) => {
      const id = String(geo.properties.id)
      const status = getStatus(id, indicador)
      // Sem dados = sem tooltip
      if (!status) return
      const nome = getMunicipioNome(id) || (geo.properties.name as string)
      const valor = getDisplayValue(id, indicador) || 'N/D'
      const rect = (event.currentTarget as Element).closest('svg')?.getBoundingClientRect()
      if (rect) {
        setTooltip({
          nome,
          valor,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 12,
        })
      }
    },
    [indicador],
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-36.5, -7.1],
          scale: 6000,
        }}
        width={600}
        height={400}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup
          minZoom={1}
          maxZoom={8}
          translateExtent={[
            [-100, -100],
            [700, 500],
          ]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const id = String(geo.properties.id)
                const isSelected = id === selectedId
                const status = getStatus(id, indicador)
                const hasData = status !== null

                let fill: string
                if (isSelected) {
                  fill = 'var(--semantic-surface-tertiary)'
                } else if (hasData) {
                  fill = statusFill[status]
                } else {
                  fill = 'var(--semantic-surface-secondary)'
                }

                const hoverFill = isSelected
                  ? 'var(--semantic-surface-tertiary)'
                  : hasData
                    ? statusHoverFill[status]
                    : 'var(--semantic-surface-secondary)'

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) =>
                      handleMouseEnter(
                        geo as unknown as { properties: { id: string; name: string } },
                        event as unknown as React.MouseEvent,
                      )
                    }
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected
                          ? 'var(--semantic-text-primary)'
                          : 'var(--semantic-surface-primary)',
                        strokeWidth: isSelected ? 1.5 : 0.5,
                        outline: 'none',
                        cursor: hasData ? 'default' : 'default',
                      },
                      hover: {
                        fill: hoverFill,
                        stroke: hasData
                          ? 'var(--semantic-text-inactive)'
                          : 'var(--semantic-surface-primary)',
                        strokeWidth: hasData ? 1 : 0.5,
                        outline: 'none',
                        cursor: 'default',
                      },
                      pressed: {
                        fill,
                        stroke: 'var(--semantic-text-primary)',
                        strokeWidth: 1.5,
                        outline: 'none',
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold text-[length:var(--font-size-body-sm)] text-[color:var(--semantic-text-primary)] whitespace-nowrap">
            {tooltip.nome}
          </p>
          <p className="font-normal text-[length:var(--font-size-body-sm)] text-[color:var(--semantic-text-inactive)] whitespace-nowrap">
            {tooltip.valor}
          </p>
        </div>
      )}

      {/* Zoom hint */}
      <p className="absolute bottom-[var(--spacing-xs)] right-[var(--spacing-xs)] text-[length:var(--font-size-body-sm)] text-[color:var(--semantic-text-inactive)]">
        Scroll para zoom
      </p>
    </div>
  )
}
