// Análises textuais por município — no protótipo simulamos geração por IA.
// Futuro: substituir por chamada a LLM com os indicadores da base econômica
// como contexto.

export const analiseLabel = 'Análise' as const

export const emptyAnaliseTitle = 'Análise inteligente da base econômica' as const
export const emptyAnaliseSubtitle =
  'Gere uma leitura personalizada dos indicadores do município, com destaques, riscos e oportunidades identificadas por IA.' as const
export const gerarAnaliseLabel = 'Gerar análise com IA' as const
export const regenerarAnaliseLabel = 'Gerar novamente' as const
export const gerandoAnaliseLabel = 'Analisando indicadores…' as const

export const defaultAnalise =
  'A economia local apresenta crescimento moderado do PIB per capita e melhora nos índices de competitividade, porém mantém alta dependência do setor público e parcela significativa da população em faixa de baixa renda. O fortalecimento das MPE e a diversificação produtiva são caminhos prioritários.'

// Chave = código IBGE. Mantemos uma análise específica por município; quando
// não houver chave correspondente, caímos para `defaultAnalise`.
export const analisePorMunicipio: Record<string, string> = {
  // João Pessoa
  '2507507':
    'João Pessoa combina o maior PIB per capita do estado com forte presença de MEIs e serviços, mas o índice de Gini ainda indica distribuição de renda desigual. O IDEB dos anos finais segue abaixo da meta nacional, o que limita a formação de mão de obra qualificada. Priorize políticas de adensamento da economia criativa e de tecnologia, aproveitando a base universitária instalada, e amplie programas de qualificação voltados a jovens de bairros periféricos.',

  // Campina Grande
  '2504009':
    'Campina Grande mostra avanço consistente do IDSC e da cobertura de atenção básica, sustentado por um ecossistema maduro de MPE e pela vocação histórica em tecnologia e educação. O IDH-M em 0,720 e a remuneração média de R$ 2.400 revelam espaço para agregar valor à produção local. A maior oportunidade está em conectar as empresas ativas (12.840) às compras públicas de inovação e em expandir o crédito para os MEIs em setores emergentes.',

  // Queimadas
  '2512507':
    'Queimadas apresenta uma base econômica em transição, com crescimento de MEIs e melhoria gradual do IDEB, ainda que o Gini permaneça elevado. A proximidade com Campina Grande é ativo estratégico: há oportunidade de encadear cadeias produtivas e oferecer terrenos/galpões para empresas que buscam desconcentrar operações. Foque em infraestrutura logística, programas de formalização e qualificação técnica para jovens.',

  // Conde
  '2504603':
    'Conde combina vocação turística do litoral sul com uma base de MPE ainda pequena, o que se reflete em remuneração média baixa e cobertura de atenção básica a melhorar. A sazonalidade do turismo pressiona a informalidade — políticas de formalização assistida e linhas de crédito para microempreendedores locais podem ampliar a arrecadação. Invista em capacitação em hospitalidade e produção associada (gastronomia, artesanato).',

  // Caaporã
  '2503001':
    'Caaporã tem PIB per capita acima da média regional puxado pela indústria, mas o IDH-M e os indicadores educacionais indicam que o ganho econômico não se traduz plenamente em desenvolvimento humano. Priorize contrapartidas sociais nas políticas de atração industrial, amplie o IDEB com programas de reforço e conecte MPE locais à cadeia de fornecedores das grandes plantas instaladas.',

  // Pitimbu
  '2511905':
    'Pitimbu combina economia pesqueira tradicional com pressão de empreendimentos imobiliários no litoral. A remuneração média baixa e a baixa formalização das MPE indicam vulnerabilidade. Caminhos prioritários: apoio a cooperativas de pescadores, certificação de origem de produtos locais e programas de microcrédito combinados a qualificação em gestão para reduzir a informalidade.',

  // Monteiro
  '2509701':
    'Monteiro é polo do Cariri com base econômica diversificada em agropecuária, comércio e serviços públicos. A remuneração média segue abaixo do estado e a cobertura de atenção básica tem espaço para crescer. O semiárido impõe desafios hídricos que afetam diretamente a produtividade — articule políticas de convivência com a seca, expansão de agroindústrias e fortalecimento das MPE ligadas à cadeia caprina e de laticínios.',

  // Cabaceiras
  '2503100':
    'Cabaceiras tem economia apoiada em turismo cultural ("Roliúde Nordestina"), caprinocultura e artesanato em couro. O PIB per capita é baixo, mas a renda se distribui de forma relativamente equilibrada. Oportunidades claras: denominação de origem para produtos de couro, roteiros turísticos integrados e programas de formalização para artesãos. Ampliar o IDEB e a cobertura de atenção básica deve caminhar junto com o desenvolvimento econômico.',
}

export function getAnaliseForMunicipio(id: string | undefined): string {
  if (!id) return defaultAnalise
  return analisePorMunicipio[id] ?? defaultAnalise
}
