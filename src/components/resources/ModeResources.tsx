// Modo "Emendas" do pilar Mapeamento de recursos.
//
// Mapa coroplético da Paraíba com o valor pago por município, alternando entre
// as esferas federal e estadual. As duas NÃO são somadas num número único: a
// federal vem de código IBGE estruturado (exata) e a estadual é inferida do
// texto da emenda (estimativa) — ver `atribuicao` em src/types/emendas.ts.
// O detalhamento por emenda continua sendo encaminhado para o Datapedia.

import { useMemo, useState } from 'react'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import Button from '@/components/ui/buttons/Button'
import ModeToggle from '@/components/ui/ModeToggle'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import { DATAPEDIA_URL, resourcesContent } from '@/data/home/resources'
import { findEmendaMunicipio, intensidadePorMunicipio, useEmendas } from '@/hooks/useEmendas'
import { useMunicipality } from '@/hooks/useMunicipality'
import type { EmendaEsfera } from '@/types/emendas'
import { formatReaisCurto } from '@/utils/emendas'
import EmendasEsferaCard from './EmendasEsferaCard'

const ESFERA_OPTIONS = [
  { value: 'federal', label: resourcesContent.esferas.federal.label },
  { value: 'estadual', label: resourcesContent.esferas.estadual.label },
]

export default function ModeResources() {
  const { municipality, municipalities, setMunicipality } = useMunicipality()
  const { data, loading, error } = useEmendas()
  const [esfera, setEsfera] = useState<EmendaEsfera>('federal')

  // Colore pelo pago: é o recurso que de fato chegou, e a métrica que o painel
  // destaca. O empenhado aparece no card, mas não pinta o mapa.
  const intensidades = useMemo(
    () => intensidadePorMunicipio(data, esfera, 'pago'),
    [data, esfera],
  )

  const selecionado = findEmendaMunicipio(data, municipality.id)
  const meta = data?.esferas[esfera] ?? null
  const estado = meta?.estado ?? null

  function handleMapSelect(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (match) setMunicipality(match.id, match.name, 'map')
  }

  // Tooltip do hover: o valor daquele município na esfera ativa, para comparar
  // sem precisar clicar.
  function tooltipDetail(id: string) {
    const m = findEmendaMunicipio(data, id)
    const v = m?.[esfera]
    if (!v) return 'sem emendas no período'
    return `${formatReaisCurto(v.pago)} pagos`
  }

  return (
    <div className="flex flex-col glass rounded-sm p-lg gap-lg">
      <div className="flex-between gap-md w-full">
        <TitleSubtitle
          size="md"
          title={resourcesContent.emendas.title}
          subtitle={resourcesContent.emendas.description}
        />
        <ModeToggle
          value={esfera}
          onChange={(v) => setEsfera(v as EmendaEsfera)}
          options={ESFERA_OPTIONS}
          ariaLabel="Esfera das emendas"
          className="shrink-0"
        />
      </div>

      {error && (
        <p className="typo-body text-inactive">
          Não foi possível carregar os dados de emendas. {error}
        </p>
      )}

      {/* Mapa em largura total, com os cards das duas esferas embaixo. */}
      <div className="flex flex-col w-full gap-sm">
        <ParaibaOutlineMap
          values={intensidades}
          tooltipDetail={tooltipDetail}
          selectedId={municipality.id}
          onSelect={handleMapSelect}
          padding={2}
        />
        <div className="flex items-center gap-sm">
          <span className="typo-body-sm text-inactive">
            {resourcesContent.mapa.legendaTitulo}
          </span>
          <span className="typo-body-sm text-inactive">
            {resourcesContent.mapa.legendaMenor}
          </span>
          <div
            aria-hidden
            className="h-2 w-32 rounded-full"
            style={{
              background:
                'linear-gradient(to right, color-mix(in oklab, var(--semantic-accent) 8%, var(--semantic-surface-primary)), var(--semantic-accent))',
            }}
          />
          <span className="typo-body-sm text-inactive">
            {resourcesContent.mapa.legendaMaior}
          </span>
        </div>
      </div>

      {/* Município selecionado: as duas esferas lado a lado */}
      <div className="flex flex-col w-full gap-md">
        {loading && !data ? (
          <p className="typo-body text-inactive">Carregando emendas…</p>
        ) : (
          <>
            {municipality.id && selecionado ? (
              <>
                <h3 className="typo-h3">{selecionado.name}</h3>
                {/* Ordem FIXA (federal, estadual): lado a lado, reordenar pela
                    esfera ativa faria os cards trocarem de lugar a cada toggle.
                    A ativa é marcada por um anel de acento. */}
                <div className="grid-2 gap-md items-start">
                  {(['federal', 'estadual'] as const).map((e) => (
                    <EmendasEsferaCard
                      key={e}
                      esfera={e}
                      meta={data!.esferas[e]}
                      valores={selecionado[e]}
                      className={
                        esfera === e ? 'ring-1 ring-[var(--semantic-accent)]' : ''
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="typo-body text-inactive">
                {resourcesContent.mapa.semSelecao}
              </p>
            )}

            {estado && meta && (
              <div className="flex flex-col gap-2xs border-t pt-sm">
                <span className="typo-body-sm-bold">
                  {resourcesContent.estado.titulo} · {resourcesContent.esferas[esfera].label}
                </span>
                <span className="typo-body-sm text-inactive">
                  {formatReaisCurto(estado.pago)} pagos no total do estado, dos quais{' '}
                  {formatReaisCurto(estado.naoMunicipalizado.pago)}{' '}
                  {esfera === 'federal'
                    ? resourcesContent.estado.naoMunicipalizadoFederal
                    : resourcesContent.estado.naoMunicipalizadoEstadual}
                  .
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <a href={DATAPEDIA_URL} target="_blank" rel="noopener noreferrer" className="w-fit">
        <Button label={resourcesContent.buttons.explorarEmendas} variant="secondary" />
      </a>
    </div>
  )
}
