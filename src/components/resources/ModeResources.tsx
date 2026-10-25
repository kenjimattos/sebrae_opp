// Modo "Emendas" do pilar Mapeamento de recursos.
//
// Duas colunas, federal e estadual, cada uma com seu mapa coroplético da Paraíba
// (valor pago por município), o card do município selecionado e a quebra por
// função. As duas NÃO são somadas num número único: a federal vem de código IBGE
// estruturado (exata) e a estadual é inferida do texto da emenda (estimativa) —
// ver `atribuicao` em src/types/emendas.ts.

import { useMemo } from 'react'
import { ParaibaOutlineMap } from '@/components/map/ParaibaOutlineMap'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import { resourcesContent } from '@/data/home/resources'
import { findEmendaMunicipio, intensidadePorMunicipio, useEmendas } from '@/hooks/useEmendas'
import { useMunicipality } from '@/hooks/useMunicipality'
import { useMunicipalityChange } from '@/hooks/useMunicipalityChange'
import type { EmendaEsfera } from '@/types/emendas'
import { formatReaisCurto } from '@/utils/emendas'
import EmendasEsferaCard from './EmendasEsferaCard'
import EmendasFuncaoTable from './EmendasFuncaoTable'

// Ordem FIXA: federal à esquerda, estadual à direita, em todas as faixas.
const ESFERAS: readonly EmendaEsfera[] = ['federal', 'estadual']

export default function ModeResources() {
  const { municipality, municipalities } = useMunicipality()
  const changeMunicipality = useMunicipalityChange()
  const { data, loading, error } = useEmendas()

  // Colore pelo pago: é o recurso que de fato chegou. Cada mapa tem a PRÓPRIA
  // escala — o federal fica na casa dos bilhões e o estadual na dos milhões, e
  // uma régua comum apagaria o mapa estadual inteiro.
  const intensidades = useMemo(
    () => ({
      federal: intensidadePorMunicipio(data, 'federal', 'pago'),
      estadual: intensidadePorMunicipio(data, 'estadual', 'pago'),
    }),
    [data],
  )

  const selecionado = findEmendaMunicipio(data, municipality.id)

  function handleMapSelect(id: string) {
    const match = municipalities.find((m) => m.id === id)
    if (match) void changeMunicipality(match.id, match.name, 'map')
  }

  // Tooltip do hover: o valor daquele município na esfera do mapa, para comparar
  // sem precisar clicar.
  function tooltipDetail(esfera: EmendaEsfera, id: string) {
    const v = findEmendaMunicipio(data, id)?.[esfera]
    if (!v) return 'sem emendas no período'
    return `${formatReaisCurto(v.pago)} pagos`
  }

  return (
    // gap-md (não gap-lg) e p-md: o painel precisa fechar perto da altura da
    // SideNav (83dvh) — com gap-lg os blocos sozinhos custavam 160px de respiro.
    <div className="flex flex-col w-full glass rounded p-md gap-md">
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

      {/* Uma grade só, com os blocos das duas esferas intercalados (mapa, mapa,
          card, card, tabela, tabela): cada faixa se alinha pelo topo entre as
          colunas, coisa que duas colunas independentes não garantiriam.
          `grid-cols-2` (minmax(0, 1fr)) e não `.grid-2` (1fr): com 1fr a coluna não
          encolhe abaixo do conteúdo, e a 1000px o mapa estourava a página em 184px. */}
      <div className="grid grid-cols-2 gap-md items-start">
        {ESFERAS.map((e) => {
          const estado = data?.esferas[e].estado
          return (
            <div key={`mapa-${e}`} className="flex flex-col items-center gap-xs min-w-0">
              <span className="typo-body-bold self-start">
                {resourcesContent.esferas[e].titulo}
              </span>
              <ParaibaOutlineMap
                values={intensidades[e]}
                tooltipDetail={(id) => tooltipDetail(e, id)}
                selectedId={municipality.id}
                onSelect={handleMapSelect}
                padding={2}
                className="w-full"
              />
              {/* Total do estado logo abaixo do mapa da esfera: é o contexto
                  daquela escala, e com as duas lado a lado não cabe mais num
                  rodapé único. */}
              {estado && (
                <p className="typo-body-sm text-inactive self-start">
                  <span className="typo-body-sm-bold">{resourcesContent.estado.titulo}</span>{' '}
                  — {formatReaisCurto(estado.pago)} pagos, dos quais{' '}
                  {formatReaisCurto(estado.naoMunicipalizado.pago)}{' '}
                  {e === 'federal'
                    ? resourcesContent.estado.naoMunicipalizadoFederal
                    : resourcesContent.estado.naoMunicipalizadoEstadual}
                  .
                </p>
              )}
            </div>
          )
        })}

        {/* Legenda única: a rampa é a mesma nos dois mapas, só a escala muda. */}
        <div className="col-span-2 flex justify-center items-center gap-sm">
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

        {loading && !data ? (
          <p className="col-span-2 typo-body text-inactive">Carregando emendas…</p>
        ) : municipality.id && selecionado ? (
          <>
            <h3 className="col-span-2 typo-h3">{selecionado.name}</h3>
            {ESFERAS.map((e) => (
              <EmendasEsferaCard
                key={`card-${e}`}
                esfera={e}
                meta={data!.esferas[e]}
                valores={selecionado[e]}
              />
            ))}
            {/* Some sozinha quando a esfera não tem quebra (município sem emenda
                estadual vem `null`); o div vazio segura a coluna, senão a tabela
                estadual escorregaria para a esquerda.
                Abaixo de `xl` cada tabela ocupa a largura toda, uma sob a outra: a
                1000px a meia coluna tem ~250px úteis e escondia a coluna de pago
                atrás de uma rolagem. Mapas e cards cabem em meia coluna; a tabela,
                com três colunas de R$, não. */}
            {ESFERAS.map((e) =>
              selecionado[e]?.porFuncao ? (
                <EmendasFuncaoTable
                  key={`funcao-${e}`}
                  esfera={e}
                  meta={data!.esferas[e]}
                  valores={selecionado[e]}
                  className="col-span-2 xl:col-span-1"
                />
              ) : (
                <div key={`funcao-${e}`} className="hidden xl:block" />
              ),
            )}
          </>
        ) : (
          <p className="col-span-2 typo-body text-inactive">
            {resourcesContent.mapa.semSelecao}
          </p>
        )}
      </div>
    </div>
  )
}
