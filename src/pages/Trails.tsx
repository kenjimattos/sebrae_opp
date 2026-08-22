// Página /trilhas — catálogo de capacitação. Billboard + barra de eixos +
// uma fileira full-bleed por trilha, com um pôster por curso.
//
// Navegação por hash (usada pelos links do TrainingCard na Home):
//   /trilhas#trilha-{slug}       → rola até a fileira
//   /trilhas#curso-{slug}-{idx}  → rola até o pôster e o destaca

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CatalogBillboard from '@/components/training/CatalogBillboard'
import CatalogRow from '@/components/training/CatalogRow'
import CoursePoster from '@/components/training/CoursePoster'
import TrailNav from '@/components/training/TrailNav'
import { trails, trailAnchor, courseAnchor } from '@/data/home/training'
import { trailLoad, loadRatio, formatHours } from '@/utils/courseLoad'

// Compensa a barra de eixos sticky (~52px) + respiro, aplicado nos alvos de scroll.
const SCROLL_MARGIN_TOP = 76

export default function Trails() {
  const { hash } = useLocation()
  const activeId = hash.startsWith('#') ? hash.slice(1) : ''
  const firstRowId = trailAnchor(trails[0].slug)

  useEffect(() => {
    if (!activeId) return
    // Delay de 1 frame para garantir que as fileiras terminaram de renderizar.
    requestAnimationFrame(() => {
      const el = document.getElementById(activeId)
      if (!el) return
      // `inline: 'center'` rola o trilho horizontal quando o alvo é um pôster.
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
    })
  }, [activeId])

  return (
    <div className="catalog flex flex-col gap-lg pb-3xl">
      <CatalogBillboard firstRowId={firstRowId} />

      <TrailNav />

      <div className="flex flex-col gap-2xl">
        {trails.map((trail) => {
          const { totalHours, maxHours, courseCount } = trailLoad(trail)
          return (
            <section
              key={trail.slug}
              id={trailAnchor(trail.slug)}
              aria-labelledby={`${trailAnchor(trail.slug)}-title`}
              className="flex flex-col gap-md"
              style={{ scrollMarginTop: SCROLL_MARGIN_TOP }}
            >
              {/* max-w vai no filho, não no .catalog-inset: com box-sizing
                  border-box o gutter de 180px entraria no max-width e espremeria
                  o cabeçalho a ~400px. */}
              <header className="catalog-inset">
                <div className="flex flex-col gap-xs max-w-3xl">
                  {/* Sobrancelha factual em vez de numeração 01/02/03: os eixos não
                      são uma sequência, então o que qualifica a fileira é o acervo. */}
                  <p className="typo-body-sm text-inactive uppercase tracking-widest">
                    {courseCount} cursos
                    <span className="text-accent px-xs">·</span>
                    {formatHours(totalHours)} horas
                    <span className="text-accent px-xs">·</span>
                    Escola Virtual do Governo
                  </p>
                  <h2 id={`${trailAnchor(trail.slug)}-title`} className="typo-h3">
                    {trail.title}
                  </h2>
                  <p className="typo-body text-inactive">{trail.description}</p>
                </div>
              </header>

              <CatalogRow label={trail.title}>
                {trail.courses.map((course, idx) => {
                  const id = courseAnchor(trail.slug, idx)
                  return (
                    <CoursePoster
                      key={id}
                      id={id}
                      title={course.title}
                      duration={course.duration}
                      href={course.url}
                      load={loadRatio(course, maxHours)}
                      highlighted={activeId === id}
                      scrollMarginTop={SCROLL_MARGIN_TOP}
                    />
                  )
                })}
              </CatalogRow>
            </section>
          )
        })}
      </div>
    </div>
  )
}
