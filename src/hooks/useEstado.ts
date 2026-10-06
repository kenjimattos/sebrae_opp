import { useEffect, useState } from 'react'
import { fetchStateData } from '@/data/api'
import type { StateData } from '@/types/estado'

// Payload pequeno (~13 KB) e com um consumidor só — a SectionEstado. Mesmo
// desenho do useEmendas: cache no módulo garante uma requisição por sessão sem
// precisar de Provider global.
let cache: StateData | null = null
let inFlight: Promise<StateData> | null = null

function load(): Promise<StateData> {
  if (cache) return Promise.resolve(cache)
  if (!inFlight) {
    inFlight = fetchStateData()
      .then((data) => {
        cache = data
        return data
      })
      .finally(() => {
        // libera para uma nova tentativa se tiver falhado
        inFlight = null
      })
  }
  return inFlight
}

export interface UseEstadoResult {
  data: StateData | null
  loading: boolean
  error: string | null
}

export function useEstado(): UseEstadoResult {
  const [data, setData] = useState<StateData | null>(cache)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    load()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
