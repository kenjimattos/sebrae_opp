import { useMemo, useState, useCallback, useEffect, type ReactNode } from 'react'
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
      setMunicipalityState((prev) => {
        if (prev.id !== id) {
          trackEvent('municipio_alterado', {
            de: prev.name,
            para: name,
            origem: origin ?? 'desconhecida',
          })
          setTag('municipio', name)
        }
        // Limpa os dados até o fetch resolver (evita mostrar dados do município
        // anterior sob o novo nome).
        return { id, name, data: null }
      })
      setLoading(true)
      setError(null)
      fetchMunicipalityData(id)
        .then((data) => {
          // Ignora respostas obsoletas caso o usuário troque de município antes
          // deste fetch terminar.
          setMunicipalityState((cur) => (cur.id === id ? { ...cur, data } : cur))
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : String(e))
        })
        .finally(() => setLoading(false))
    },
    [],
  )

  const value = useMemo(
    () => ({ municipality, municipalities, loading, error, setMunicipality }),
    [municipality, municipalities, loading, error, setMunicipality],
  )

  return <MunicipalityContext.Provider value={value}>{children}</MunicipalityContext.Provider>
}
