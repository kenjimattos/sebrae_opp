// Client da API de leitura (server/). Em dev o Vite faz proxy de /api → :3000;
// em produção o Nginx faz o mesmo. Substitui os imports estáticos de
// municipalities.json e values/*.ts.
import type { IndicatorsData } from '@/types/indicators'

export interface MunicipalitySummary {
  id: string
  name: string
  slug: string
}

const BASE = '/api'

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API ${path} respondeu ${res.status}`)
  }
  return (await res.json()) as T
}

// Lista de municípios (seletor). GET /api/municipalities
export function fetchMunicipalities(): Promise<MunicipalitySummary[]> {
  return getJSON<MunicipalitySummary[]>('/municipalities')
}

// Dados completos de um município (agendas + base econômica, status já
// calculado no servidor). GET /api/municipalities/:id
export function fetchMunicipalityData(id: string): Promise<IndicatorsData> {
  return getJSON<IndicatorsData>(`/municipalities/${encodeURIComponent(id)}`)
}
