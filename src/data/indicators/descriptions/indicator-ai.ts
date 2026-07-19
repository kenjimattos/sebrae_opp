// Conteúdo "IA" pré-gravado do modal de indicador: explicação inicial + perguntas
// sugeridas com respostas prontas, exibidas com efeito typewriter (a chamada real
// ao LLM acontece só na pergunta livre — ver IndicatorModal).
// Chave: id do indicador no catálogo (src/data/indicators/catalog.ts), igual a
// indicatorInfo. Textos suportam os tokens {municipio}, {valor} e {status},
// preenchidos em render por fillTemplate(). Futuro: gerar/migrar para o banco.

export interface IndicatorQA {
  question: string
  answer: string
}

export interface IndicatorAiContent {
  explanation: string
  questions: IndicatorQA[]
}

export function fillTemplate(
  text: string,
  vars: { municipio: string; valor: string; status: string },
): string {
  return text
    .replaceAll('{municipio}', vars.municipio)
    .replaceAll('{valor}', vars.valor)
    .replaceAll('{status}', vars.status)
}

export const indicatorAiContent: Record<string, IndicatorAiContent> = {
  // ===== Governança =====
  'igm-cfa': {
    explanation:
      'O Índice CFA de Governança Municipal, do Conselho Federal de Administração, avalia a qualidade da gestão pública em três dimensões: Finanças, Gestão e Desempenho. Em {municipio}, o índice está em {valor}, com classificação "{status}". Ele funciona como um raio-X da capacidade administrativa da prefeitura — base para qualquer política de apoio aos pequenos negócios.',
    questions: [
      {
        question: 'Por que este indicador importa para os pequenos negócios?',
        answer:
          'Uma gestão municipal bem avaliada tende a ter finanças organizadas, serviços mais eficientes e maior capacidade de executar políticas públicas. Para o empreendedor, isso se traduz em licenciamento mais ágil, compras públicas mais transparentes e programas de apoio que saem do papel. Municípios com governança frágil têm mais dificuldade de atrair investimentos e parcerias.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Os caminhos mais comuns passam pelas três dimensões do índice: equilibrar as contas (Finanças), qualificar o quadro técnico e digitalizar processos (Gestão) e melhorar a entrega de serviços em saúde, educação e desenvolvimento (Desempenho). Programas como o Cidade Empreendedora do Sebrae ajudam a estruturar essa agenda de gestão com foco no ambiente de negócios.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'O IGM é calculado pelo Conselho Federal de Administração (CFA) a partir de bases públicas oficiais, como Tesouro Nacional (Siconfi), IBGE e ministérios setoriais. A publicação é periódica e cobre os municípios brasileiros — a Plataforma OPP traz o valor mais recente disponível para {municipio}.',
      },
    ],
  },
  'idh-m': {
    explanation:
      'O IDH-M mede o desenvolvimento humano do município combinando três dimensões: longevidade (saúde), educação e renda, numa escala de 0 a 1. {municipio} registra {valor}, classificação "{status}". É o indicador-síntese mais usado para comparar a qualidade de vida entre municípios brasileiros.',
    questions: [
      {
        question: 'O que compõe o IDH-M na prática?',
        answer:
          'Três subíndices: IDHM-Longevidade (esperança de vida ao nascer), IDHM-Educação (escolaridade da população adulta e fluxo escolar dos jovens) e IDHM-Renda (renda per capita). A média geométrica dos três gera o índice final. Um valor baixo em qualquer dimensão puxa o resultado para baixo — por isso vale olhar as dimensões separadamente para saber onde agir.',
      },
      {
        question: 'Qual a relação do IDH-M com o empreendedorismo local?',
        answer:
          'Desenvolvimento humano e ambiente de negócios se retroalimentam: mais escolaridade significa mão de obra melhor qualificada e mais empreendedores preparados; mais renda significa mercado consumidor local mais forte. Municípios que investem em educação básica e saúde criam as condições de longo prazo para os pequenos negócios prosperarem.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'O IDH-M é calculado pelo PNUD, Ipea e Fundação João Pinheiro a partir dos Censos Demográficos do IBGE. Por depender do Censo, a atualização é espaçada — o dado deve ser lido como retrato estrutural do município, não como termômetro de curto prazo.',
      },
    ],
  },
  'isdel-governanca': {
    explanation:
      'A dimensão Governança do ISDEL — Índice Sebrae de Desenvolvimento Econômico Local — avalia a capacidade institucional do município de articular parcerias e promover o desenvolvimento: conselhos ativos, planejamento, cooperação entre poder público, setor privado e sociedade. Em {municipio}, está em {valor} ("{status}").',
    questions: [
      {
        question: 'O que é o ISDEL?',
        answer:
          'O Índice Sebrae de Desenvolvimento Econômico Local mede as condições do município para gerar desenvolvimento a partir de suas próprias forças. Ele é composto por dimensões como governança local, educação empreendedora, ambiente de negócios e capital social. A dimensão exibida aqui foca na articulação institucional — a "liderança" do processo de desenvolvimento.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Ativando as instâncias de articulação: sala do empreendedor funcionando, conselho municipal de desenvolvimento com participação do setor produtivo, plano de desenvolvimento econômico atualizado e parcerias formalizadas com Sebrae, associações comerciais e instituições de ensino. Governança não exige grandes orçamentos — exige coordenação e constância.',
      },
      {
        question: 'Por que governança local importa para os pequenos negócios?',
        answer:
          'Porque políticas de apoio ao empreendedor só se sustentam quando existe estrutura institucional por trás. Onde há governança ativa, as demandas dos pequenos negócios chegam à gestão municipal, viram prioridade e sobrevivem às trocas de governo. Onde não há, cada avanço depende de esforços isolados.',
      },
    ],
  },
  igma: {
    explanation:
      'O IGMA — Índice de Gestão Municipal Áquila — é uma avaliação multidimensional da gestão pública municipal (escala 0–100), combinando eficiência administrativa, fiscal e social. {municipio} pontua {valor}, com classificação "{status}".',
    questions: [
      {
        question: 'Qual a diferença entre o IGMA e o IGM-CFA?',
        answer:
          'Ambos avaliam a qualidade da gestão municipal, mas com metodologias e recortes diferentes: o IGM-CFA (0–10) é do Conselho Federal de Administração; o IGMA (0–100) é da consultoria Áquila. Ler os dois juntos dá uma visão mais robusta — quando ambos apontam na mesma direção, o diagnóstico sobre a gestão é mais confiável.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Melhorias em arrecadação própria, controle de despesas, transparência e qualidade dos serviços tendem a mover o índice. O primeiro passo costuma ser o diagnóstico: identificar em qual dimensão (administrativa, fiscal ou social) o município mais perde pontos e priorizar ações ali.',
      },
      {
        question: 'Por que este indicador está na agenda de Governança?',
        answer:
          'Porque a agenda de Governança da Jornada do Município Empreendedor parte do princípio de que o desenvolvimento dos pequenos negócios começa pela capacidade de gestão da prefeitura. Os quatro indicadores da agenda (IGM-CFA, IDH-M, ISDEL-Governança e IGMA) medem essa capacidade por ângulos complementares.',
      },
    ],
  },

  // ===== Simplificação =====
  'tempo-viabilidade': {
    explanation:
      'Mede o tempo médio que a prefeitura leva para responder à consulta de viabilidade locacional — a etapa em que se verifica se uma atividade pode funcionar naquele endereço — no processo de abertura de empresas. Em {municipio}, a média está em {valor}, classificação "{status}". Quanto menor, melhor.',
    questions: [
      {
        question: 'O que é a consulta de viabilidade?',
        answer:
          'É a primeira etapa da abertura de uma empresa: o empreendedor informa endereço e atividade, e o município responde se aquele uso é permitido pelo zoneamento e demais regras locais. Só depois dessa resposta o processo segue para registro e inscrições. Se essa etapa trava, todo o resto espera.',
      },
      {
        question: 'Como {municipio} pode reduzir esse tempo?',
        answer:
          'Integrando-se plenamente à Redesim, automatizando a análise para atividades de baixo risco (resposta imediata), mantendo a base de zoneamento digitalizada e atualizada, e monitorando a fila de análise. Em muitos municípios, a resposta automática para baixo risco derruba o tempo de dias para minutos.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Dos registros administrativos da Redesim (Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios), que cronometram cada etapa do processo de abertura. A plataforma exibe a média das aberturas recentes em {municipio}; municípios com pouquíssimas aberturas no período podem não exibir valor, pois a média não seria representativa.',
      },
    ],
  },
  'tempo-abertura': {
    explanation:
      'Mede quantas horas, em média, leva para abrir formalmente uma empresa em {municipio} — da solicitação ao CNPJ apto a operar. O valor atual é {valor}, classificação "{status}". É um dos termômetros mais diretos da burocracia local: quanto menor, melhor o ambiente para empreender.',
    questions: [
      {
        question: 'Por que o tempo de abertura importa tanto?',
        answer:
          'Cada dia de espera é custo para quem quer empreender: aluguel correndo sem poder faturar, oportunidade parada, risco de desistência ou de informalidade. Municípios que abrem empresas rápido sinalizam respeito ao empreendedor e tendem a formalizar mais negócios — o que amplia arrecadação e emprego formal.',
      },
      {
        question: 'Como {municipio} pode reduzir esse tempo?',
        answer:
          'As alavancas principais: adesão plena à Redesim, dispensa de alvará prévio para atividades de baixo risco (como prevê a Lei de Liberdade Econômica), integração dos órgãos municipais ao processo digital e capacitação da equipe da sala do empreendedor. O benchmark nacional mostra que abrir empresa em poucas horas é perfeitamente alcançável.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Dos microdados públicos da Redesim, que registram o tempo real de cada abertura de empresa. O indicador é a média das aberturas recentes no município; onde o número de aberturas na janela é muito pequeno, o valor é ocultado para não induzir a leituras enganosas.',
      },
    ],
  },
  'ranking-redesim': {
    explanation:
      'Posição de {municipio} no ranking estadual de integração à Redesim — a rede nacional que unifica registro e legalização de empresas. A pontuação atual é {valor} ("{status}"). Ela reflete o quanto o município aderiu aos módulos de viabilidade, licenciamento e baixa integrados.',
    questions: [
      {
        question: 'O que é a Redesim?',
        answer:
          'A Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios integra, num fluxo digital único, os órgãos envolvidos na abertura de empresas: Junta Comercial, Receita Federal, Estado e prefeitura. Para o empreendedor, significa um único processo em vez de vários balcões. A pontuação mede a profundidade dessa integração no município.',
      },
      {
        question: 'Como {municipio} sobe nesse ranking?',
        answer:
          'Aderindo aos módulos que ainda faltam: consulta de viabilidade automática, licenciamento integrado (incluindo dispensa para baixo risco), alvará digital e baixa simplificada. A Junta Comercial da Paraíba e o Sebrae orientam tecnicamente as prefeituras nesse processo de integração.',
      },
      {
        question: 'Qual o efeito prático para quem empreende?',
        answer:
          'Município bem integrado à Redesim = processo de abertura mais curto, menos exigências repetidas e menos idas à prefeitura. Os indicadores de tempo de viabilidade e de abertura desta mesma agenda tendem a melhorar junto com a pontuação Redesim — eles são o resultado; o ranking mede a causa.',
      },
    ],
  },
  'tempo-licenciamento': {
    explanation:
      'Avalia a agilidade do município na emissão de alvarás e licenças de funcionamento, especialmente para atividades de baixo risco. {municipio} está com {valor}, classificação "{status}". Licenciamento é a etapa que vem depois do registro — e onde muitos municípios ainda travam o empreendedor.',
    questions: [
      {
        question: 'O que diz a lei sobre atividades de baixo risco?',
        answer:
          'A Lei de Liberdade Econômica (Lei 13.874/2019) e a legislação da Redesim dispensam alvará prévio para atividades classificadas como de baixo risco: o empreendedor declara, começa a operar e a fiscalização é posterior. Municípios que regulamentam essa dispensa eliminam a principal fila do licenciamento.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Publicando (ou atualizando) a classificação municipal de risco das atividades, automatizando a emissão de alvará para baixo risco no fluxo da Redesim e integrando corpo de bombeiros e vigilância sanitária ao processo digital. O ganho aparece rápido no tempo total de regularização.',
      },
      {
        question: 'Por que isso importa para a formalização?',
        answer:
          'Quando a licença demora, parte dos negócios simplesmente opera sem ela — informalidade que expõe o empreendedor a multas e o impede de acessar crédito e compras públicas. Licenciamento ágil formaliza mais negócios, aumenta a base de contribuintes e melhora a segurança sanitária e urbanística real, porque a fiscalização passa a enxergar quem existe.',
      },
    ],
  },

  // ===== Inovação =====
  'trabalhadores-ct': {
    explanation:
      'Conta os vínculos formais de trabalho em ocupações de Ciência e Tecnologia em {municipio} — pesquisadores, engenheiros, analistas, técnicos especializados. O valor atual é {valor} ("{status}"). É uma proxy do capital humano técnico disponível no território.',
    questions: [
      {
        question: 'Por que contar trabalhadores de C&T?',
        answer:
          'Porque inovação exige gente qualificada. Um estoque maior de profissionais técnicos indica que o município consegue atrair e reter talento — condição para empresas de maior valor agregado nascerem e crescerem ali. Para os pequenos negócios, esses profissionais são fornecedores de serviços, sócios potenciais e multiplicadores de conhecimento.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Aproximando escolas técnicas e universidades das demandas locais, apoiando a instalação de cursos superiores e técnicos na região, e criando condições para que formados fiquem: espaços de inovação, editais municipais, parcerias com empresas. A fuga de talentos para capitais é o principal adversário deste indicador no interior.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Da RAIS (Relação Anual de Informações Sociais) e do CAGED, registros administrativos do Ministério do Trabalho que cobrem todos os vínculos formais. A classificação de quais ocupações contam como C&T segue a Classificação Brasileira de Ocupações (CBO). Trabalho informal e autônomos não aparecem aqui.',
      },
    ],
  },
  'trabalhadores-tic': {
    explanation:
      'Mede a participação percentual dos trabalhadores formais de {municipio} em setores da economia criativa, inovação e TIC (tecnologia da informação e comunicação). Está em {valor} ("{status}"). Quanto maior, mais a economia local se apoia em atividades intensivas em conhecimento.',
    questions: [
      {
        question: 'O que conta como economia criativa e TIC?',
        answer:
          'Setores como desenvolvimento de software, serviços de TI, telecomunicações, design, audiovisual, publicidade, arquitetura e atividades culturais — classificados pelos códigos CNAE das empresas empregadoras. São atividades com maior valor agregado por trabalhador e menos dependentes de fatores como localização ou recursos naturais.',
      },
      {
        question: 'Como {municipio} pode desenvolver esses setores?',
        answer:
          'Formação digital desde a escola, conectividade de qualidade, espaços de coworking e comunidades tech locais, e demanda pública: a própria prefeitura contratando soluções digitais de empresas locais. O trabalho remoto abriu uma janela para o interior — profissionais de TIC podem morar no município e atender o mundo.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Da RAIS/CAGED (vínculos formais), com recorte pelos setores CNAE da economia criativa, inovação e TIC. Por medir só o emprego formal, o indicador tende a subestimar o setor — freelancers e MEIs de tecnologia, comuns na área, não entram na conta.',
      },
    ],
  },
  'crescimento-mpe': {
    explanation:
      'Mede a variação anual do número de micro e pequenas empresas formalizadas em {municipio}, no contexto dos Ecossistemas Locais de Inovação (ELI) apoiados pelo Sebrae. O valor atual é {valor} ("{status}"). Crescimento consistente indica ambiente favorável ao nascimento e sobrevivência de negócios.',
    questions: [
      {
        question: 'O que faz as MPE de um município crescerem?',
        answer:
          'Uma combinação de fatores: facilidade de abrir e operar (simplificação), acesso a crédito, mercado consumidor, qualificação empreendedora e redes de apoio. O indicador conversa com praticamente todas as outras agendas da Jornada — ele é, em boa medida, o resultado que elas buscam produzir.',
      },
      {
        question: 'O que é um Ecossistema Local de Inovação (ELI)?',
        answer:
          'É a articulação, num território, dos atores que fazem inovação acontecer: empreendedores, poder público, instituições de ensino, investidores e comunidades. O Sebrae apoia a estruturação de ELIs para que municípios criem ambientes onde negócios inovadores nasçam e cresçam — este indicador acompanha um dos efeitos esperados.',
      },
      {
        question: 'Crescer o número de MPE basta?',
        answer:
          'Não isoladamente — importa também a sobrevivência (ver "Pequenos negócios extintos", na agenda de inclusão produtiva) e a qualidade dos negócios criados. Crescimento com alta mortalidade pode indicar formalização frágil. O ideal é ler este indicador junto com abertura, extinção e estoque de empresas ativas.',
      },
    ],
  },
  'compras-publicas-inovacao': {
    explanation:
      'Acompanha o crescimento do valor que a prefeitura de {municipio} gasta comprando bens e serviços inovadores de pequenos negócios. O valor atual é {valor} ("{status}"). Compras públicas são uma das ferramentas mais poderosas — e subutilizadas — de fomento à inovação local.',
    questions: [
      {
        question: 'O poder público pode mesmo comprar inovação de MPE?',
        answer:
          'Sim. A Lei Complementar 123 garante tratamento favorecido às MPE em licitações (cotas, empate ficto, licitações exclusivas até certo valor), e marcos como a Lei de Inovação e o Marco Legal das Startups criaram instrumentos específicos, como o Contrato Público de Solução Inovadora (CPSI). O que falta, em geral, é a prefeitura estruturar seus editais para isso.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Regulamentando a LC 123 no município, mapeando demandas da gestão que pequenos negócios locais podem resolver, publicando editais acessíveis e capacitando fornecedores locais para vender ao poder público — a sala do empreendedor e o Sebrae podem conduzir essa preparação.',
      },
      {
        question: 'Qual o efeito para o ecossistema local?',
        answer:
          'A prefeitura costuma ser o maior comprador do município. Quando direciona parte desse poder de compra a soluções inovadoras de MPE locais, cria demanda previsível — que sustenta os primeiros anos dos negócios, atrai empreendedores para problemas reais da cidade e mantém o dinheiro público circulando na economia local.',
      },
    ],
  },

  // ===== Educação empreendedora =====
  'isdel-educacao-emp': {
    explanation:
      'A dimensão Educação Empreendedora do ISDEL mede o nível de oferta de educação empreendedora na rede de ensino de {municipio} — está em {valor} ("{status}"). Avalia se a escola local ensina, além do currículo tradicional, as atitudes e habilidades de empreender.',
    questions: [
      {
        question: 'O que é educação empreendedora na prática?',
        answer:
          'É incluir no dia a dia escolar o desenvolvimento de protagonismo, criatividade, planejamento e educação financeira — por meio de projetos, feiras, miniempresas e metodologias como as do programa Jovens Empreendedores Primeiros Passos (JEPP), do Sebrae. Não se trata de formar só futuros empresários, mas cidadãos capazes de transformar ideias em ação.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'Formalizando parceria com o Sebrae para levar programas de educação empreendedora à rede municipal, capacitando professores nas metodologias, e incluindo o tema no currículo complementar. Por depender majoritariamente da rede municipal de ensino, esta é uma das agendas em que a prefeitura tem controle mais direto do resultado.',
      },
      {
        question: 'Qual o retorno disso para o município?',
        answer:
          'De médio e longo prazo, mas estrutural: jovens que aprendem a empreender tendem a criar negócios mais preparados, ou a levar atitude empreendedora para qualquer carreira. Municípios pequenos, onde o emprego formal é escasso, ganham especialmente — empreender deixa de ser falta de opção e vira escolha qualificada.',
      },
    ],
  },
  'trabalhadores-medio-completo': {
    explanation:
      'Mede os trabalhadores formais de {municipio} com Ensino Médio completo ou mais. O valor atual é {valor} ("{status}"). É um retrato da escolaridade da força de trabalho formal — piso de qualificação que o mercado local consegue ofertar.',
    questions: [
      {
        question: 'Por que a escolaridade da força de trabalho importa?',
        answer:
          'Trabalhadores mais escolarizados são mais produtivos, aprendem funções novas mais rápido e sustentam negócios mais sofisticados. Para o pequeno empresário, a escolaridade local define quem ele consegue contratar; para o município, define que tipo de empresa consegue atrair. Escolaridade baixa prende a economia local em atividades de baixo valor agregado.',
      },
      {
        question: 'Como {municipio} pode melhorar neste indicador?',
        answer:
          'No curto prazo, com EJA (Educação de Jovens e Adultos) e cursos técnicos para quem já trabalha; no longo, combatendo evasão no ensino médio. Articular as escolas estaduais, o Sistema S e a demanda das empresas locais ajuda a alinhar a formação ao que o mercado do município realmente precisa.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Da RAIS, registro administrativo anual que cobre todos os vínculos formais de trabalho e inclui a escolaridade declarada de cada trabalhador. Vale lembrar que o recorte é do emprego formal — em municípios com alta informalidade, a escolaridade média real da força de trabalho pode diferir.',
      },
    ],
  },
  'trabalhadores-superior-completo': {
    explanation:
      'Mede os trabalhadores formais de {municipio} com Ensino Superior completo. Está em {valor} ("{status}"). Indica a disponibilidade de mão de obra de alta qualificação — engenheiros, professores, profissionais de saúde, gestores — na economia formal local.',
    questions: [
      {
        question: 'O que este indicador revela sobre a economia local?',
        answer:
          'Uma participação maior de diplomados no emprego formal costuma acompanhar economias com serviços mais sofisticados, melhor gestão (pública e privada) e salários médios mais altos. Participação baixa sugere que o município forma ou atrai poucos profissionais qualificados — ou que os que forma vão embora.',
      },
      {
        question: 'Como {municipio} pode reter e atrair diplomados?',
        answer:
          'Oferecendo onde trabalhar: concursos e cargos técnicos na gestão, ambiente para negócios intensivos em conhecimento, parcerias com universidades para estágio e residência no território. Qualidade de vida, conectividade e trabalho remoto também pesam — há municípios do interior atraindo profissionais que trabalham a distância.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Da RAIS (vínculos formais, escolaridade declarada pelos empregadores). O recorte formal importa: profissionais liberais autônomos e servidores de regimes próprios podem não aparecer integralmente, e a informalidade fica fora da conta.',
      },
    ],
  },

  // ===== Crédito =====
  'credito-financiamento': {
    explanation:
      'Montante total de crédito concedido a pessoas e empresas de {municipio}, segundo o Sistema de Informações de Crédito (SCR) do Banco Central. O valor atual é {valor} ("{status}"). Crédito é o oxigênio do pequeno negócio — capital de giro, investimento, travessia de crises.',
    questions: [
      {
        question: 'Por que o volume de crédito local importa?',
        answer:
          'Onde o crédito flui, negócios investem, estocam e contratam; onde falta, o crescimento fica limitado ao caixa próprio. O volume concedido no município indica o quanto o sistema financeiro enxerga e atende a economia local — e costuma refletir também a formalização: banco empresta para quem tem CNPJ, faturamento declarado e garantias.',
      },
      {
        question: 'Como {municipio} pode ampliar o acesso a crédito?',
        answer:
          'Aproximando os pequenos negócios das linhas existentes: parcerias com agências de fomento e cooperativas de crédito, divulgação do Pronampe e de fundos garantidores como o FAMPE (Sebrae), e educação financeira para o empreendedor chegar ao banco com documentação em ordem. Formalização e escrituração corretas são pré-requisitos frequentemente negligenciados.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Do SCR/Banco Central, que consolida as operações de crédito do sistema financeiro nacional. O dado reflete o crédito tomado por residentes e empresas do município em todo o sistema — não apenas nas agências fisicamente instaladas ali.',
      },
    ],
  },
  'bndes-operacoes': {
    explanation:
      'Volume de financiamentos não automáticos do BNDES direcionados a {municipio} — operações estruturadas, analisadas caso a caso, tipicamente para projetos de maior porte (infraestrutura, máquinas, expansões). O valor atual é {valor} ("{status}").',
    questions: [
      {
        question: 'O que é uma operação "não automática"?',
        answer:
          'No BNDES, operações automáticas são as repassadas por bancos parceiros dentro de linhas padronizadas (como o cartão BNDES); as não automáticas são projetos analisados diretamente pelo banco, geralmente de valor maior. O indicador foca nas não automáticas por revelarem capacidade local de estruturar projetos — inclusive da própria prefeitura.',
      },
      {
        question: 'Como {municipio} pode acessar mais recursos do BNDES?',
        answer:
          'Pelo lado público, estruturando projetos financiáveis (mobilidade, iluminação, saneamento, modernização da gestão) — o BNDES tem linhas específicas para municípios, como o FINEM e programas de desenvolvimento urbano. Pelo lado privado, empresas locais podem acessar linhas de investimento via agentes repassadores. Capacidade técnica de elaborar projetos é o gargalo típico.',
      },
      {
        question: 'Este dado cobre todos os municípios igualmente?',
        answer:
          'Não — operações não automáticas são naturalmente concentradas: muitos municípios pequenos passam anos sem nenhuma. Um valor zerado aqui é comum e não significa erro; significa oportunidade de estruturar o primeiro projeto. A fonte são os dados abertos de operações do BNDES.',
      },
    ],
  },

  // ===== Inclusão produtiva =====
  'negocios-abertos': {
    explanation:
      'Número de micro e pequenas empresas formalmente abertas em {municipio} no período de referência: {valor} ("{status}"). Mede o ritmo de criação de novos negócios — a "natalidade empresarial" do município.',
    questions: [
      {
        question: 'O que estimula a abertura de novos negócios?',
        answer:
          'Processo de abertura simples e rápido (ver agenda de Simplificação), percepção de mercado, acesso a crédito inicial e cultura empreendedora. Movimentos neste indicador costumam responder rápido a melhorias na burocracia local — é um dos primeiros a reagir quando o município se integra à Redesim.',
      },
      {
        question: 'Como interpretar este número junto com os vizinhos?',
        answer:
          'Sozinho, o número absoluto diz pouco — importa a leitura conjunta: abertos vs. extintos (saldo líquido), e a evolução do estoque de empresas ativas. Muitas aberturas com muitas extinções pode indicar rotatividade frágil (negócios que não sobrevivem); aberturas crescendo com estoque crescendo indica expansão saudável.',
      },
      {
        question: 'De onde vêm esses dados?',
        answer:
          'Dos registros de CNPJ da Receita Federal, com recorte de porte (MEI, ME e EPP) e do município de sede. Refletem formalização — um negócio que já operava informalmente e se formaliza conta como abertura, o que também é uma boa notícia para o município.',
      },
    ],
  },
  'empresas-ativas': {
    explanation:
      'Estoque total de empresas com CNPJ ativo sediadas em {municipio}: {valor} ("{status}"). É a fotografia do tecido empresarial formal do município — a base sobre a qual as demais políticas de desenvolvimento atuam.',
    questions: [
      {
        question: 'O que o estoque de empresas revela?',
        answer:
          'O tamanho e a vitalidade da economia formal local. Comparado à população, indica densidade empreendedora; acompanhado no tempo, mostra se o município está ganhando ou perdendo tecido empresarial. É também a base de contribuintes de ISS e o principal empregador privado na maioria dos municípios.',
      },
      {
        question: 'Como {municipio} pode fazer esse estoque crescer?',
        answer:
          'Crescimento vem de duas torneiras: mais aberturas (simplificação, cultura empreendedora, crédito) e menos fechamentos (capacitação, mercado, formalização bem-feita). Políticas que atacam só a abertura sem cuidar da sobrevivência produzem estoque que não se sustenta.',
      },
      {
        question: 'MEI conta como empresa ativa?',
        answer:
          'Sim — o recorte da plataforma considera os pequenos negócios: MEI, microempresas e empresas de pequeno porte com CNPJ ativo. O MEI costuma ser a maior fatia em municípios menores, e é porta de entrada típica da formalização; a migração saudável é MEI → ME → EPP conforme o negócio cresce.',
      },
    ],
  },
  'negocios-extintos': {
    explanation:
      'Número de micro e pequenas empresas com baixa formalizada em {municipio} no período: {valor} ("{status}"). É a "mortalidade empresarial" — quanto menor em relação às aberturas, mais saudável o ambiente de negócios.',
    questions: [
      {
        question: 'Por que empresas fecham?',
        answer:
          'As causas mais citadas em pesquisas do Sebrae: falta de planejamento antes de abrir, problemas de gestão (caixa, precificação), mercado insuficiente e dificuldade de crédito. Parte das baixas é natural — negócios se transformam, sócios mudam de atividade — mas mortalidade precoce alta sinaliza empreendimentos que nasceram sem preparo.',
      },
      {
        question: 'Como {municipio} pode reduzir a mortalidade?',
        answer:
          'Atacando as causas: capacitação em gestão para quem está começando (Sebrae oferece trilhas gratuitas), acompanhamento nos primeiros anos, acesso a crédito de capital de giro e a mercados — feiras, compras públicas municipais, economia local que prestigia o pequeno. A sala do empreendedor pode ser o ponto de encontro dessas ações.',
      },
      {
        question: 'Baixa formalizada é sempre negócio que "quebrou"?',
        answer:
          'Não necessariamente: há baixas por reorganização (troca de natureza jurídica, fusão de atividades) e a própria facilitação da baixa via Redesim pode gerar picos estatísticos — empresas inativas há anos regularizando a situação. Por isso a leitura deve ser da tendência ao longo do tempo, junto com aberturas e estoque ativo.',
      },
    ],
  },
  'bolsa-familia': {
    explanation:
      'Mede a variação anual do número de beneficiários do Bolsa Família entre 18 e 50 anos em {municipio}: {valor} ("{status}"). Funciona como indicador inverso de inclusão produtiva — quando pessoas em idade produtiva saem do programa por conta de renda própria, o mercado de trabalho e o empreendedorismo local estão absorvendo gente.',
    questions: [
      {
        question: 'Por que este indicador está numa agenda de pequenos negócios?',
        answer:
          'Porque nos municípios menores o caminho mais realista de saída da dependência de transferência de renda costuma ser o trabalho por conta própria e o microempreendedorismo. Acompanhar os beneficiários em idade produtiva mostra se as políticas de trabalho e renda estão funcionando na ponta.',
      },
      {
        question: 'Como transformar beneficiários em empreendedores?',
        answer:
          'Com porta de saída estruturada: qualificação profissional, formalização como MEI (que preserva o benefício em regras de transição), microcrédito produtivo orientado e inclusão em cadeias locais — feiras, agricultura familiar, serviços. Programas de inclusão produtiva articulados entre assistência social, Sebrae e sala do empreendedor têm esse desenho.',
      },
      {
        question: 'Crescimento de beneficiários é sempre sinal ruim?',
        answer:
          'Não — pode refletir melhoria na busca ativa (pessoas com direito que finalmente acessam o programa) ou choques externos (crises, secas). O alerta é quando o crescimento é persistente e descolado da região: sugere que a economia local não está gerando oportunidades para a população em idade produtiva.',
      },
    ],
  },
  'apoiados-sebrae': {
    explanation:
      'Quantidade de pequenos negócios de {municipio} que receberam alguma solução do Sebrae no período — capacitação, consultoria, orientação: {valor} ("{status}"). Mede a capilaridade do apoio institucional ao empreendedor no território.',
    questions: [
      {
        question: 'Que tipo de apoio o Sebrae oferece?',
        answer:
          'De cursos gratuitos (presenciais e online) a consultorias de gestão, marketing e finanças, passando por programas estruturantes como o Cidade Empreendedora, o ALI (Agentes Locais de Inovação) e o acesso ao FAMPE (fundo de aval para crédito). Boa parte é gratuita ou subsidiada para MEI, ME e EPP.',
      },
      {
        question: 'Como {municipio} pode ampliar esse alcance?',
        answer:
          'A prefeitura pode ser a ponte: sala do empreendedor em parceria com o Sebrae, divulgação ativa das agendas de capacitação, mutirões de atendimento e adesão a programas como o Cidade Empreendedora. Onde o poder público organiza a demanda, o atendimento do Sebrae multiplica o alcance.',
      },
      {
        question: 'Atendimento do Sebrae faz diferença mensurável?',
        answer:
          'Estudos do próprio Sebrae apontam maior taxa de sobrevivência e melhor desempenho entre negócios que passaram por capacitação e acompanhamento, especialmente nos primeiros anos de vida da empresa. O efeito esperado aparece nos indicadores vizinhos: menos extinções e mais empresas ativas.',
      },
    ],
  },
  'mpe-compras-publicas': {
    explanation:
      'Participação das micro e pequenas empresas no valor total que a prefeitura de {municipio} compra em licitações e contratos: {valor} ("{status}"). Mostra o quanto o poder de compra municipal alimenta a economia local.',
    questions: [
      {
        question: 'O que a lei garante às MPE nas licitações?',
        answer:
          'A Lei Complementar 123/2006 prevê licitações exclusivas para MPE até R$ 80 mil, cota de até 25% em compras de bens divisíveis, empate ficto (MPE pode cobrir a melhor proposta) e subcontratação compulsória. A nova Lei de Licitações manteve esses benefícios — mas eles só operam se a prefeitura os aplicar nos editais.',
      },
      {
        question: 'Como {municipio} pode aumentar essa participação?',
        answer:
          'Regulamentando a LC 123 localmente, dividindo grandes compras em lotes acessíveis, publicando um calendário anual de compras, e capacitando fornecedores locais para se cadastrar e licitar — muitos pequenos negócios nunca venderam ao poder público por puro desconhecimento do processo.',
      },
      {
        question: 'Qual o impacto de comprar do pequeno negócio local?',
        answer:
          'O dinheiro do orçamento municipal circula no próprio município: vira salário, compra no comércio vizinho, imposto local. Estudos indicam efeito multiplicador maior quando a compra pública fica com fornecedores locais, além de fortalecer negócios que empregam no território — em vez de escoar para grandes fornecedores de fora.',
      },
    ],
  },
  'linhas-credito': {
    explanation:
      'Número de linhas de crédito ativas em {municipio} por meio de agentes financeiros parceiros, voltadas a micro e pequenas empresas: {valor} ("{status}"). Mede a diversidade de opções de financiamento formal ao alcance do empreendedor local.',
    questions: [
      {
        question: 'Que tipos de linha entram nessa conta?',
        answer:
          'Linhas de bancos públicos e privados, cooperativas de crédito, agências de fomento estaduais e programas com fundo garantidor — como Pronampe e linhas com aval do FAMPE (Sebrae). A variedade importa porque cada perfil de negócio (MEI iniciante, ME em expansão, EPP investindo) precisa de produto diferente.',
      },
      {
        question: 'Como {municipio} pode ampliar a oferta local?',
        answer:
          'Atraindo cooperativas de crédito e correspondentes bancários, firmando convênio com a agência de fomento estadual, e organizando a demanda: rodadas de crédito na sala do empreendedor, com Sebrae e agentes financeiros orientando a documentação. Oferta aparece onde há demanda organizada e inadimplência controlada.',
      },
      {
        question: 'Ter linha disponível basta para o crédito chegar?',
        answer:
          'Não — disponibilidade é condição necessária, não suficiente. Os gargalos típicos são informalidade (sem CNPJ ou faturamento declarado não há análise), falta de garantias e desconhecimento das linhas. Por isso este indicador deve ser lido junto com o volume de crédito efetivamente concedido, na mesma agenda.',
      },
    ],
  },
}
