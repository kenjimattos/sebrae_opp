// Tailwind pure — no Figma equivalent
// Barra de eixos do catálogo /trilhas — navegação, não filtro: clicar salta
// para a fileira, e a trilha visível se marca sozinha via IntersectionObserver.
// Filtrar esconderia acervo; num catálogo a abundância é parte da mensagem.

import { useEffect, useState } from 'react'
import { trails, trailAnchor } from '@/data/home/training'

export default function TrailNav() {
  const [activeSlug, setActiveSlug] = useState(trails[0]?.slug ?? '')

  useEffect(() => {
    const sections = trails
      .map((trail) => document.getElementById(trailAnchor(trail.slug)))
      .filter((el): el is HTMLElement => el !== null)
    if (!sections.length) return

    // rootMargin recorta a viewport numa faixa central: a trilha ativa é a que
    // ocupa o meio da tela, não a que apenas encostou no topo.
    //
    // O estado vivo fica num Set em vez de sair do batch de `entries`: o
    // callback só reporta o que MUDOU, então usar `entries.find(isIntersecting)`
    // perdia a marcação sempre que a única mudança do batch era uma saída de
    // faixa. Com o Set, empates resolvem pela seção mais alta.
    const intersecting = new Set<HTMLElement>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement
          if (entry.isIntersecting) intersecting.add(target)
          else intersecting.delete(target)
        })
        if (!intersecting.size) return
        const topmost = [...intersecting].reduce((a, b) =>
          a.getBoundingClientRect().top <= b.getBoundingClientRect().top ? a : b,
        )
        setActiveSlug(topmost.id.replace('trilha-', ''))
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const jumpTo = (slug: string) => {
    document.getElementById(trailAnchor(slug))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Trilhas do catálogo"
      className="catalog-inset catalog-nav sticky top-0 z-20 flex gap-xs overflow-x-auto scrollbar-hide py-sm"
    >
      {trails.map((trail) => {
        const isActive = trail.slug === activeSlug
        return (
          <button
            key={trail.slug}
            type="button"
            onClick={() => jumpTo(trail.slug)}
            aria-current={isActive ? 'true' : undefined}
            className={`shrink-0 rounded-full px-md py-xs typo-body-sm whitespace-nowrap cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              isActive
                ? 'bg-accent text-[color:var(--semantic-button-label-primary)]'
                : 'bg-surface text-inactive hover:text-[color:var(--semantic-text-primary)]'
            }`}
          >
            {trail.title}
          </button>
        )
      })}
    </nav>
  )
}
