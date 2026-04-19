import type { ValoresMunicipio } from '@/types/indicadores'
import { joaoPessoa } from '@/data/municipios/joao-pessoa'
import { campinaGrande } from '@/data/municipios/campina-grande'
import { queimadas } from '@/data/municipios/queimadas'
import { conde } from '@/data/municipios/conde'
import { caapora } from '@/data/municipios/caapora'
import { pitimbu } from '@/data/municipios/pitimbu'
import { monteiro } from '@/data/municipios/monteiro'
import { cabaceiras } from '@/data/municipios/cabaceiras'

// Chave = código IBGE. Fonte de verdade consumida pelo MunicipioProvider e
// pelos derivadores do mapa (src/data/mapa-indicadores.ts).
export const valoresMap: Record<string, ValoresMunicipio> = {
  '2507507': joaoPessoa,
  '2504009': campinaGrande,
  '2512507': queimadas,
  '2504603': conde,
  '2503001': caapora,
  '2511905': pitimbu,
  '2509701': monteiro,
  '2503100': cabaceiras,
}
