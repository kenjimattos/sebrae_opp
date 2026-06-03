// Modo "Eixos prioritários" da aba Ambiente.
// WIP: primeiro corte do novo "segundo agenda card" — reaproveita AgendaCard com as
// agendas do município. Layout/conteúdo a refinar em iteração.

import { useMunicipality } from '@/hooks/useMunicipality'
import AgendaCard from '@/components/agenda/AgendaCard'

export default function ModeEixos() {
  const { municipality } = useMunicipality()
  const agendas = municipality.data?.agendas ?? []

  return (
    <div className="grid-2 w-full">
      {agendas.map((agenda) => (
        <AgendaCard
          key={agenda.id ?? agenda.name}
          title={agenda.name}
          indicators={agenda.indicators.slice(0, 3)}
        />
      ))}
    </div>
  )
}
