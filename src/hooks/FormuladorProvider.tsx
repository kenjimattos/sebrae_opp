import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { FormuladorContext, type FormuladorContextType } from '@/hooks/useFormulador'
import { useMunicipio } from '@/hooks/useMunicipio'
import { EMPTY_FORMULADOR_STATE, type FormuladorState } from '@/types/formulador'

const STORAGE_PREFIX = 'formulador:'

function storageKey(municipioId: string): string {
  return `${STORAGE_PREFIX}${municipioId}`
}

function loadFromStorage(municipioId: string): FormuladorState {
  if (typeof window === 'undefined') return EMPTY_FORMULADOR_STATE
  try {
    const raw = window.localStorage.getItem(storageKey(municipioId))
    if (!raw) return EMPTY_FORMULADOR_STATE
    const parsed = JSON.parse(raw) as Partial<FormuladorState>
    return { ...EMPTY_FORMULADOR_STATE, ...parsed }
  } catch {
    return EMPTY_FORMULADOR_STATE
  }
}

function saveToStorage(municipioId: string, state: FormuladorState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(municipioId), JSON.stringify(state))
  } catch {
    // Falha em quota / privacy-mode apenas faz o usuário perder a persistência.
  }
}

export default function FormuladorProvider({ children }: { children: ReactNode }) {
  const { municipio } = useMunicipio()
  const [state, setState] = useState<FormuladorState>(() => loadFromStorage(municipio.id))
  const [lastMunicipioId, setLastMunicipioId] = useState<string>(municipio.id)

  // Recarregar rascunho ao trocar de município (render-phase update: sem useEffect)
  if (lastMunicipioId !== municipio.id) {
    setLastMunicipioId(municipio.id)
    setState(loadFromStorage(municipio.id))
  }

  // Persistir a cada mudança
  useEffect(() => {
    saveToStorage(municipio.id, state)
  }, [municipio.id, state])

  const setSlice = useCallback<FormuladorContextType['setSlice']>((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const markVisited = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.etapasVisitadas.includes(slug)) return prev
      return { ...prev, etapasVisitadas: [...prev.etapasVisitadas, slug] }
    })
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY_FORMULADOR_STATE)
  }, [])

  return (
    <FormuladorContext.Provider value={{ state, setSlice, markVisited, reset }}>
      {children}
    </FormuladorContext.Provider>
  )
}
