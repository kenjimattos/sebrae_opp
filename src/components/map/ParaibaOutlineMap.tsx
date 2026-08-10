import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  /**
   * Linha extra no tooltip do hover (ex.: o valor do município). Recebe o
   * código IBGE; devolver null/'' mostra só o nome, como antes.
   */
  tooltipDetail?: (id: string) => string | null;
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
  tooltipDetail,
  onHover,
  onSelect,
  selectedId,
  padding = 2,
  fillColor = 'var(--semantic-surface-primary)',
  hoverFillColor = 'var(--semantic-accent)',
  selectedFillColor = 'var(--semantic-accent)',
  strokeColor = 'var(--semantic-text-inactive)',
  accentStrokeColor = 'var(--semantic-accent)',
}: ParaibaOutlineMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Posição do cursor em coordenadas de viewport (pra um tooltip `fixed`).
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

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
    // Rampa sequencial de matiz única: mistura o acento na superfície conforme a
    // intensidade. Varrer o matiz (azul→vermelho) leria como categorias, não como
    // "mais ou menos recurso". O piso de 8% mantém o município visível no mapa.
    const pct = Math.round((0.08 + Math.min(Math.max(v, 0), 1) * 0.92) * 100);
    return `color-mix(in oklab, ${hoverFillColor} ${pct}%, ${fillColor})`;
  };

  const hovered = hoveredId
    ? data.municipalities.find((m) => m.id === hoveredId)
    : null;
  const hoveredName = hovered?.name ?? null;
  const hoveredDetail = hovered && tooltipDetail ? tooltipDetail(hovered.id) : null;

  return (
    <>
      {/* Tooltip `fixed`: posicionado pela viewport, sem exigir um wrapper
          `relative` em volta do SVG — assim o mapa continua sendo conteúdo
          não-posicionado e não passa por cima de dropdowns vizinhos.
          Vai por PORTAL no body porque `backdrop-filter` (a classe `.glass`)
          cria containing block para `position: fixed`: dentro de um container
          glass, as coordenadas da viewport passariam a valer a partir da caixa
          do container e o tooltip aparecia deslocado — ou fora da tela. */}
      {hoveredName && cursor && createPortal(
        <div
          className={`glass glass-bevel pointer-events-none fixed z-50 whitespace-nowrap px-sm py-xs ${
            hoveredDetail ? 'flex flex-col items-center rounded-sm' : 'rounded-full'
          }`}
          style={{ left: cursor.x, top: cursor.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
        >
          <span className="typo-body-bold">{hoveredName}</span>
          {hoveredDetail && <span className="typo-body-sm">{hoveredDetail}</span>}
        </div>,
        document.body,
      )}
      <svg
        viewBox={expandedViewBox}
        className={'w-full h-auto'}
        onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => {
          // Garantia no nível do SVG: o mouseleave do <path> pode não disparar
          // (movimento rápido, reordenação do DOM pelo sort do hover), deixando
          // o último município preso no estado de hover.
          setCursor(null);
          setHoveredId(null);
          onHover?.(null);
        }}
      >
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
    </>
  );
}
