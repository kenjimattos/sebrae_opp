// Troca de município com confirmação quando há rascunho na tela.
//
// A troca é global (MunicipalityProvider) e o formulador reage a ela recarregando
// o rascunho do novo município — o que esvazia a tela de quem estava escrevendo.
// São QUATRO entradas de interface para o mesmo efeito: a busca de cidade no topo
// da Home, o mapa da seção de agendas, o seletor dentro da etapa 1 do formulador
// e o mapa do pilar de recursos. Por isso a guarda mora aqui, num hook que todas
// usam, e não em cada botão: colocada num só, as outras três seguem abertas.
//
// A confirmação precisa vir ANTES de `setMunicipality`, porque lá dentro a troca
// é stale-while-revalidate — o município só muda quando o fetch volta, e nesse
// ponto já não há como desistir.

import { useCallback } from 'react'
import { useConfirm } from '@/hooks/useConfirm'
import { useFormulator } from '@/hooks/useFormulator'
import { useMunicipality, type MunicipalityChangeOrigin } from '@/hooks/useMunicipality'
import { hasAnyContent } from '@/utils/formulatorCompleteness'
import { CONFIRM_CHANGE_MUNICIPALITY } from '@/utils/formulatorOverwrite'

export type ChangeMunicipality = (
  id: string,
  name: string,
  origin?: MunicipalityChangeOrigin,
) => Promise<void>

export function useMunicipalityChange(): ChangeMunicipality {
  const { municipality, setMunicipality } = useMunicipality()
  const { state } = useFormulator()
  const confirm = useConfirm()

  return useCallback(
    async (id, name, origin) => {
      // Escolher o município que já está selecionado não troca nada.
      if (id === municipality.id) return
      if (hasAnyContent(state) && !(await confirm(CONFIRM_CHANGE_MUNICIPALITY))) return
      setMunicipality(id, name, origin)
    },
    [municipality.id, state, confirm, setMunicipality],
  )
}
