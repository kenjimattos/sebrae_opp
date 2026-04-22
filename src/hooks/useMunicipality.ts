import { createContext, useContext } from 'react'
import type { IndicatorsData } from '@/types/indicators'

export interface MunicipalityState {
  id: string
  name: string
  data: IndicatorsData | null
}

export type MunicipalityChangeOrigin = 'selector' | 'map'

export interface MunicipalityContextType {
  municipality: MunicipalityState
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
