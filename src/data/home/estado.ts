// Conteúdo editorial e apresentação da visão estadual (SectionEstado).
//
// Os NÚMEROS vêm da API (`GET /api/estado`), inclusive label, descrição e fonte
// de cada indicador — aqui ficam só as decisões de tela: em que tema cada
// indicador entra, que gráfico ele ganha e a nota que a fonte não dá.

/** Um tema do destaque por assunto. `geral` acende todos. */
export interface EstadoTema {
  value: string
  label: string
}

export const estadoContent = {
  title: 'Panorama estadual',
  // Entra no SectionHeader, em caixa alta — frase curta por isso.
  subtitle: 'o estado inteiro, para situar o município',
  // Por que não há semáforo aqui — a ausência é deliberada, e a tela precisa
  // dizer isso antes que alguém leia a posição como nota.
  nota: 'Cada card traz a posição da Paraíba entre as 27 UFs e entre as 9 do Nordeste. Posição compara o estado com os pares; não classifica desempenho — estes indicadores não têm faixa oficial, e por isso não recebem cor.',
  destaque: 'Destacar por tema',
  erro: 'Não foi possível carregar os indicadores estaduais.',
  carregando: 'Carregando indicadores estaduais…',
} as const

// Ordem fixa do toggle. `saude` está declarado porque é um dos temas pedidos,
// mas só aparece quando existir indicador estadual de saúde: tema sem indicador
// apagaria o painel inteiro ao ser escolhido. Entra sozinho quando o dado chegar.
export const TEMAS: EstadoTema[] = [
  { value: 'geral', label: 'Visão geral' },
  { value: 'demografia', label: 'Demografia e desenvolvimento' },
  { value: 'educacao', label: 'Educação' },
  { value: 'saude', label: 'Saúde' },
  { value: 'economia', label: 'Economia e renda' },
  { value: 'trabalho', label: 'Mercado de trabalho' },
  { value: 'empresas', label: 'Empresas' },
]

export const TEMA_PADRAO = 'geral'

/**
 * Gráfico do card, escolhido pelo que o dado É — e os dois tipos prometem
 * coisas diferentes:
 *
 * - `bars` é zero-based e compara grandezas (composição por setor, por porte).
 * - `line` é escalada entre o mínimo e o máximo da série e mostra TENDÊNCIA.
 *   Barra com essa escala mentiria: a população da PB sobe 18% em 25 anos e
 *   viraria uma rampa de zero ao topo.
 */
export type EstadoChart =
  | {
      kind: 'bars'
      key: string
      max?: number
      caption?: string
      /** Chave do total de referência: vira a fatia que o card representa do todo. */
      totalKey?: string
      totalLabel?: string
    }
  | { kind: 'line' }
  | { kind: 'none' }

export interface EstadoCardView {
  id: string
  temas: string[]
  /** `sm` = grade de 4 colunas; `lg` = grade de 2 (os cards com distribuição). */
  width: 'sm' | 'lg'
  chart: EstadoChart
  /** Ressalva que a descrição da fonte não cobre. Entra no tooltip. */
  nota?: string
}

// Indicador que não estiver aqui ainda aparece: cai no fallback de SectionEstado
// (card `sm`, série em linha, tema `geral`). O painel é DB-driven como o resto —
// não pode sumir com dado novo só porque esta tabela não foi atualizada.
export const CARD_VIEWS: EstadoCardView[] = [
  {
    id: 'uf-populacao',
    temas: ['demografia'],
    width: 'sm',
    chart: { kind: 'line' },
    nota: 'A posição aqui é ordem de tamanho — 14ª UF mais populosa —, não desempenho.',
  },
  {
    id: 'uf-empregados',
    temas: ['trabalho', 'economia'],
    width: 'sm',
    chart: { kind: 'line' },
    nota: 'Conta vínculos ativos em 31 de dezembro, não pessoas: quem tem dois empregos formais aparece duas vezes.',
  },
  {
    id: 'uf-remuneracao-media',
    temas: ['economia', 'trabalho'],
    width: 'sm',
    chart: { kind: 'line' },
    nota: 'Valor nominal do ano, sem correção pela inflação — a linha mistura ganho real e reajuste de preços.',
  },
  {
    id: 'uf-matriculas-superior',
    temas: ['educacao', 'demografia'],
    width: 'sm',
    chart: { kind: 'line' },
  },
  {
    id: 'uf-emprego-setor',
    temas: ['trabalho', 'economia'],
    width: 'lg',
    chart: { kind: 'bars', key: 'porSetor' },
  },
  {
    id: 'uf-empresas-ativas',
    temas: ['empresas', 'economia'],
    width: 'lg',
    chart: {
      kind: 'bars',
      key: 'porSituacaoCadastral',
      caption: 'Todas as situações cadastrais na Receita Federal; o valor do card é só a linha Ativa.',
    },
  },
  {
    id: 'uf-emprego-porte',
    temas: ['trabalho', 'empresas'],
    width: 'lg',
    chart: {
      kind: 'bars',
      key: 'porFaixa',
      totalKey: 'totalEstadoTodosOsPortes',
      totalLabel: 'do emprego formal do estado',
    },
    nota: 'Só micro e pequenas empresas: médias e grandes ficam fora do total.',
  },
  {
    id: 'uf-enem-media',
    temas: ['educacao'],
    width: 'lg',
    chart: { kind: 'bars', key: 'porArea', max: 1000, caption: 'Escala de 0 a 1.000 pontos por área.' },
    nota: 'Média simples das 4 áreas objetivas. Não inclui a redação, que a fonte não publica neste recorte.',
  },
]
