import { useMemo, useState, useCallback, type ReactNode } from 'react'
import {
  MunicipioContext,
  type MunicipioChangeOrigin,
  type MunicipioState,
} from '@/hooks/useMunicipio'
import type { IndicadoresData, ValoresMunicipio } from '@/types/indicadores'
import { catalogo } from '@/data/catalogo'
import { deriveStatus } from '@/data/thresholds'
import { valoresMap } from '@/data/municipios/index'
import { setTag, trackEvent } from '@/utils/analytics'

// Mescla catálogo (estrutura) com valores do município e aplica thresholds.
function montarIndicadores(valores: ValoresMunicipio): IndicadoresData {
  return {
    municipio: valores.municipio,
    agendas: catalogo.agendas.map((a) => ({
      nome: a.nome,
      indicadores: a.indicadores.map((i) => {
        const valor = valores.agendas[i.id] ?? '—'
        return {
          id: i.id,
          label: i.label,
          valor,
          status: deriveStatus(i.id, valor),
        }
      }),
    })),
    baseEconomica: catalogo.baseEconomica.map((b) => {
      const v = valores.baseEconomica[b.id] ?? { valor: '—', variacao: '' }
      return {
        label: b.label,
        valor: v.valor,
        variacao: v.variacao,
        icone: b.icone,
      }
    }),
  }
}

const dataMap: Record<string, IndicadoresData> = Object.fromEntries(
  Object.entries(valoresMap).map(([id, v]) => [id, montarIndicadores(v)]),
)

const defaultId = '2504009'
const defaultMunicipio: MunicipioState = {
  id: defaultId,
  nome: dataMap[defaultId].municipio,
  dados: dataMap[defaultId],
}

export default function MunicipioProvider({ children }: { children: ReactNode }) {
  const [municipio, setMunicipioState] = useState<MunicipioState>(defaultMunicipio)

  const setMunicipio = useCallback(
    (id: string, nome: string, origem?: MunicipioChangeOrigin) => {
      setMunicipioState((prev) => {
        if (prev.id !== id) {
          trackEvent('municipio_alterado', {
            de: prev.nome,
            para: nome,
            origem: origem ?? 'desconhecida',
          })
          setTag('municipio', nome)
        }
        return { id, nome, dados: dataMap[id] ?? null }
      })
    },
    [],
  )

  const value = useMemo(() => ({ municipio, setMunicipio }), [municipio, setMunicipio])

  return <MunicipioContext.Provider value={value}>{children}</MunicipioContext.Provider>
}
