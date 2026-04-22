import type { MunicipalityValues } from '@/types/indicators'
import { joaoPessoa } from '@/data/indicators/values/joao-pessoa'
import { campinaGrande } from '@/data/indicators/values/campina-grande'
import { queimadas } from '@/data/indicators/values/queimadas'
import { conde } from '@/data/indicators/values/conde'
import { caapora } from '@/data/indicators/values/caapora'
import { pitimbu } from '@/data/indicators/values/pitimbu'
import { monteiro } from '@/data/indicators/values/monteiro'
import { cabaceiras } from '@/data/indicators/values/cabaceiras'

export const valuesMap: Record<string, MunicipalityValues> = {
  '2507507': joaoPessoa,
  '2504009': campinaGrande,
  '2512507': queimadas,
  '2504603': conde,
  '2503001': caapora,
  '2511905': pitimbu,
  '2509701': monteiro,
  '2503100': cabaceiras,
}
