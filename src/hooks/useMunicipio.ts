import { createContext, useContext } from 'react'
import type { IndicadoresData } from '@/types/indicadores'

export interface MunicipioState {
  id: string
  nome: string
  dados: IndicadoresData | null
}

export type MunicipioChangeOrigin = 'seletor' | 'mapa'

export interface MunicipioContextType {
  municipio: MunicipioState
  setMunicipio: (id: string, nome: string, origem?: MunicipioChangeOrigin) => void
}

export const MunicipioContext = createContext<MunicipioContextType | null>(null)

export function useMunicipio(): MunicipioContextType {
  const context = useContext(MunicipioContext)
  if (!context) {
    throw new Error('useMunicipio must be used within a MunicipioProvider')
  }
  return context
}
