// Visão estadual da Home: os indicadores da Paraíba no grão UF.
//
// O ModeToggle aqui NÃO troca de painel — ele destaca um tema e recua os demais
// cards. A grade não se reorganiza de propósito: filtrar esconderia que os
// indicadores existem e faria os cards saltarem de lugar a cada clique, e o
// ponto da tela é justamente ver o conjunto e se localizar dentro dele. Card
// recuado continua legível, focável e volta ao normal no hover ou no foco.
//
// Nenhum card classifica: não há `status` nem `threshold` no contrato
// (src/types/estado.ts). O que ocupa o lugar do semáforo é a posição entre UFs.

import { useMemo, useState } from 'react'
import StateIndicatorCard from '@/components/estado/StateIndicatorCard'
import ModeToggle from '@/components/ui/ModeToggle'
import SectionHeader from '@/components/ui/SectionHeader'
import {
  CARD_VIEWS,
  SEM_CARD,
  TEMAS,
  TEMA_PADRAO,
  estadoContent,
  type EstadoCardView,
} from '@/data/home/estado'
import { useEstado } from '@/hooks/useEstado'
import type { StateIndicator } from '@/types/estado'

// Indicador que a API passou a servir e a tabela de apresentação ainda não
// conhece: entra como card pequeno, sem gráfico, no tema geral. O painel
// é DB-driven — dado novo aparece sem release de frontend.
function viewFor(indicator: StateIndicator): EstadoCardView {
  const known = CARD_VIEWS.find((v) => v.id === indicator.id)
  if (known) return known
  return { id: indicator.id, temas: [], width: 'sm', chart: { kind: 'none' } }
}

export default function SectionEstado() {
  const { data, loading, error } = useEstado()
  const [tema, setTema] = useState(TEMA_PADRAO)

  const cards = useMemo(
    () =>
      (data?.indicators ?? [])
        .filter((indicator) => !SEM_CARD.has(indicator.id))
        .map((indicator) => ({ indicator, view: viewFor(indicator) })),
    [data],
  )

  // Só entram no toggle os temas que têm indicador servido. Tema vazio apagaria
  // o painel inteiro ao ser escolhido — é o caso de Saúde hoje, que volta à
  // lista sozinho quando houver indicador estadual de saúde.
  const temas = useMemo(() => {
    const presentes = new Set(cards.flatMap((c) => c.view.temas))
    return TEMAS.filter((t) => t.value === TEMA_PADRAO || presentes.has(t.value))
  }, [cards])

  if (error) {
    return (
      <section className="section-container">
        <p className="typo-body text-inactive">{estadoContent.erro}</p>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="section-container">
        <p className="typo-body text-inactive">{loading ? estadoContent.carregando : ''}</p>
      </section>
    )
  }

  // A API manda numa ordem; na tela quem manda é a tabela de apresentação.
  // Indicador que ela ainda não conhece vai para o fim da fileira dos pequenos.
  const ordem = (id: string) => {
    const i = CARD_VIEWS.findIndex((v) => v.id === id)
    return i === -1 ? CARD_VIEWS.length : i
  }
  const pequenos = cards
    .filter((c) => c.view.width === 'sm')
    .sort((a, b) => ordem(a.indicator.id) - ordem(b.indicator.id))
  const largos = cards
    .filter((c) => c.view.width === 'lg')
    .sort((a, b) => ordem(a.indicator.id) - ordem(b.indicator.id))
  const colunas = [
    largos.filter((c) => c.view.coluna !== 'direita'),
    largos.filter((c) => c.view.coluna === 'direita'),
  ]
  const isDimmed = (view: EstadoCardView) => tema !== TEMA_PADRAO && !view.temas.includes(tema)

  return (
    <section className="section-container flex flex-col gap-md mt-lg">
      <SectionHeader title={estadoContent.title} />

      {/* O toggle fica na própria linha e centrado, como na Jornada: com seis
          temas ele ocupa quase a largura útil, e dividir a faixa com texto o
          espremeria. Rola na horizontal em vez de quebrar linha — o pill de
          seleção é posicionado por offsetLeft e não sobrevive a duas linhas. */}
      <div className="max-w-full self-center overflow-x-auto scrollbar-hide">
        <ModeToggle
          value={tema}
          onChange={setTema}
          options={temas}
          ariaLabel={estadoContent.destaque}
        />
      </div>

      <div className="flex flex-col w-full glass rounded p-md gap-md">
        {/* Duas colunas abaixo de xl: o número em typo-h2 ("R$ 3.036,47") não
            cabe num quarto da largura. */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-sm">
          {pequenos.map(({ indicator, view }) => (
            <StateIndicatorCard
              key={indicator.id}
              indicator={indicator}
              view={view}
              dimmed={isDimmed(view)}
            />
          ))}
        </div>

        <div className="grid-2">
          {colunas.map((coluna, i) => (
            <div key={i} className="flex flex-col gap-sm">
              {coluna.map(({ indicator, view }) => (
                <StateIndicatorCard
                  key={indicator.id}
                  indicator={indicator}
                  view={view}
                  dimmed={isDimmed(view)}
                  // Quem tem barras absorve a sobra de altura da coluna.
                  className={view.chart.kind === 'bars' ? 'flex-1' : ''}
                />
              ))}
            </div>
          ))}
        </div>

        <p className="typo-body-sm text-inactive">{estadoContent.nota}</p>
      </div>
    </section>
  )
}
