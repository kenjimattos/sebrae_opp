// Tailwind pure — no Figma equivalent
// Pôster de um curso no catálogo /trilhas. Substitui o TrailCard (landscape,
// CTA em botão) por uma face vertical de catálogo: carga horária no topo como
// "runtime", título embaixo e um medidor de carga no pé, proporcional ao curso
// mais pesado da MESMA trilha — a fileira inteira vira um perfil de esforço.
//
// O pôster inteiro é o alvo do clique (<a> externo). Curso sem URL não vira
// link: continua no catálogo, esmaecido e rotulado.

import { parseHours } from '@/utils/courseLoad'

interface CoursePosterProps {
  id?: string
  title: string
  duration: string
  href?: string
  /** Fração 0..1 da carga frente ao curso mais pesado da trilha. */
  load: number
  highlighted?: boolean
  className?: string
}

export default function CoursePoster({
  id,
  title,
  duration,
  href,
  load,
  highlighted = false,
  className = '',
}: CoursePosterProps) {
  const hours = parseHours(duration)
  const ring = highlighted ? 'outline outline-2 outline-accent outline-offset-[3px]' : ''
  const style = { '--load': load } as React.CSSProperties

  const face = (
    <>
      <p className="flex flex-col gap-2xs">
        <span className="poster__hours">{hours ?? '—'}</span>
        <span className="typo-body-sm text-inactive">{hours === 1 ? 'hora' : 'horas'}</span>
      </p>

      <div className="flex flex-col gap-xs">
        <h4 className="typo-title-sm line-clamp-4">{title}</h4>
        <p className="poster__cta typo-body-sm text-accent">
          {href ? 'Escola Virtual do Governo ↗' : 'Link indisponível'}
        </p>
      </div>

      <span className="poster__meter" aria-hidden />
    </>
  )

  if (!href) {
    return (
      <div id={id} style={style} className={`poster poster--inert ${className}`}>
        {face}
      </div>
    )
  }

  return (
    <a
      id={id}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className={`poster ${ring} ${className}`}
    >
      {face}
    </a>
  )
}
