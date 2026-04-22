import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { FormulatorContext, type FormulatorContextType } from '@/hooks/useFormulator'
import { useMunicipality } from '@/hooks/useMunicipality'
import { EMPTY_FORMULATOR_STATE, type FormulatorState } from '@/types/formulator'

const STORAGE_PREFIX = 'formulator:'

function storageKey(municipalityId: string): string {
  return `${STORAGE_PREFIX}${municipalityId}`
}

function loadFromStorage(municipalityId: string): FormulatorState {
  if (typeof window === 'undefined') return EMPTY_FORMULATOR_STATE
  try {
    const raw = window.localStorage.getItem(storageKey(municipalityId))
    if (!raw) return EMPTY_FORMULATOR_STATE
    const parsed = JSON.parse(raw) as Partial<FormulatorState>
    return { ...EMPTY_FORMULATOR_STATE, ...parsed }
  } catch {
    return EMPTY_FORMULATOR_STATE
  }
}

function saveToStorage(municipalityId: string, state: FormulatorState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(municipalityId), JSON.stringify(state))
  } catch {
    // Quota/privacy-mode failure only loses persistence.
  }
}

export default function FormulatorProvider({ children }: { children: ReactNode }) {
  const { municipality } = useMunicipality()
  const [state, setState] = useState<FormulatorState>(() => loadFromStorage(municipality.id))
  const [lastMunicipalityId, setLastMunicipalityId] = useState<string>(municipality.id)

  // Reload draft when municipality changes (render-phase update: no useEffect)
  if (lastMunicipalityId !== municipality.id) {
    setLastMunicipalityId(municipality.id)
    setState(loadFromStorage(municipality.id))
  }

  // Persist on every change
  useEffect(() => {
    saveToStorage(municipality.id, state)
  }, [municipality.id, state])

  const setSlice = useCallback<FormulatorContextType['setSlice']>((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const markVisited = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.visitedSteps.includes(slug)) return prev
      return { ...prev, visitedSteps: [...prev.visitedSteps, slug] }
    })
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY_FORMULATOR_STATE)
  }, [])

  return (
    <FormulatorContext.Provider value={{ state, setSlice, markVisited, reset }}>
      {children}
    </FormulatorContext.Provider>
  )
}
