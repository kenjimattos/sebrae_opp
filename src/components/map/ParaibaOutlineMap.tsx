import { useMemo, useState } from 'react';
import paraibaGeo from '@/data/geo/paraiba.json';

type Ring = [number, number][];

interface GeoFeature {
  properties: { id: string; name: string };
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

interface Municipality {
  id: string;
  name: string;
  d: string;
}

interface ComputedMap {
  viewBox: string;
  municipalities: Municipality[];
}

interface ParaibaOutlineMapProps {
  /** Map opcional de código IBGE → valor do indicador (0-1) pra colorir os municípios */
  values?: Record<string, number>;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  selectedId?: string;
  /** Padding extra (em unidades do viewBox) para evitar clipping do stroke */
  padding?: number;
  className?: string;
  /** Cor de preenchimento default (quando não há valor no map values) */
  fillColor?: string;
  /** Cor de preenchimento no hover (quando não há valor no map values) */
  hoverFillColor?: string;
  /** Cor de preenchimento do município selecionado */
  selectedFillColor?: string;
  /** Cor do stroke default */
  strokeColor?: string;
  /** Cor do stroke no hover e no município selecionado */
  accentStrokeColor?: string;
}

const CANVAS_W = 1000;
const CANVAS_H = 460;

function extractPolygons(feature: GeoFeature): Ring[][] {
  if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates];
  return feature.geometry.coordinates;
}

function computeMap(geojson: { features: GeoFeature[] }): ComputedMap {
  const features = geojson.features;

  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const f of features) {
    for (const poly of extractPolygons(f)) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
  }

  const aspectGeo = (maxLon - minLon) / (maxLat - minLat);
  const aspectCanvas = CANVAS_W / CANVAS_H;
  let w = CANVAS_W;
  let h = CANVAS_H;
  if (aspectGeo > aspectCanvas) h = CANVAS_W / aspectGeo;
  else w = CANVAS_H * aspectGeo;

  const project = (lon: number, lat: number): [number, number] => [
    ((lon - minLon) / (maxLon - minLon)) * w,
    ((maxLat - lat) / (maxLat - minLat)) * h,
  ];

  const municipalities: Municipality[] = features.map((f) => {
    const polys = extractPolygons(f);
    const d = polys
      .map((poly) =>
        poly
          .map((ring) => {
            const pts = ring.map(([lon, lat]) => project(lon, lat));
            return (
              `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}` +
              pts
                .slice(1)
                .map((p) => `L${p[0].toFixed(2)},${p[1].toFixed(2)}`)
                .join('') +
              'Z'
            );
          })
          .join(''),
      )
      .join('');
    return { id: f.properties.id, name: f.properties.name, d };
  });

  return {
    viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`,
    municipalities,
  };
}

export function ParaibaOutlineMap({
  values,
  onHover,
  onSelect,
  selectedId,
  padding = 2,
  className,
  fillColor = 'var(--semantic-surface-primary)',
  hoverFillColor = 'var(--semantic-accent)',
  selectedFillColor = 'var(--semantic-accent)',
  strokeColor = 'var(--semantic-text-inactive)',
  accentStrokeColor = 'var(--semantic-accent)',
}: ParaibaOutlineMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const data = useMemo(
    () => computeMap(paraibaGeo as unknown as { features: GeoFeature[] }),
    [],
  );

  const [vx, vy, vw, vh] = data.viewBox.split(/\s+/).map(Number);
  const expandedViewBox = `${vx - padding} ${vy - padding} ${vw + padding * 2} ${vh + padding * 2}`;

  const fillFor = (id: string, isHover: boolean, isSelected: boolean) => {
    if (isSelected) return selectedFillColor;
    const v = values?.[id];
    if (v === undefined) {
      return isHover ? hoverFillColor : fillColor;
    }
    return `oklch(0.6 0.15 ${220 - v * 180})`;
  };

  return (
    <svg viewBox={expandedViewBox} className={className ?? 'w-full h-full'}>
      <g>
        {[...data.municipalities]
          .sort((a, b) => {
            const score = (id: string) =>
              id === selectedId ? 2 : id === hoveredId ? 1 : 0;
            return score(a.id) - score(b.id);
          })
          .map((m) => {
          const isHover = hoveredId === m.id;
          const isSelected = selectedId === m.id;
          return (
            <path
              key={m.id}
              d={m.d}
              fill={fillFor(m.id, isHover, isSelected)}
              fillOpacity={isSelected ? 1 : isHover ? 1 : 1}
              stroke={isSelected || isHover ? accentStrokeColor : strokeColor}
              strokeWidth={isSelected ? 1.5 : isHover ? 1.25 : 1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ cursor: 'pointer', transition: 'fill 120ms, fill-opacity 120ms, stroke 120ms' }}
              onMouseEnter={() => {
                setHoveredId(m.id);
                onHover?.(m.id);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                onHover?.(null);
              }}
              onClick={() => onSelect?.(m.id)}
              aria-label={m.name}
            />
          );
        })}
      </g>
    </svg>
  );
}
