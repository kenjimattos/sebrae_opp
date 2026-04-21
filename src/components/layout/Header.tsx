// Figma: Header (405:2044)
// Sticky header: Sebrae logo (scroll-to-top) | CitySelector + nav links (scroll-spy) | User avatar

import CitySelector from '@/components/layout/CitySelector'
import User from '@/components/layout/User'
import { navLinks } from '@/data/layout'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useFormulador } from '@/hooks/useFormulador'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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
  const { reset } = useFormulador()
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

  function onLogoClick() {
    if (isFormulador) {
      if (!window.confirm(CONFIRM_SAIR_FORMULADOR)) return
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
    if (isFormulador) {
      if (!window.confirm(CONFIRM_SAIR_FORMULADOR)) return
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
      className={`flex-between mx-auto w-full max-w-[1440px] sticky top-0 z-50 py-md px-lg bg-primary ${className}`}
    >
      {/* Logo — click scrolls to top */}
      <img
        src="/assets/sebrae-logo.png"
        alt="Sebrae"
        className="h-[60px] w-[111px] object-cover cursor-pointer"
        onClick={onLogoClick}
      />

      {/* Center nav pill */}
      <div className="flex-between h-[60px] gap-md bg-surface rounded-full px-sm py-2xs">
        {!isFormulador && !isTrilhas && <CitySelector />}

        <nav className="flex-between gap-md">
          {navLinks.map(({ label, sectionId }) => {
            const isActive = effectiveActive === sectionId
            return (
              <button
                key={sectionId}
                onClick={() => onNavClick(sectionId)}
                className={`typo-body-sm whitespace-nowrap transition-colors px-sm py-xs rounded-full ${
                  isActive
                    ? 'bg-accent text-[var(--semantic-button-label-primary)]'
                    : 'hover:bg-[var(--semantic-surface-hover)]'
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
