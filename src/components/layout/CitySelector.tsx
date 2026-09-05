import { useState, useRef } from 'react'
import { ChevronDown } from '@/components/icons'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useMunicipalityChange } from '@/hooks/useMunicipalityChange'
import Button from '../ui/buttons/Button'

interface CitySelectorProps {
  className?: string
}

export default function CitySelector({ className = '' }: CitySelectorProps) {
  const { municipality, municipalities } = useMunicipality()
  const changeMunicipality = useMunicipalityChange()
  const { open, setOpen, ref } = useDropdownState()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Input shows the draft while open (user is searching) or the selected name
  // when closed. Deriving avoids a setState-in-effect sync between them.
  const query = open ? draft : municipality.name

  const filtered = municipalities.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  )

  const menuOptions = filtered.map((m) => ({ label: m.name, value: m.id }))

  function handleSelect(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (!match) return
    void changeMunicipality(match.id, match.name, 'selector')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div
      className="glass glass-bevel w-fit relative inline-flex items-center rounded-full px-xs py-2xs"
      aria-label="Modo de visualização do mapa"
    >
      <Button
        label={municipality.id ? 'Meu município' : 'Selecione seu município'}
        className="h-fit py-xs"
      ></Button>
      <div ref={ref} className={`relative ${className}`}>
        <div className="flex items-center gap-sm px-sm py-xs overflow-hidden">
          <input
            size={16}
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
            className="typo-body-bold bg-transparent outline-none truncate"
            placeholder="Buscar município..."
          />
          <button className="text-accent" onClick={() => setOpen(!open)}>
            <ChevronDown />
          </button>
        </div>

        {open && menuOptions.length > 0 && (
          <DropdownMenu
            options={menuOptions}
            value={municipality.id}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  )
}