// Escolha de município: o CitySelector em cima e o mapa da PB embaixo, os dois
// trocando o mesmo município. Fica no topo da SectionJornada, acima do
// ModeToggle, e é o que aparece antes de haver município escolhido.
import CitySelector from '@/components/layout/CitySelector'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useMunicipalityChange } from '@/hooks/useMunicipalityChange'

interface MunicipalityMapProps {
  className?: string
}

export default function MunicipalityMap({ className = '' }: MunicipalityMapProps) {
  const { municipality, municipalities, loading } = useMunicipality()
  const changeMunicipality = useMunicipalityChange()

  function handleMapSelect(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (match) void changeMunicipality(match.id, match.name, 'map')
  }

  return (
    <div className={`flex flex-col items-center gap-md ${className}`}>
      {/* z-10: a lista do seletor abre por cima do mapa. */}
      <div className="relative z-10 flex flex-col items-center gap-xs">
        <CitySelector />
        {!municipality.data && (
          <p className="typo-body">{loading ? 'Carregando indicadores…' : 'ou clique no mapa'}</p>
        )}
      </div>
      <ParaibaOutlineMap
        className="max-w-[900px]"
        selectedId={municipality.id}
        onSelect={handleMapSelect}
      />
    </div>
  )
}
