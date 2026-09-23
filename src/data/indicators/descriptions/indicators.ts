// Descrições breves dos indicadores para tooltip de AgendaIndicator.
// Chave: id do indicador no catálogo (src/data/indicators/catalog.ts) — estável mesmo
// se o label for editado. No futuro, essas descrições podem ser geradas por
// LLM ou vir de CMS.

export const indicatorInfo: Record<string, string> = {
  // Governança
  'igm-cfa':
    'Índice do Conselho Federal de Administração que avalia a qualidade da gestão pública municipal em três dimensões: Finanças, Gestão e Desempenho.',
  'idh-m':
    'Índice de Desenvolvimento Humano Municipal — combina longevidade, educação e renda. Quanto mais próximo de 1, maior o desenvolvimento humano.',
  'isdel-governanca':
    'Dimensão do Índice Sebrae de Desenvolvimento Econômico Local (ISDEL) que avalia a capacidade institucional do município para promover desenvolvimento econômico.',
  'igma':
    'Avaliação multidimensional da gestão municipal desenvolvida pela Áquila, combinando indicadores de eficiência administrativa, fiscal e social.',

  // Simplificação
  // Não prometer "comparado à média da Paraíba": nenhuma média estadual é
  // calculada, servida ou exibida em lugar nenhum — o texto anunciava uma
  // comparação que não existe. O que existe é a faixa oficial da Redesim.
  'tempo-viabilidade':
    'Tempo médio para análise de viabilidade locacional na abertura de empresas, em horas úteis (marco de 75% dos processos).',
  'tempo-abertura':
    'Horas necessárias para abrir formalmente uma empresa no município, da solicitação ao CNPJ ativo.',
  // Estes dois exibem PONTUAÇÃO, não posição nem tempo — e os rótulos ("Ranking",
  // "Tempo de licenciamento") sugerem o contrário. O tooltip é o único lugar onde
  // isso se esclarece, então ele tem de dizer a escala e a direção. O texto anterior
  // do licenciamento dizia "Dias para emissão", o que fazia o card afirmar que
  // Campina Grande leva "57 dias" — com farol verde e a barra apontando que mais
  // é melhor. Ver database/MAPEAMENTO_BASE_DOS_DADOS.md §10.
  'ranking-redesim':
    'Pontuação do município no Ranking da Redesim/PB (escala 0–600), somando documentos habilitados, atendimento e tempo. Não é a posição: quanto maior a pontuação, melhor a integração à Rede Nacional para Simplificação do Registro e da Legalização de Empresas e Negócios.',
  'tempo-licenciamento':
    'Pontuação do Índice de Tempo dos alvarás de localização e sanitário (escala 0–120). Não são dias: quanto maior a pontuação, mais rápido o licenciamento. A Redesim só publica horas brutas de alvará no nível estadual, então por município usa-se a pontuação derivada das faixas oficiais de horas.',

  // Inovação
  'trabalhadores-ct':
    'Número de trabalhadores formais em ocupações de Ciência e Tecnologia, conforme RAIS/CAGED.',
  'trabalhadores-tic':
    'Participação percentual dos trabalhadores formais em setores intensivos em conhecimento, criatividade e tecnologia.',
  'crescimento-mpe':
    'Variação anual no número de micro e pequenas empresas formalizadas dentro de Ecossistemas Locais de Inovação (ELI) apoiados pelo Sebrae.',
  'compras-publicas-inovacao':
    'Variação anual do volume que o município adquire em bens e serviços inovadores ofertados por micro e pequenas empresas.',

  // Educação empreendedora
  'isdel-educacao-emp':
    'Subdimensão do ISDEL que mede o nível de oferta de educação empreendedora na rede de ensino do município.',
  // O valor exibido é CONTAGEM de vínculos, não percentual — as duas descrições
  // diziam "Percentual" ao lado de um número como 70.626. A classificação é
  // por 1.000 habitantes, que é o que torna municípios de portes diferentes
  // comparáveis; o card segue mostrando a contagem.
  'trabalhadores-medio-completo':
    'Número de trabalhadores com carteira assinada cuja escolaridade é o Ensino Médio completo (RAIS). Classificado por 1.000 habitantes.',
  'trabalhadores-superior-completo':
    'Número de trabalhadores com carteira assinada cuja escolaridade é o Ensino Superior completo (RAIS). Classificado por 1.000 habitantes.',

  // Financiamento e crédito
  'credito-financiamento':
    'Montante total de crédito e financiamento concedido a pessoas físicas e jurídicas no município (base SCR/Banco Central).',
  'bndes-operacoes':
    'Volume de financiamentos estruturados (diretos e indiretos) direcionados ao município, excluindo repasses automáticos.',

  // Inclusão produtiva
  'negocios-abertos':
    'Número de micro e pequenas empresas formalmente abertas no município no período de referência.',
  'empresas-ativas':
    'Estoque total de empresas com CNPJ ativo no município.',
  'negocios-extintos':
    'Número de micro e pequenas empresas com baixa formalizada no município no período de referência.',
  'bolsa-familia':
    'Variação anual no número de beneficiários em idade produtiva — funciona como indicador inverso de inserção no mercado de trabalho.',
  'apoiados-sebrae':
    'Quantidade de micro e pequenas empresas que receberam alguma solução de atendimento do Sebrae no período.',
  'mpe-compras-publicas':
    'Participação das micro e pequenas empresas no valor total adquirido pela prefeitura em licitações e contratos.',
  'linhas-credito':
    'Número de linhas de crédito ativas com agentes financeiros parceiros para micro e pequenas empresas do município.',
}
