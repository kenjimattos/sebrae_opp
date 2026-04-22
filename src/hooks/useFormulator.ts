import { createContext, useContext } from 'react'
import type { FormulatorState } from '@/types/formulator'

type Slice = keyof Omit<FormulatorState, 'visitedSteps'>

export interface FormulatorContextType {
  state: FormulatorState
  setSlice: <K extends Slice>(key: K, value: FormulatorState[K]) => void
  markVisited: (slug: string) => void
  reset: () => void
}

export const FormulatorContext = createContext<FormulatorContextType | null>(null)

export function useFormulator(): FormulatorContextType {
  const context = useContext(FormulatorContext)
  if (!context) {
    throw new Error('useFormulator must be used within a FormulatorProvider')
  }
  return context
}
