import { createContext, useContext } from 'react'
import type { FormuladorState } from '@/types/formulador'

type Slice = keyof Omit<FormuladorState, 'etapasVisitadas'>

export interface FormuladorContextType {
  state: FormuladorState
  setSlice: <K extends Slice>(key: K, value: FormuladorState[K]) => void
  markVisited: (slug: string) => void
  reset: () => void
}

export const FormuladorContext = createContext<FormuladorContextType | null>(null)

export function useFormulador(): FormuladorContextType {
  const context = useContext(FormuladorContext)
  if (!context) {
    throw new Error('useFormulador must be used within a FormuladorProvider')
  }
  return context
}
