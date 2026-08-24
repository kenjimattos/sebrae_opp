// Shared dropdown open/close state with click-outside listener.
// Consumed by Dropdown and CitySelector — both need the same behavior.
// A dispensa em si vem do useDismiss, comum a modal, tooltip e chat.

import { useRef, useState } from 'react'
import { useDismiss } from '@/hooks/useDismiss'

export function useDropdownState(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)
  const ref = useRef<HTMLDivElement>(null)

  useDismiss({ active: open, onDismiss: () => setOpen(false), outsideRef: ref })

  return { open, setOpen, ref }
}
