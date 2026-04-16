// Shared dropdown open/close state with click-outside listener.
// Consumed by Dropdown and CitySelector — both need the same behavior.

import { useEffect, useRef, useState } from 'react'

export function useDropdownState(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return { open, setOpen, ref }
}
