// Tailwind pure — no Figma equivalent
// Header do app: logotipo, seletor de município (só em /home) e tema. Sticky
// no topo; compacta ao rolar. Geometria e estados em .site-header (index.css).
//
// É <header> de propósito: com logo, seletor e tema juntos ele é o cabeçalho
// do documento, e o landmark `banner` convive com o <main> único do Layout.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'
import PippaWordmark from '@/components/brand/PippaWordmark'
import CitySelector from '@/components/layout/CitySelector'

interface SiteHeaderProps {
  showCitySelector: boolean
  className?: string
}

export default function SiteHeader({ showCitySelector, className = '' }: SiteHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  // Um marcador no topo do documento: saiu da tela, compacta. Evita um
  // listener de scroll disparando a cada pixel.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Rolar ao topo no clique. `ScrollToTop` só reage a *mudança* de rota, então
  // ele não cobre o caso de clicar no logotipo já estando em /home.
  function scrollToTop() {
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, left: 0, behavior: reduzMovimento ? 'auto' : 'smooth' })
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="absolute top-0 left-0 h-xs w-px" />
      <header data-compact={compact} className={`site-header ${className}`}>
        <div className="site-header__bar">
          {/* <Link> e não onClick no <svg>: só o link recebe foco, responde a
              Enter e abre em nova aba. O logotipo é decorativo porque o link
              já se nomeia — senão o leitor de tela diria "PIPPA" duas vezes. */}
          <Link
            to="/home"
            onClick={scrollToTop}
            aria-label="PIPPA — página inicial"
            className="justify-self-start text-primary hover:text-accent transition-colors rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <PippaWordmark className="site-header__logo block h-auto" decorative />
          </Link>

          <div>{showCitySelector && <CitySelector compact={compact} />}</div>

          {/* Instância única — useTheme é estado local (ver useTheme.ts). */}
          <div className="justify-self-end glass glass-bevel rounded-full p-2xs">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  )
}
