// Tailwind pure — no Figma equivalent
// Select estilizado: button + ul controlados por estado

import { useState, useRef, useEffect } from 'react'

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
        className="flex items-center justify-between gap-[var(--spacing-xs)] w-full bg-[var(--semantic-surface-secondary)] rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-semibold text-[length:var(--font-size-body)] text-[color:var(--semantic-text-primary)] cursor-pointer"
      >
        {selected?.label ?? 'Selecionar'}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
                className={`w-full text-left px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-[length:var(--font-size-body)] cursor-pointer transition-colors ${
                  option.value === value
                    ? 'bg-[var(--semantic-surface-secondary)] font-semibold text-[color:var(--semantic-text-primary)]'
                    : 'font-normal text-[color:var(--semantic-text-primary)] hover:bg-[var(--semantic-surface-secondary)]'
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
