// Tailwind pure — no Figma equivalent
// Select estilizado: button trigger + DropdownMenu controlados por useDropdownState

import { ChevronDown } from '@/components/icons'
import DropdownMenu, { type DropdownMenuOption } from '@/components/ui/DropdownMenu'
import { useDropdownState } from '@/components/ui/useDropdownState'
import Button from '@/components/ui/buttons/Button'

interface DropdownProps {
  options: DropdownMenuOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  ButtonVariant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
}

export default function Dropdown({ options, value, onChange, className = '', ButtonVariant = 'primary' }: DropdownProps) {
  const { open, setOpen, ref } = useDropdownState()
  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <Button
        label={selected ? selected.label : 'Select an option'}
        variant={ButtonVariant}
        size="md"
        icon={ChevronDown}
        iconPosition="right"
        onClick={() => setOpen(!open)}
      >
      </Button>

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
