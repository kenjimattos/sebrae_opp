// Distribuição do indicador em barras horizontais — uma fatia por linha,
// rótulo à esquerda, valor à direita.
//
// A barra é SEMPRE zero-based: o comprimento é a grandeza, e é a única promessa
// que ela faz. Por isso `max` existe — numa nota de 0 a 1.000 o limite da escala
// é 1.000, não a maior das quatro áreas; escalar pela maior esticaria 390 pontos
// até a borda e faria o pior resultado parecer o teto.

import { formatNumberBR, type StateSlice } from '@/utils/estado'

interface BreakdownBarsProps {
  slices: StateSlice[]
  /** Fim da escala. Default: a maior fatia (composição de um total). */
  max?: number
  caption?: string
  className?: string
}

export default function BreakdownBars({ slices, max, caption, className = '' }: BreakdownBarsProps) {
  if (slices.length === 0) return null
  const limite = max ?? Math.max(...slices.map((s) => s.value))
  if (limite <= 0) return null

  return (
    <div className={`flex flex-col gap-2xs ${className}`}>
      {slices.map((slice) => (
        <div key={slice.label} className="flex items-center gap-xs">
          <span className="typo-body-sm w-2/5 shrink-0 truncate" title={slice.label}>
            {slice.label}
          </span>
          <span className="h-2xs flex-1 rounded-full bg-surface-tertiary overflow-hidden">
            <span
              aria-hidden
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, (slice.value / limite) * 100)}%` }}
            />
          </span>
          <span className="typo-body-sm-bold w-1/5 shrink-0 text-right tabular-nums">
            {formatNumberBR(slice.value)}
          </span>
        </div>
      ))}
      {caption && <p className="typo-body-sm text-inactive pt-2xs">{caption}</p>}
    </div>
  )
}
