// Página /trilhas — lista todas as trilhas de capacitação com seus cursos
// em carrossel horizontal. Suporta navegação por hash:
//   /trilhas#trilha-{slug}           → rola até a trilha
//   /trilhas#curso-{slug}-{idx}      → rola até o curso e destaca o card

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import Carousel from '@/components/ui/Carousel'
import TrilhaCard from '@/components/trilhas/TrilhaCard'
import { trilhas, trilhaAnchor, cursoAnchor } from '@/data/capacitacao'
import { sectionContent } from '@/data/sections'

const HEADER_OFFSET = 95
// TrilhaCard w-393 + gap-sm (12px)
const CARD_SCROLL_AMOUNT = 393 + 12

export default function Trilhas() {
  const { hash } = useLocation()
  const activeId = hash.startsWith('#') ? hash.slice(1) : ''

  useEffect(() => {
    if (!activeId) {
      window.scrollTo({ top: 0 })
      return
    }
    // Delay de 1 frame para garantir que o carrossel terminou a renderização.
    requestAnimationFrame(() => {
      const el = document.getElementById(activeId)
      if (!el) return
      // scrollIntoView rola tanto o carrossel (horizontal) quanto a página
      // (vertical). A margem de scroll no card + seção compensa o header sticky.
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
      // Compensa o header sticky que sobrepõe o topo da página.
      setTimeout(() => window.scrollBy({ top: -HEADER_OFFSET, behavior: 'smooth' }), 300)
    })
  }, [activeId])

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] flex flex-col gap-3xl py-2xl px-2xl">
        <TitleSubtitle
          title={sectionContent.trilhas.title}
          subtitle={sectionContent.trilhas.description}
          size="lg"
        />

        {trilhas.map((trilha) => (
          <section
            key={trilha.slug}
            id={trilhaAnchor(trilha.slug)}
            className="flex flex-col gap-lg scroll-mt-[120px]"
          >
            <div className="flex flex-col gap-xs">
              <div className="flex items-start justify-between gap-md">
                <h3 className="typo-h3">{trilha.title}</h3>
                <span className="typo-body bg-surface radius-sm px-sm py-2xs shrink-0">
                  {trilha.cursos.length} cursos
                </span>
              </div>
              <p className="typo-body-lg w-2/3">{trilha.description}</p>
            </div>

            <Carousel scrollAmount={CARD_SCROLL_AMOUNT}>
              {trilha.cursos.map((curso, idx) => {
                const id = cursoAnchor(trilha.slug, idx)
                return (
                  <TrilhaCard
                    key={id}
                    id={id}
                    titulo={curso.titulo}
                    carga={curso.carga}
                    descricao={curso.descricao}
                    highlighted={activeId === id}
                    className="snap-start"
                  />
                )
              })}
            </Carousel>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  )
}
