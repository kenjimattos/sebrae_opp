import { useEffect, useState } from 'react'
import { fetchEmendas } from '@/data/api'
import type { EmendaEsfera, EmendaMunicipio, EmendasData } from '@/types/emendas'

// Payload único com os 223 municípios (~145 KB). Só o modo "Mapeamento de
// recursos" consome, então não vale um Provider global: um cache no módulo já
// garante uma requisição por sessão, mesmo alternando de modo várias vezes.
let cache: EmendasData | null = null
let inFlight: Promise<EmendasData> | null = null

function load(): Promise<EmendasData> {
  if (cache) return Promise.resolve(cache)
  if (!inFlight) {
    inFlight = fetchEmendas()
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

export interface UseEmendasResult {
  data: EmendasData | null
  loading: boolean
  error: string | null
}

export function useEmendas(): UseEmendasResult {
  const [data, setData] = useState<EmendasData | null>(cache)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    // `loading` já nasce true quando não há cache — não precisa (nem deve) setar
    // estado de forma síncrona aqui.
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

/** Município do payload por código IBGE. */
export function findEmendaMunicipio(
  data: EmendasData | null,
  id: string,
): EmendaMunicipio | null {
  if (!data || !id) return null
  return data.municipios.find((m) => m.id === id) ?? null
}

/**
 * Mapa IBGE → intensidade 0–1 para colorir o mapa, normalizado pelo MAIOR valor
 * da esfera. A distribuição é muito assimétrica (João Pessoa e Campina Grande
 * concentram), então uma escala linear deixaria ~220 municípios no mesmo tom:
 * aplicamos raiz quadrada para abrir a faixa baixa sem inverter a ordem.
 */
export function intensidadePorMunicipio(
  data: EmendasData | null,
  esfera: EmendaEsfera,
  metrica: 'empenhado' | 'pago',
): Record<string, number> {
  if (!data) return {}
  const brutos: Record<string, number> = {}
  let max = 0
  for (const m of data.municipios) {
    const v = m[esfera]?.[metrica] ?? 0
    brutos[m.id] = v
    if (v > max) max = v
  }
  if (max <= 0) return {}
  const out: Record<string, number> = {}
  for (const id of Object.keys(brutos)) {
    out[id] = Math.sqrt(brutos[id] / max)
  }
  return out
}
