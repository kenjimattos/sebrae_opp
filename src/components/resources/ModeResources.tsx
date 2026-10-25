// Modo "Emendas" do pilar Mapeamento de recursos.
//
// Uma esfera por vez, escolhida no toggle acima do mapa: o mapa coroplético da
// Paraíba (valor pago por município), o total do estado, o card do município
// selecionado e a quebra por função — tudo da esfera ativa. As duas NÃO são
// somadas num número único: a federal vem de código IBGE estruturado (exata) e a
// estadual é inferida do texto da emenda (estimativa) — ver `atribuicao` em
// src/types/emendas.ts.

import { useMemo, useState } from 'react'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import ModeToggle from '@/components/ui/ModeToggle'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import { resourcesContent } from '@/data/home/resources'
import { findEmendaMunicipio, intensidadePorMunicipio, useEmendas } from '@/hooks/useEmendas'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useMunicipalityChange } from '@/hooks/useMunicipalityChange'
import type { EmendaEsfera } from '@/types/emendas'
import { formatReaisCurto } from '@/utils/emendas'
import EmendasEsferaCard from './EmendasEsferaCard'
import EmendasFuncaoTable from './EmendasFuncaoTable'

const ESFERA_OPTIONS = [
  { value: 'federal', label: resourcesContent.esferas.federal.label },
  { value: 'estadual', label: resourcesContent.esferas.estadual.label },
]

export default function ModeResources() {
  const { municipality, municipalities } = useMunicipality()
  const changeMunicipality = useMunicipalityChange()
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
    if (match) void changeMunicipality(match.id, match.name, 'map')
  }

  // Tooltip do hover: o valor daquele município na esfera ativa, para comparar
  // sem precisar clicar.
  function tooltipDetail(id: string) {
    const v = findEmendaMunicipio(data, id)?.[esfera]
    if (!v) return 'sem emendas no período'
    return `${formatReaisCurto(v.pago)} pagos`
  }

  return (
    // gap-md (não gap-lg) e p-md: o painel precisa fechar perto da altura da
    // SideNav (83dvh) — com gap-lg os blocos sozinhos custavam 160px de respiro.
    <div className="flex flex-col w-full glass rounded p-md gap-lg">
      <TitleSubtitle
        size="md"
        title={resourcesContent.emendas.title}
        subtitle={resourcesContent.emendas.description}
      />

      {error && (
        <p className="typo-body text-inactive">
          Não foi possível carregar os dados de emendas. {error}
        </p>
      )}

      {/* Toggle logo acima do mapa e centrado com ele: é o mapa (e tudo abaixo)
          que ele troca, não o título. */}
      <div className="flex flex-col items-center w-full gap-lg">
        <ModeToggle
          value={esfera}
          onChange={(v) => setEsfera(v as EmendaEsfera)}
          options={ESFERA_OPTIONS}
          ariaLabel="Esfera das emendas"
        />
        {/* Mapa limitado em largura — a altura dele acompanha a largura
            (viewBox ~1000×460). */}
        <div className="flex flex-col items-center w-full gap-sm">
        <ParaibaOutlineMap
          values={intensidades}
          tooltipDetail={tooltipDetail}
          selectedId={municipality.id}
          onSelect={handleMapSelect}
          padding={2}
          className="max-w-[520px]"
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
        {/* Total do estado na esfera ativa, sob o mapa: é o contexto da escala. */}
        {estado && (
          <p className="typo-body-sm text-inactive text-center">
            <span className="typo-body-sm-bold">
              {resourcesContent.estado.titulo} · {resourcesContent.esferas[esfera].label}
            </span>{' '}
            — {formatReaisCurto(estado.pago)} pagos, dos quais{' '}
            {formatReaisCurto(estado.naoMunicipalizado.pago)}{' '}
            {esfera === 'federal'
              ? resourcesContent.estado.naoMunicipalizadoFederal
              : resourcesContent.estado.naoMunicipalizadoEstadual}
            .
          </p>
        )}
      </div>
      </div>

      {/* Abaixo do mapa, um sob o outro e na largura toda: nome do município, card
          e tabela por função — tudo da esfera ativa. */}
      {loading && !data ? (
        <p className="typo-body text-inactive">Carregando emendas…</p>
      ) : municipality.id && selecionado && meta ? (
        <div className="flex flex-col w-full gap-md">
          <h3 className="typo-h3">{selecionado.name}</h3>
          <EmendasEsferaCard esfera={esfera} meta={meta} valores={selecionado[esfera]} />
          {/* Some sozinha quando a esfera não tem quebra (município sem emenda
              estadual vem `null`). */}
          <EmendasFuncaoTable esfera={esfera} meta={meta} valores={selecionado[esfera]} />
        </div>
      ) : (
        <p className="typo-body text-inactive">{resourcesContent.mapa.semSelecao}</p>
      )}
    </div>
  )
}
