import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { MunicipioContext, type MunicipioState } from '@/hooks/useMunicipio'
import type { IndicadoresData, ValoresMunicipio } from '@/types/indicadores'
import { catalogo } from '@/data/catalogo'
import { deriveStatus } from '@/data/thresholds'

import { joaoPessoa } from '@/data/municipios/joao-pessoa'
import { campinaGrande } from '@/data/municipios/campina-grande'
import { queimadas } from '@/data/municipios/queimadas'
import { conde } from '@/data/municipios/conde'
import { caapora } from '@/data/municipios/caapora'
import { pitimbu } from '@/data/municipios/pitimbu'
import { monteiro } from '@/data/municipios/monteiro'
import { cabaceiras } from '@/data/municipios/cabaceiras'

const valoresMap: Record<string, ValoresMunicipio> = {
  '2507507': joaoPessoa,
  '2504009': campinaGrande,
  '2512507': queimadas,
  '2504603': conde,
  '2503001': caapora,
  '2511905': pitimbu,
  '2509701': monteiro,
  '2503100': cabaceiras,
}

// Mescla catálogo (estrutura) com valores do município e aplica thresholds.
function montarIndicadores(valores: ValoresMunicipio): IndicadoresData {
  return {
    municipio: valores.municipio,
    agendas: catalogo.agendas.map((a) => ({
      nome: a.nome,
      indicadores: a.indicadores.map((i) => {
        const valor = valores.agendas[i.id] ?? '—'
        return {
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

  const setMunicipio = useCallback((id: string, nome: string) => {
    setMunicipioState({
      id,
      nome,
      dados: dataMap[id] ?? null,
    })
  }, [])

  const value = useMemo(() => ({ municipio, setMunicipio }), [municipio, setMunicipio])

  return <MunicipioContext.Provider value={value}>{children}</MunicipioContext.Provider>
}
