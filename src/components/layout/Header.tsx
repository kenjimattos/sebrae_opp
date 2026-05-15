// Figma: Header (405:2044)
// Sticky header: Sebrae logo (scroll-to-top) | CitySelector + nav links (scroll-spy) | User avatar

import User from '@/components/layout/User'
import { navLinks } from '@/data/layout'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useFormulator } from '@/hooks/useFormulator'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { trackEvent } from '@/utils/analytics'

interface HeaderProps {
  className?: string
}

const HEADER_HEIGHT = 95

const CONFIRM_SAIR_FORMULADOR =
  'Você perderá o rascunho do formulário deste município. Deseja continuar?'

export default function Header({ className = '' }: HeaderProps) {
  const sectionIds = useMemo(() => navLinks.map((l) => l.sectionId), [])
  const activeSection = useActiveSection(sectionIds)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { reset } = useFormulator()
  const isFormulador = pathname.startsWith('/formulador')
  const isTrilhas = pathname.startsWith('/trilhas')
  const isHome = pathname === '/'
  // Fora da Home, o scroll-spy não tem o que observar. Fixa o realce de acordo
  // com a rota: "Formulador" em /formulador, "Capacitação" em /trilhas.
  const effectiveActive = isFormulador
    ? 'formulador'
    : isTrilhas
      ? 'capacitacao'
      : activeSection

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function trackAbandonoFormulador(via: string) {
    const slug = pathname.split('/')[2] ?? ''
    if (slug === 'conclusao') return
    trackEvent('formulador_abandonado', { ultimo_step: slug, via })
  }

  function onLogoClick() {
    if (isFormulador) {
      if (!window.confirm(CONFIRM_SAIR_FORMULADOR)) return
      trackAbandonoFormulador('logo')
      reset()
      navigate('/')
      requestAnimationFrame(() => window.scrollTo({ top: 0 }))
      return
    }
    if (!isHome) {
      navigate('/')
      requestAnimationFrame(() => window.scrollTo({ top: 0 }))
      return
    }
    scrollToTop()
  }

  function onNavClick(sectionId: string) {
    trackEvent('nav_header_clicado', { secao: sectionId })
    if (isFormulador) {
      if (!window.confirm(CONFIRM_SAIR_FORMULADOR)) return
      trackAbandonoFormulador('nav')
      reset()
      // Usa hash — a Home lê e scrolla para a seção com offset do header sticky.
      navigate(`/#${sectionId}`)
      return
    }
    if (!isHome) {
      navigate(`/#${sectionId}`)
      return
    }
    scrollToSection(sectionId)
  }

  return (
    <header
      className={`flex-between mx-auto w-full sticky top-0 z-50 py-md bg-surface border-b-2 border-[var(--semantic-surface-secondary)] ${className}`}
      style={{ paddingLeft: 'var(--spacing-margin)', paddingRight: 'var(--spacing-margin)' }}
    >
      {/* Logo — click scrolls to top */}
      <img
        src="/assets/sebrae-logo.png"
        alt="Sebrae"
        className="h-[60px] w-[111px] object-cover cursor-pointer"
        onClick={onLogoClick}
      />

      {/* Center nav pill */}
      <div className="flex-between gap-md px-sm py-2xs">
        <nav className="flex-between gap-md">
          {navLinks.map(({ label, sectionId }) => {
            const isActive = effectiveActive === sectionId
            return (
              <button
                key={sectionId}
                onClick={() => onNavClick(sectionId)}
                className={`typo-body transition-colors px-sm py-xs ${
                  isActive
                    ? 'text-[var(--semantic-accent)]'
                    : 'hover:text-[var(--semantic-accent)] text-[var(--semantic-text-primary)]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* User */}
      <User />
    </header>
  )
}
