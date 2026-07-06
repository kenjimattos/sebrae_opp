import { createContext, useContext } from 'react'
import type { IndicatorsData } from '@/types/indicators'
import type { MunicipalitySummary } from '@/data/api'

export interface MunicipalityState {
  id: string
  name: string
  data: IndicatorsData | null
}

export type MunicipalityChangeOrigin = 'selector' | 'map'

export interface MunicipalityContextType {
  municipality: MunicipalityState
  // Lista de municípios para o seletor (carregada da API no boot).
  municipalities: MunicipalitySummary[]
  // true enquanto os dados do município selecionado estão sendo buscados.
  loading: boolean
  error: string | null
  setMunicipality: (id: string, name: string, origin?: MunicipalityChangeOrigin) => void
}

export const MunicipalityContext = createContext<MunicipalityContextType | null>(null)

export function useMunicipality(): MunicipalityContextType {
  const context = useContext(MunicipalityContext)
  if (!context) {
    throw new Error('useMunicipality must be used within a MunicipalityProvider')
  }
  return context
}
