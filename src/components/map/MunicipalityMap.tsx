// Escolha de município: o CitySelector em cima e o mapa da PB embaixo, os dois
// trocando o mesmo município. Fica no topo da SectionJornada, acima do
// ModeToggle. O seletor aparece em todos os pilares (é como se troca de
// município de qualquer lugar); o mapa só em Ambiente de negócio (`showMap`).
import CitySelector from '@/components/layout/CitySelector'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useMunicipalityChange } from '@/hooks/useMunicipalityChange'

interface MunicipalityMapProps {
  showMap?: boolean
  className?: string
}

export default function MunicipalityMap({ showMap = true, className = '' }: MunicipalityMapProps) {
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
          <p className="typo-body">
            {loading ? 'Carregando indicadores…' : showMap ? 'ou clique no mapa' : 'Escolha um município para continuar'}
          </p>
        )}
      </div>
      {showMap && (
        <ParaibaOutlineMap
          className="max-w-[680px]"
          selectedId={municipality.id}
          onSelect={handleMapSelect}
        />
      )}
    </div>
  )
}
