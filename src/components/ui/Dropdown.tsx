// Tailwind pure — no Figma equivalent
// Select estilizado: button + ul controlados por estado

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function Dropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative z-[1000] ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex-between gap-xs w-full bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] px-sm py-xs typo-body-bold cursor-pointer"
      >
        {selected?.label ?? 'Selecionar'}
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="absolute z-10 top-full left-0 mt-[var(--spacing-2xs)] w-full bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] shadow-lg overflow-hidden">
          {options.map((option) => (
            <li key={option.value}>
              <button
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-sm py-xs cursor-pointer transition-colors ${
                  option.value === value
                    ? 'bg-[var(--semantic-accent-surface)] typo-body-bold text-accent'
                    : 'typo-body hover:bg-[var(--semantic-surface-secondary)]'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
