// Figma: Header (405:2044)
// Top bar: Sebrae logo | CitySelector + nav links | User avatar

import CitySelector from '@/components/CitySelector'
import User from '@/components/User'

interface HeaderProps {
  municipio: string
  className?: string
}

const navLinks = ['Agenda prioritaria', 'Acesso a recursos', 'Formulador']

export default function Header({ municipio, className = '' }: HeaderProps) {
  return (
    <header
      className={`flex-between h-[95px] pt-md px-margin bg-[var(--semantic-background-primary)] ${className}`}
    >
      {/* Logo */}
      <img
        src="/assets/sebrae-logo.png"
        alt="Sebrae"
        className="h-[60px] w-[111px] object-cover"
      />

      {/* Center nav pill */}
      <div className="flex-between h-[60px] bg-[var(--semantic-surface-primary)] rounded-[var(--radius-full)] pl-xs pr-md py-2xs w-[720px]">
        <CitySelector municipio={municipio} className="shrink-0 w-[231px] flex items-center gap-sm bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-full)] px-sm py-xs overflow-hidden" />

        {navLinks.map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
            className="typo-body text-center whitespace-nowrap transition-colors hover:text-accent"
          >
            {label}
          </a>
        ))}
      </div>

      {/* User */}
      <User />
    </header>
  )
}
