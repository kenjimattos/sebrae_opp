// Modo "Panorâma Sócioeconômico" da aba Ambiente — indicadores de base econômica
// (cards) + análise de desempenho gerada por IA (EconomicsAnalysis busca o próprio
// contexto no município selecionado).

import EconomicBaseCard from '@/components/economics/EconomicsCard'
import EconomicBaseAnalysis from '@/components/economics/EconomicsAnalysis'
import { useMunicipality } from '@/hooks/useMunicipality'
import { toEconomicVariation } from '@/utils/economics'

export default function ModeEconomics() {
  const { municipality } = useMunicipality()
  const items = municipality.data?.economicBase ?? []

  return (
    <div className="flex flex-1 flex-col gap-sm min-h-0">
      <div className="grid-4 w-full">
        {items.map((item) => (
          <EconomicBaseCard
            key={item.id}
            id={item.id}
            label={item.label}
            value={item.value}
            variation={toEconomicVariation(item.variation)}
            referenceYear={item.referenceYear}
          />
        ))}
      </div>
      <EconomicBaseAnalysis key={municipality.id} className="self-end" />
    </div>
  )
}
