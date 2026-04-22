import type { ValoresMunicipio } from '@/types/indicadores'
import { joaoPessoa } from '@/data/indicadores/valores/joao-pessoa'
import { campinaGrande } from '@/data/indicadores/valores/campina-grande'
import { queimadas } from '@/data/indicadores/valores/queimadas'
import { conde } from '@/data/indicadores/valores/conde'
import { caapora } from '@/data/indicadores/valores/caapora'
import { pitimbu } from '@/data/indicadores/valores/pitimbu'
import { monteiro } from '@/data/indicadores/valores/monteiro'
import { cabaceiras } from '@/data/indicadores/valores/cabaceiras'

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
