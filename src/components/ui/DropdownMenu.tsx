// Reusable dropdown menu list (UL + items).
// Consumed by Dropdown and CitySelector. Parent controls visibility via conditional render.
//
// Sizing:
//   - width: auto-sizes to widest option (`w-[max-content]`) and never
//     shrinks below trigger width (`min-w-full`).
//   - height: capped at `40dvh` (viewport-relative, not a pixel magic number)
//     so long lists don't overflow the screen.

import { useRef } from 'react'

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
  const listRef = useRef<HTMLUListElement>(null)

  return (
    <div
      className={`absolute top-full bg-surface-secondary rounded-sm p-xs left-0 mt-2xs w-max min-w-full ${className}`}
    >
      <div className="relative shadow-lg overflow-hidden">
        <ul ref={listRef} className="max-h-[40dvh] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`w-full text-left px-sm py-xs cursor-pointer transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-surface typo-body-bold'
                      : 'typo-body hover:bg-surface-secondary'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
  
      </div>
    </div>
  )
}
