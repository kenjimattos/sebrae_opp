import { useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  MunicipalityContext,
  type MunicipalityChangeOrigin,
  type MunicipalityState,
} from '@/hooks/useMunicipality'
import {
  fetchMunicipalities,
  fetchMunicipalityData,
  type MunicipalitySummary,
} from '@/data/api'
import { setTag, trackEvent } from '@/utils/analytics'

// Estado inicial sem município: a Home exibe apenas mapa + seletor até o
// usuário escolher um município (ver `{data && ...}` em Home / SectionAgendas).
const emptyMunicipality: MunicipalityState = {
  id: '',
  name: '',
  data: null,
}

export default function MunicipalityProvider({ children }: { children: ReactNode }) {
  const [municipality, setMunicipalityState] = useState<MunicipalityState>(emptyMunicipality)
  const [municipalities, setMunicipalities] = useState<MunicipalitySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Município exibido no momento (para o compare do analytics sem depender de
  // fechar sobre o state) e id do último fetch pedido (para descartar respostas
  // obsoletas quando o usuário troca de município no meio do carregamento).
  const displayedRef = useRef(municipality)
  const requestIdRef = useRef('')
  useEffect(() => {
    displayedRef.current = municipality
  }, [municipality])

  // Carrega a lista de municípios uma vez no boot.
  useEffect(() => {
    let cancelled = false
    fetchMunicipalities()
      .then((list) => {
        if (!cancelled) setMunicipalities(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setMunicipality = useCallback(
    (id: string, name: string, origin?: MunicipalityChangeOrigin) => {
      const prev = displayedRef.current
      if (prev.id !== id) {
        trackEvent('municipio_alterado', {
          de: prev.name,
          para: name,
          origem: origin ?? 'desconhecida',
        })
        setTag('municipio', name)
      }

      // Stale-while-revalidate: NÃO troca o município exibido ainda. Mantém o
      // atual renderizado (evita voltar pro mapa expandido durante o fetch) e só
      // faz a troca atômica quando os dados novos chegam.
      requestIdRef.current = id
      setLoading(true)
      setError(null)
      fetchMunicipalityData(id)
        .then((data) => {
          // Descarta respostas obsoletas: só comita se este ainda é o último
          // município pedido.
          if (requestIdRef.current !== id) return
          setMunicipalityState({ id, name, data })
        })
        .catch((e: unknown) => {
          if (requestIdRef.current === id) {
            setError(e instanceof Error ? e.message : String(e))
          }
        })
        .finally(() => {
          if (requestIdRef.current === id) setLoading(false)
        })
    },
    [],
  )

  const value = useMemo(
    () => ({ municipality, municipalities, loading, error, setMunicipality }),
    [municipality, municipalities, loading, error, setMunicipality],
  )

  return <MunicipalityContext.Provider value={value}>{children}</MunicipalityContext.Provider>
}
