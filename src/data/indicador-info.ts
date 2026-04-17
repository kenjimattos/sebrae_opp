// Descrições breves dos indicadores para tooltip de AgendaIndicator
// Chave: label do indicador (match exato com os JSONs de agendas)
// No futuro, essas descrições podem ser geradas por LLM ou vir de CMS.

export const indicadorInfo: Record<string, string> = {
  // Governança
  'IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025':
    'Índice do Conselho Federal de Administração que avalia a qualidade da gestão pública municipal em três dimensões: Finanças, Gestão e Desempenho.',
  'IDH-M 2021':
    'Índice de Desenvolvimento Humano Municipal — combina longevidade, educação e renda. Quanto mais próximo de 1, maior o desenvolvimento humano.',
  'Governança para o Desenvolvimento – ISDEL 2023':
    'Dimensão do Índice Sebrae de Desenvolvimento Econômico Local (ISDEL) que avalia a capacidade institucional do município para promover desenvolvimento econômico.',
  'Índice de Gestão Municipal Áquila (IGMA)':
    'Avaliação multidimensional da gestão municipal desenvolvida pela Áquila, combinando indicadores de eficiência administrativa, fiscal e social.',

  // Simplificação
  'Tempo médio de viabilidade da empresa (h) em relação à média estadual':
    'Tempo médio para análise de viabilidade locacional na abertura de empresas, comparado à média da Paraíba.',
  'Tempo médio de abertura da empresa (h)':
    'Horas necessárias para abrir formalmente uma empresa no município, da solicitação ao CNPJ ativo.',
  'Ranking municipal Redesim/PB':
    'Posição do município na integração com a Rede Nacional para Simplificação do Registro e da Legalização de Empresas e Negócios (Redesim).',
  'Tempo de licenciamento':
    'Dias para emissão de alvará de funcionamento e licenças para atividades de baixo risco.',

  // Inovação
  'Trabalhadores nas ocupações de C&T':
    'Número de trabalhadores formais em ocupações de Ciência e Tecnologia, conforme RAIS/CAGED.',
  'Trabalhadores nos setores da economia criativa, inovação e TIC':
    'Participação percentual dos trabalhadores formais em setores intensivos em conhecimento, criatividade e tecnologia.',
  'Taxa de crescimento de MPE formalizadas nos ELI com apoio Sebrae':
    'Variação anual no número de micro e pequenas empresas formalizadas dentro de Ecossistemas Locais de Inovação (ELI) apoiados pelo Sebrae.',
  'Taxa de crescimento do valor das compras públicas de inovação nos pequenos negócios':
    'Variação anual do volume que o município adquire em bens e serviços inovadores ofertados por micro e pequenas empresas.',

  // Educação empreendedora
  'Subdimensão Educação Empreendedora, da dimensão Capital Empreendedor – ISDEL':
    'Subdimensão do ISDEL que mede o nível de oferta de educação empreendedora na rede de ensino do município.',
  'Trabalhadores formais com pelo menos o Ensino Médio Completo':
    'Percentual de trabalhadores com carteira assinada com escolaridade igual ou superior ao Ensino Médio completo (RAIS).',
  'Trabalhadores formais com pelo menos o Ensino Superior Completo':
    'Percentual de trabalhadores com carteira assinada com escolaridade igual ou superior ao Ensino Superior completo (RAIS).',

  // Financiamento e crédito
  'Valor (R$) das operações de crédito e de financiamento concedidos no município':
    'Montante total de crédito e financiamento concedido a pessoas físicas e jurídicas no município (base SCR/Banco Central).',
  'Valor (R$) total das Operações diretas e indiretas não automáticas (financiamento e crédito)':
    'Volume de financiamentos estruturados (diretos e indiretos) direcionados ao município, excluindo repasses automáticos.',

  // Inclusão produtiva
  'Total de pequenos negócios abertos':
    'Número de micro e pequenas empresas formalmente abertas no município no período de referência.',
  'Total de empresas ativas':
    'Estoque total de empresas com CNPJ ativo no município.',
  'Total de pequenos negócios extintos no período':
    'Número de micro e pequenas empresas com baixa formalizada no município no período de referência.',
  'Taxa de crescimento anual de beneficiários do Bolsa Família entre 18 e 50 anos':
    'Variação anual no número de beneficiários em idade produtiva — funciona como indicador inverso de inserção no mercado de trabalho.',
  'Número de pequenos negócios apoiados pelo Sebrae':
    'Quantidade de micro e pequenas empresas que receberam alguma solução de atendimento do Sebrae no período.',
  '% dos pequenos negócios no total de compras públicas no município':
    'Participação das micro e pequenas empresas no valor total adquirido pela prefeitura em licitações e contratos.',
  'Linhas de Crédito Disponíveis':
    'Número de linhas de crédito ativas com agentes financeiros parceiros para micro e pequenas empresas do município.',
}
