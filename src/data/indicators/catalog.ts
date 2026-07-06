import type { Catalog } from '@/types/indicators'

// `unit` = unidade/escala canônica de cada indicador, conforme
// database/MAPEAMENTO_BASE_DOS_DADOS.md. Serve para exibição e para espelhar o
// contrato da futura API. Os `id` estão alinhados a indicators._id do banco.
// `referenceYear` = ano a que o dado se refere (vintage), exibido no card. É
// provisório aqui no catálogo: no banco vive por-valor (indicatorValues.referenceYear,
// parte da chave/histórico) e virá de lá quando a API conectar. NÃO confundir com
// updatedAt do banco (data de coleta/refresh — um timestamp, não o ano do dado).
export const catalog: Catalog = {
  agendas: [
    {
      id: 'governanca',
      name: 'Governança: Parcerias público, privada, social para o desenvolvimento local',
      indicators: [
        { id: 'igm-cfa', label: 'Índice CFA de Governança Municipal', unit: 'índice (0–10)' },
        { id: 'idh-m', label: 'IDH-M', unit: 'índice (0–1)' },
        { id: 'isdel-governanca', label: 'Governança para o Desenvolvimento – ISDEL', unit: 'índice (0–1)' },
        { id: 'igma', label: 'Índice de Gestão Municipal Áquila (IGMA)', unit: 'índice (0–100)' },
      ],
    },
    {
      id: 'simplificacao',
      name: 'Serviços públicos mais simples e digitais para os pequenos negócios',
      indicators: [
        { id: 'tempo-viabilidade', label: 'Tempo médio de viabilidade da empresa', unit: 'h' },
        { id: 'tempo-abertura', label: 'Tempo médio de abertura da empresa (h)', unit: 'h' },
        { id: 'ranking-redesim', label: 'Ranking municipal Redesim/PB', unit: 'pontos (0–600)' },
        { id: 'tempo-licenciamento', label: 'Tempo de licenciamento', unit: 'pontos (0–120)' },
      ],
    },
    {
      id: 'inovacao',
      name: 'Ecossistemas de Inovação: Inclusão e digitalização para Pequenos Negócios',
      indicators: [
        { id: 'trabalhadores-ct', label: 'Trabalhadores nas ocupações de C&T', unit: 'vínculos' },
        { id: 'trabalhadores-tic', label: 'Trabalhadores nos setores da economia criativa, inovação e TIC', unit: '%' },
        { id: 'crescimento-mpe', label: 'Crescimento de MPE formalizadas no município', unit: '% a.a.' },
        { id: 'compras-publicas-inovacao', label: 'Crescimento do valor das compras públicas de inovação nos pequenos negócios', unit: 'R$/ano' },
      ],
    },
    {
      id: 'educacao',
      name: 'Educação empreendedora',
      indicators: [
        { id: 'isdel-educacao-emp', label: 'Educação Empreendedora – ISDEL', unit: 'índice (0–1)' },
        { id: 'trabalhadores-medio-completo', label: 'Trabalhadores formais com Ensino Médio Completo', unit: 'vínculos' },
        { id: 'trabalhadores-superior-completo', label: 'Trabalhadores formais Ensino Superior Completo', unit: 'vínculos' },
      ],
    },
    {
      id: 'credito',
      name: 'Acesso a crédito e viabilização financeira',
      indicators: [
        { id: 'credito-financiamento', label: 'Crédito concedido no município', unit: 'R$' },
        { id: 'bndes-operacoes', label: 'Operações não automáticas de crédito', unit: 'R$' },
      ],
    },
    {
      id: 'inclusao',
      name: 'Iniciativas para gerar trabalho e renda para os pequenos negócios',
      indicators: [
        { id: 'negocios-abertos', label: 'Pequenos negócios abertos', unit: 'empresas' },
        { id: 'empresas-ativas', label: 'Empresas ativas', unit: 'empresas' },
        { id: 'negocios-extintos', label: 'Pequenos negócios extintos', unit: 'empresas' },
        { id: 'bolsa-familia', label: 'Crescimento de beneficiários (18 a 50 anos)', unit: '% a.a.' },
        { id: 'apoiados-sebrae', label: 'Pequenos negócios apoiados pelo Sebrae', unit: 'empresas', implemented: false },
        { id: 'mpe-compras-publicas', label: 'Participação em compras públicas dos pequenos negocios', unit: '%' },
        { id: 'linhas-credito', label: 'Linhas de Crédito Disponíveis', unit: 'linhas', implemented: false },
      ],
    },
  ],
  economicBase: [
    { id: 'idsc', label: 'IDSC', referenceYear: '2025', unit: 'índice (0–100)' },
    { id: 'idh-m', label: 'IDH-M', referenceYear: '2010', unit: 'índice (0–1)' },
    { id: 'cobertura-atencao-basica', label: 'Cobertura Atenção Básica na Saúde', referenceYear: '2020', unit: '%' },
    { id: 'ideb-anos-iniciais', label: 'IDEB - Anos Iniciais', referenceYear: '2023', unit: 'índice (0–10)' },
    { id: 'ideb-anos-finais', label: 'IDEB - Anos Finais', referenceYear: '2023', unit: 'índice (0–10)' },
    { id: 'gini', label: 'GINI', referenceYear: '2010', unit: 'índice (0–1)' },
    { id: 'remuneracao-media', label: 'Remuneração média', referenceYear: '2024', unit: 'R$/mês' },
    { id: 'empresas-ativas-total', label: 'Empresas Ativas', referenceYear: '2025', unit: 'empresas' },
    { id: 'pib-per-capita', label: 'PIB per capita', referenceYear: '2023', unit: 'R$' },
    { id: 'meis', label: 'MEI', referenceYear: '2025', unit: 'empresas' },
    { id: 'mes', label: 'ME', referenceYear: '2025', unit: 'empresas' },
    { id: 'epps', label: 'EPP', referenceYear: '2025', unit: 'empresas' },
  ],
}
