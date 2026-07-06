// Modo "Panorâma Sócioeconômico" da aba Ambiente — indicadores de base econômica
// (cards) + análise de desempenho por IA.

import EconomicBaseCard from '@/components/economics/EconomicsCard'
import EconomicBaseAnalysis from '@/components/economics/EconomicsAnalysis'
import { useMunicipality } from '@/hooks/useMunicipality'
import { getAnalysisForMunicipality } from '@/data/home/economic-base'

export default function ModeEconomics() {
  const { municipality } = useMunicipality()
  const items = municipality.data?.economicBase ?? []
  const analysis = getAnalysisForMunicipality(municipality.id)

  return (
    <div className="flex flex-1 flex-col gap-sm min-h-0">
      <div className="grid-4 w-full">
        {items.map((item) => (
          <EconomicBaseCard
            key={item.id}
            id={item.id}
            label={item.label}
            value={item.value}
            variation={item.variation}
            tone={item.tone}
            referenceYear={item.referenceYear}
          />
        ))}
      </div>
      <EconomicBaseAnalysis key={municipality.id} analysis={analysis} className="self-end" />
    </div>
  )
}
