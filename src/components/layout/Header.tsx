// Figma: Header (405:2044)
// Sticky header: Sebrae logo (scroll-to-top) | CitySelector + nav links (scroll-spy) | User avatar

import CitySelector from '@/components/CitySelector'
import User from '@/components/User'
import { navLinks } from '@/data/layout'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useMemo } from 'react'

interface HeaderProps {
  className?: string
}

const HEADER_HEIGHT = 95

export default function Header({ className = '' }: HeaderProps) {
  const sectionIds = useMemo(() => navLinks.map((l) => l.sectionId), [])
  const activeSection = useActiveSection(sectionIds)

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <header
      className={`mx-auto w-full max-w-[1440px] sticky top-0 z-50 flex-between h-[95px] py-md px-margin bg-primary justify-between ${className}`}
    >
      {/* Logo — click scrolls to top */}
      <img
        src="/assets/sebrae-logo.png"
        alt="Sebrae"
        className="h-[60px] w-[111px] object-cover cursor-pointer"
        onClick={scrollToTop}
      />

      {/* Center nav pill */}
      <div className="flex-between h-[60px] gap-sm bg-surface rounded-full px-sm py-2xs">
        <CitySelector/>

        <nav className="flex items-center">
          {navLinks.map(({ label, sectionId }) => {
            const isActive = activeSection === sectionId
            return (
              <button
                key={sectionId}
                onClick={() => scrollToSection(sectionId)}
                className={`typo-body whitespace-nowrap transition-colors px-sm py-xs rounded-full ${
                  isActive
                    ? 'bg-accent text-[var(--semantic-button-label-primary)]'
                    : 'hover:text-accent'
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
