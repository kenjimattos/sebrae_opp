// Modo "Panorâma Sócioeconômico" da aba Ambiente — indicadores de base econômica
// (cards) + análise de desempenho por IA.

import EconomicBaseCard from '@/components/economic-base/EconomicBaseCard'
import EconomicBaseAnalysis from '@/components/economic-base/EconomicBaseAnalysis'
import { useMunicipality } from '@/hooks/useMunicipality'
import { getAnalysisForMunicipality } from '@/data/home/economic-base'

export default function ModePanorama() {
  const { municipality } = useMunicipality()
  const items = municipality.data?.economicBase ?? []
  const analysis = getAnalysisForMunicipality(municipality.id)

  return (
    <div className="flex flex-col gap-md w-full">
      <div className="grid-4 w-full">
        {items.map((item) => (
          <EconomicBaseCard
            key={item.id}
            id={item.id}
            label={item.label}
            value={item.value}
            variation={item.variation}
            updatedAt={item.updatedAt}
          />
        ))}
      </div>
      <EconomicBaseAnalysis key={municipality.id} analysis={analysis} />
    </div>
  )
}
