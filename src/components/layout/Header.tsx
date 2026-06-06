// Figma: Header (405:2044)
// Sticky header: Sebrae logo (scroll-to-top) | CitySelector + nav links (scroll-spy) | User avatar

import User from '@/components/layout/User'
import { navLinks } from '@/data/layout'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useAuth } from '@/hooks/useAuth'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { trackEvent } from '@/utils/analytics'
import Button from '../ui/buttons/Button'

interface HeaderProps {
  className?: string
}

const HEADER_HEIGHT = 95

export default function Header({ className = '' }: HeaderProps) {
  const sectionIds = useMemo(() => navLinks.map((l) => l.sectionId), [])
  const activeSection = useActiveSection(sectionIds)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, login } = useAuth()
  const isTrilhas = pathname.startsWith('/trilhas')
  const isHome = pathname === '/'
  // Fora da Home, o scroll-spy não tem o que observar. Fixa o realce de acordo
  // com a rota: "Capacitação" em /trilhas.
  const effectiveActive = isTrilhas ? 'capacitacao' : activeSection

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function onLogoClick() {
      navigate('/')
      requestAnimationFrame(() => window.scrollTo({ top: 0 }))
      window.location.reload();
  }

  function onNavClick(sectionId: string) {
    trackEvent('nav_header_clicado', { secao: sectionId })
    if (!isHome) {
      // Usa hash — a Home lê e scrolla para a seção com offset do header sticky.
      navigate(`/#${sectionId}`)
      return
    }
    scrollToSection(sectionId)
  }

  function handleLogin() {
    login()
    navigate('/home')
  }

  return (
    <header className={`header-container ${className}`}>
      <div className="container px-gutter flex items-center justify-between h-full">
        {/* Logo — click scrolls to top */}
        <img
          src="/assets/sebrae-logo.png"
          alt="Sebrae"
          className="h-full object-cover cursor-pointer"
          onClick={onLogoClick}
        />

        {/* Center nav link*/}
        <div className={`${isLoggedIn ? 'flex-between' : 'hidden'} gap-md px-sm py-2xs`}>
          <nav className="flex-between gap-md">
            {navLinks.map(({ label, sectionId }) => {
              const isActive = effectiveActive === sectionId
              return (
                <button
                  key={sectionId}
                  onClick={() => onNavClick(sectionId)}
                  className={`typo-title-sm transition-colors px-sm py-xs ${
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

        {/* User / Login */}
        {isLoggedIn ? (
          <User />
        ) : (
          <Button label="Login" variant="primary" size="md" onClick={handleLogin} />
        )}
      </div>
    </header>
  )
}
