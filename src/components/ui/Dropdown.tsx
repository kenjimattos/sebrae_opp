// Tailwind pure — no Figma equivalent
// Select estilizado: button trigger + DropdownMenu controlados por useDropdownState

import { ChevronDown } from '@/components/icons'
import { ICON_SIZES } from '@/constants/icons'
import DropdownMenu, { type DropdownMenuOption } from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'

interface DropdownProps {
  options: DropdownMenuOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function Dropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const { open, setOpen, ref } = useDropdownState()
  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-xs bg-surface radius-full px-sm py-xs typo-body-bold cursor-pointer whitespace-nowrap"
      >
        {selected?.label ?? 'Selecionar'}
        <ChevronDown
          size={ICON_SIZES.sm}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <DropdownMenu
          options={options}
          value={value}
          onSelect={(v) => {
            onChange(v)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}
