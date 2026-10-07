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
  title: 'visão estadual da paraíba',
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
 * Gráfico do card. `bars` é zero-based e compara grandezas (composição por
 * setor, por área). Série histórica não se desenha: a linha saiu do painel, e
 * barra com escala entre mínimo e máximo mentiria — a população da PB sobe 18%
 * em 25 anos e viraria uma rampa de zero ao topo.
 */
export type EstadoChart =
  | {
      kind: 'bars'
      key: string
      max?: number
      caption?: string
      /** Rótulo da fatia que é o próprio valor do card; as outras recuam. */
      destaque?: string
    }
  | { kind: 'none' }

export interface EstadoCardView {
  id: string
  temas: string[]
  /**
   * `sm` = grade de 4 colunas, só número e posição; `lg` = uma das duas colunas
   * de baixo. As colunas são independentes (não uma grade de linhas): card com
   * 2 linhas ao lado de um com 10 esticava e abria um vazio sob o título.
   */
  width: 'sm' | 'lg'
  /** Só para `lg`. Dentro da coluna vale a ordem desta tabela. */
  coluna?: 'esquerda' | 'direita'
  chart: EstadoChart
  /** Quanto o valor do card é de um total guardado no breakdown. */
  parte?: { totalKey: string; totalLabel: string }
  /** Ressalva que a descrição da fonte não cobre. Entra no tooltip. */
  nota?: string
}

// Indicador que não estiver aqui ainda aparece: cai no fallback de SectionEstado
// (card `sm`, sem gráfico, tema `geral`). O painel é DB-driven como o resto —
// não pode sumir com dado novo só porque esta tabela não foi atualizada.
export const CARD_VIEWS: EstadoCardView[] = [
  {
    id: 'uf-populacao',
    temas: ['demografia'],
    width: 'sm',
    chart: { kind: 'none' },
    nota: 'A posição aqui é ordem de tamanho — 14ª UF mais populosa —, não desempenho.',
  },
  {
    id: 'uf-empregados',
    temas: ['trabalho', 'economia'],
    width: 'sm',
    chart: { kind: 'none' },
    nota: 'Conta vínculos ativos em 31 de dezembro, não pessoas: quem tem dois empregos formais aparece duas vezes.',
  },
  {
    id: 'uf-remuneracao-media',
    temas: ['economia', 'trabalho'],
    width: 'sm',
    chart: { kind: 'none' },
    nota: 'Valor nominal do ano, sem correção pela inflação — a variação mistura ganho real e reajuste de preços.',
  },
  {
    id: 'uf-matriculas-superior',
    temas: ['educacao', 'demografia'],
    width: 'sm',
    chart: { kind: 'none' },
  },
  {
    id: 'uf-emprego-setor',
    temas: ['trabalho', 'economia'],
    width: 'lg',
    coluna: 'esquerda',
    chart: { kind: 'bars', key: 'porSetor' },
  },
  {
    id: 'uf-empresas-ativas',
    temas: ['empresas', 'economia'],
    width: 'lg',
    coluna: 'direita',
    chart: {
      kind: 'bars',
      key: 'porSituacaoCadastral',
      destaque: 'Ativa',
      caption: 'Todas as situações cadastrais na Receita Federal; o valor do card é só a linha Ativa.',
    },
  },
  {
    id: 'uf-emprego-porte',
    temas: ['trabalho', 'empresas'],
    width: 'lg',
    coluna: 'esquerda',
    // Sem barras: ME contra EPP são duas linhas quase iguais, e o que informa é
    // a fatia do emprego formal.
    chart: { kind: 'none' },
    parte: { totalKey: 'totalEstadoTodosOsPortes', totalLabel: 'do emprego formal do estado' },
    nota: 'Só micro e pequenas empresas: médias e grandes ficam fora do total.',
  },
  {
    id: 'uf-enem-media',
    temas: ['educacao'],
    width: 'lg',
    coluna: 'direita',
    chart: { kind: 'bars', key: 'porArea', max: 1000, caption: 'Escala de 0 a 1.000 pontos por área.' },
    nota: 'Média simples das 4 áreas objetivas. Não inclui a redação, que a fonte não publica neste recorte.',
  },
]
