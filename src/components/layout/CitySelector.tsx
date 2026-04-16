// Figma: CitySelector (509:3274)
// Combobox: searchable dropdown to select municipality

import { useState, useRef, useEffect } from 'react'
import { Search } from '@/components/icons'
import { ICON_SIZES } from '@/constants/icons'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import { useMunicipio } from '@/hooks/useMunicipio'
import municipios from '@/data/municipios.json'

interface CitySelectorProps {
  className?: string
}

export default function CitySelector({ className = '' }: CitySelectorProps) {
  const { municipio, setMunicipio } = useMunicipio()
  const [query, setQuery] = useState(municipio.nome)
  const { open, setOpen, ref } = useDropdownState()
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep query in sync with selected municipality when closed.
  // Handles both external changes (map click) and resetting after click-outside.
  useEffect(() => {
    if (!open) setQuery(municipio.nome)
  }, [open, municipio.nome])

  const filtered = municipios.filter((m) =>
    m.nome.toLowerCase().includes(query.toLowerCase()),
  )

  const menuOptions = filtered.map((m) => ({ label: m.nome, value: m.id }))

  function handleSelect(id: string) {
    const match = municipios.find((m) => m.id === id)
    if (!match) return
    setMunicipio(match.id, match.nome)
    setQuery(match.nome)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex items-center gap-sm bg-surface-secondary radius-full px-sm py-xs overflow-hidden">
        <Search size={ICON_SIZES.md} className="shrink-0 text-inactive" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            inputRef.current?.select()
          }}
          className="typo-body-bold bg-transparent outline-none w-full truncate"
          placeholder="Buscar município..."
        />
      </div>

      {open && menuOptions.length > 0 && (
        <DropdownMenu
          options={menuOptions}
          value={municipio.id}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
