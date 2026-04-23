// Figma: CitySelector (509:3274)
// Combobox: searchable dropdown to select municipality

import { useState, useRef } from 'react'
import { Search, iconSizes } from '@/components/icons'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import { useMunicipality } from '@/hooks/useMunicipality'
import municipios from '@/data/indicators/municipalities.json'

interface CitySelectorProps {
  className?: string
}

export default function CitySelector({ className = '' }: CitySelectorProps) {
  const { municipality, setMunicipality } = useMunicipality()
  const { open, setOpen, ref } = useDropdownState()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Input shows the draft while open (user is searching) or the selected name
  // when closed. Deriving avoids a setState-in-effect sync between them.
  const query = open ? draft : municipality.name

  const filtered = municipios.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  )

  const menuOptions = filtered.map((m) => ({ label: m.name, value: m.id }))

  function handleSelect(id: string) {
    const match = municipios.find((m) => m.id === id)
    if (!match) return
    setMunicipality(match.id, match.name, 'selector')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex items-center gap-sm bg-surface-secondary rounded-full px-sm py-xs overflow-hidden">
        <Search size={iconSizes.md} className="shrink-0 text-inactive" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setDraft(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            // Clear the field on focus so the user starts fresh when searching.
            setDraft('')
            setOpen(true)
          }}
          className="typo-body-bold bg-transparent outline-none w-full truncate"
          placeholder="Buscar município..."
        />
      </div>

      {open && menuOptions.length > 0 && (
        <DropdownMenu
          options={menuOptions}
          value={municipality.id}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
