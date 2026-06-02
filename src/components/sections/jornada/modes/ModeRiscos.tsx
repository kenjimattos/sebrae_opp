// Modo "Riscos estratégicos" da aba Ambiente — top 3 riscos derivados das agendas
// do município (indicadores em alert/warning), em grid de 3 colunas.

import { useMunicipality } from '@/hooks/useMunicipality'
import RisksCard from '@/components/risks/RisksCard'
import { risksContext, defaultRiskContext } from '@/data/indicators/descriptions/risks'
import { selectTopRisks } from '@/utils/risks'

export default function ModeRiscos() {
  const { municipality } = useMunicipality()
  const topRisks = selectTopRisks(municipality.data?.agendas ?? [])

  return (
    <div className="grid-3 w-full">
      {topRisks.map((risk) => {
        const ctx = (risk.id && risksContext[risk.id]) || defaultRiskContext
        return (
          <RisksCard
            key={risk.id ?? risk.label}
            label={risk.label}
            value={risk.value}
            type={risk.status}
            description={ctx.description}
            indicatorLabel={ctx.indicatorLabel}
            context={ctx.context}
          />
        )
      })}
    </div>
  )
}
