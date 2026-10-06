// Série histórica do indicador em linha.
//
// Escalada entre o MÍNIMO e o MÁXIMO da série, não a partir de zero: serve para
// ler a tendência, não a grandeza. É por isso que não é barra — barra promete
// base zero, e a população da Paraíba variando 18% em 25 anos viraria uma rampa
// do chão ao topo. Quem quer a grandeza lê o número acima.
//
// `preserveAspectRatio="none"` estica o traçado na horizontal; o
// `vector-effect="non-scaling-stroke"` é o que impede a espessura de esticar junto.

import type { StateSeriesPoint } from '@/types/estado'

interface SeriesLineProps {
  points: StateSeriesPoint[]
  label: string
  className?: string
}

const ALTURA = 32

export default function SeriesLine({ points, label, className = '' }: SeriesLineProps) {
  // Dois pontos é o mínimo para existir tendência.
  if (points.length < 2) return null
  const valores = points.map((p) => p.numericValue ?? 0)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const amplitude = max - min
  const primeiro = points[0]
  const ultimo = points[points.length - 1]

  // Série plana (amplitude 0) desenha no meio em vez de dividir por zero.
  const coords = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * 100
    const y = amplitude === 0 ? ALTURA / 2 : ALTURA - ((v - min) / amplitude) * ALTURA
    return `${x},${y}`
  })

  return (
    <div className={`flex flex-col gap-2xs ${className}`}>
      <svg
        viewBox={`0 0 100 ${ALTURA}`}
        preserveAspectRatio="none"
        className="w-full h-xl text-accent"
        role="img"
        aria-label={`${label}: de ${primeiro.value} em ${primeiro.referenceYear} a ${ultimo.value} em ${ultimo.referenceYear}`}
      >
        <polyline
          points={coords.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Marca o ano mais recente, que é o número exibido no card. */}
        <line
          x1="100"
          x2="100"
          y1={coords[coords.length - 1].split(',')[1]}
          y2={ALTURA}
          stroke="currentColor"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          opacity={0.5}
        />
      </svg>
      <div className="flex-between">
        <span className="typo-body-sm text-inactive tabular-nums">{primeiro.referenceYear}</span>
        <span className="typo-body-sm text-inactive">escala entre mínimo e máximo</span>
        <span className="typo-body-sm text-inactive tabular-nums">{ultimo.referenceYear}</span>
      </div>
    </div>
  )
}
