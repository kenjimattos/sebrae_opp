// Modo "Panorâma Sócioeconômico" da aba Ambiente — só os cards de base econômica.
// A análise por IA que ficava abaixo deles mudou de endereço: virou o modo vizinho
// "Análise do município" (`analysis/ModeAnalysis`), para não existir em duas cópias.

import EconomicBaseCard from '@/components/economics/EconomicsCard'
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
    </div>
  )
}
