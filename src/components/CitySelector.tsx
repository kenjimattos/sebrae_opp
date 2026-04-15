// Figma: CitySelector (509:3274)
// Combobox: searchable dropdown to select municipality

import { Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useMunicipio } from '@/hooks/useMunicipio'
import municipios from '@/data/municipios.json'

interface CitySelectorProps {
  className?: string
}

export default function CitySelector({ className = '' }: CitySelectorProps) {
  const { municipio, setMunicipio } = useMunicipio()
  const [query, setQuery] = useState(municipio.nome)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync query when municipality changes externally
  useEffect(() => {
    setQuery(municipio.nome)
  }, [municipio.nome])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(municipio.nome)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [municipio.nome])

  const filtered = municipios.filter((m) =>
    m.nome.toLowerCase().includes(query.toLowerCase()),
  )

  function handleSelect(id: string, nome: string) {
    setMunicipio(id, nome)
    setQuery(nome)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-sm bg-surface-secondary radius-full px-sm py-xs overflow-hidden">
        <Search size={20} className="shrink-0 text-inactive" />
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

      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-xs bg-surface radius-md shadow-lg z-50 overflow-hidden">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => handleSelect(m.id, m.nome)}
                className={`typo-body w-full text-left px-sm py-xs hover:bg-surface-secondary transition-colors ${
                  m.id === municipio.id ? 'text-accent' : ''
                }`}
              >
                {m.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
