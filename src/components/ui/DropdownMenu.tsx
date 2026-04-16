// Reusable dropdown menu list (UL + items).
// Consumed by Dropdown and CitySelector. Parent controls visibility via conditional render.
//
// Sizing: menu auto-sizes to widest option (`w-[max-content]`) and never
// shrinks below trigger width (`min-w-full`). Prevents distortion when
// trigger hugs a short label but options are longer.

export interface DropdownMenuOption {
  label: string
  value: string
}

interface DropdownMenuProps {
  options: DropdownMenuOption[]
  value: string
  onSelect: (value: string) => void
  className?: string
}

export default function DropdownMenu({
  options,
  value,
  onSelect,
  className = '',
}: DropdownMenuProps) {
  return (
    <ul
      className={`absolute z-10 top-full left-0 mt-[var(--spacing-2xs)] w-[max-content] min-w-full card-surface shadow-lg overflow-hidden ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => onSelect(option.value)}
              className={`w-full text-left px-sm py-xs cursor-pointer transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-[var(--semantic-accent-surface)] typo-body-bold text-accent'
                  : 'typo-body hover:bg-surface-secondary'
              }`}
            >
              {option.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
