# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Não lançado]

### Novidades

- **SideNav da Jornada flutua e acompanha o scroll.** A barra dos 4 pilares tem altura fixa (`h-[83dvh]`) mas rolava junto com a página: nos modos altos (Emendas, Formulador, Panorâma) ela saía de vista e trocar de pilar exigia voltar ao topo. Agora é `sticky top-md` — a linha que a contém passou de `stretch` (default do flex, que faria o item crescer até a altura da linha e nunca "descolar") para `items-start`, e o próprio painel ganhou `overflow-y-auto scrollbar-hide` para nunca cortar o conteúdo em viewports baixas. A base agora encosta no fim da seção: o painel vive numa coluna que estica até o fim da linha (`self-stretch`) e é `sticky` dentro dela, então o limite do sticky é o fim da seção — e `max-h-full` impede que os 83dvh ultrapassem a coluna, o que deixava uma folga sob a barra nos pilares mais curtos (Emendas media 976px contra os 913px dela). O fim do scroll também passa a coincidir com a base pinada da barra, em vez de a barra se soltar e subir no último trecho da rolagem — mas sem esticá-la até a viewport inteira, que lê mal: a altura fica em `--nav-h` (83dvh) e a sobra vira `padding-bottom` da seção, derivado da mesma variável (`100dvh - var(--nav-h) - var(--spacing-md)`). Uma fonte só para os dois números, então não há como saírem de sincronia.
- **Análise do Panorâma gerada por IA de verdade (task `economic-analysis`).** O bloco "Análise de desempenho do município" tinha ícone Sparkles, botão "Gerar análise com IA", status "Analisando indicadores…" e typewriter — mas não chamava `/api/ai`: era um `Record<IBGE, string>` com textos escritos à mão. Só **8 dos 223** municípios tinham texto próprio; os outros 215 recebiam um parágrafo genérico idêntico apresentado como leitura daquele município. Pior, os números estavam fixos no código e já contradiziam os cards exibidos alguns pixels acima: o texto de Campina Grande dizia remuneração média de R$ 2.400 (real: R$ 2.770,62) e 12.840 empresas ativas (real: 26.911, menos da metade). Agora o componente chama o LLM com a base econômica **estruturada** (`AiEconomicBaseItem[]`, não um resumo em texto) mais o resumo dos indicadores de agenda com seus status, e o prompt proíbe citar qualquer número fora desse contexto — o mesmo dado que alimenta os cards alimenta a análise, então não há como divergirem. Sem cards a requisição é rejeitada (400) em vez de deixar o modelo preencher o vazio. `EconomicsAnalysis` ganhou estado de `loading` real e de erro (com as mensagens amigáveis do `useAiTask`), separados do `typing`, que antes era a única forma de "carregando". Resposta limitada a 110 palavras: o texto que ela substituiu tinha ~70 e sem teto explícito o modelo passava de 180, estourando o painel.
- **Faixa oficial dos indicadores no contexto da análise.** O resumo enviado ao modelo passa a incluir, para cada indicador de agenda com `threshold` no banco, as três zonas da faixa oficial — derivadas pelo mesmo `thresholdSegmentLabels` que rotula a `IndicatorBar`, sem segunda fonte de verdade. Sem elas o modelo inventava a própria classificação: chamou um IDH-M de 0,588 de "avanço no desenvolvimento humano" quando a faixa oficial põe 0,588 em **Alerta**. O alcance é limitado pelos dados, e o prompt reflete isso: dos 2.676 itens de base econômica exibidos nos 223 municípios, só 223 (o IDH-M) têm indicador de agenda correspondente com faixa — os outros 11 cards não têm faixa oficial em lugar nenhum da plataforma. A regra virou dupla: usar o status oficial onde existe, e descrever sem rotular como alto ou baixo onde não existe.
- **Teto de tokens por task no cliente do OpenRouter.** Pedir "no máximo 110 palavras" no prompt não é confiável — na mesma versão o modelo devolveu 92 palavras para Campina Grande e 201 para Cabaceiras, estourando o painel. `OpenRouterEnv` ganhou `maxTokens` opcional (default 800 inalterado) e a `economic-analysis` impõe 260, com o excedente aparado na última frase completa pelo tratamento de `finish_reason: 'length'` que já existia. O limite deixa de ser pedido e vira garantia.
- **A análise deixa de recitar os cards.** Com os 12 cards reais o modelo gastava metade do texto relistando valores que o usuário já vê logo acima. O prompt passa a limitar a 3 os números citados, escolhidos por sustentarem o argumento.

- **Mapeamento de dados atualizado com as emendas parlamentares (`database/MAPEAMENTO_BASE_DOS_DADOS.md` §17).** As emendas só apareciam no doc como uma linha de "dado extra" via `/transferegov` do mcp-brasil — caminho que nem foi o usado. Nova §17 documenta as duas esferas lado a lado: fontes (**CGU** por documento de despesa e **CODATA/CGE-PB**), formatos, janelas de safra, os **dois eixos de tempo distintos** do `porAno` (documento × safra), totais PB, parcela não municipalizada, geradores e snapshots. Registra o ponto crítico — `atribuicao: 'ibge'` (exato) contra `'texto-beneficiario'` (estimativa), com a regra conservadora de atribuição do estadual e o porquê (sem ela João Pessoa infla 2,5×) —, a validação contra o painel da Datapedia (federal bate ao centavo por ano, 220/223 municípios dentro de 1%; estadual −4,94% no agregado, teto do método), a modelagem na coleção própria `emendas` (fora de `indicatorValues`, sem `threshold`) e o caminho até o frontend (snapshot estático em `/api/emendas`; **rota Fastify ainda não existe**). Etiquetas **CGU** e **CODATA/PB** entram no cabeçalho e na legenda; a linha antiga da §2 e a menção em §3 passam a apontar para a §17.
- **Pilar "Mapeamento de recursos" com um modo só.** O modo Editais saiu do registry (`PANEL_MODES.recursos` em `SectionJornada`), então o `ModeToggle` do pilar deixa de aparecer — mesmo mecanismo que já deixava o Formulador sem toggle. O componente `ModeEditais` continua no repo; para trazer de volta é reinserir a entrada e o import.
- **Layout do painel de Emendas ajustado à altura da SideNav.** A seção media **1.329px** contra os **913px** da SideNav (`h-[83dvh]`) — 416px de excesso. Medido bloco a bloco e corrigido onde pesava: mapa limitado a 520px de largura (a altura acompanha a largura, 415→299px), `gap-lg`→`gap-md` e `p-lg`→`p-md` no painel (os 5 blocos custavam 160px só de respiro), e o resumo do estado passou a dividir uma faixa com o CTA do Datapedia em vez de ocupar duas linhas próprias. O título voltou para a mesma linha do `ModeToggle`: empilhados, o título alinhado à esquerda brigava com o toggle e o mapa centralizados — três alinhamentos diferentes na vertical — e a linha extra custava ~70px. Resultado: **976px**, praticamente a altura da barra lateral. Os cards das duas esferas passaram de `card-surface` para `glass` (a classe não traz `border-radius`, que vem do `rounded-sm`).
- **`ParaibaOutlineMap`: a prop `className` era declarada mas nunca aplicada.** Ficava só na interface — o `<svg>` tinha `w-full h-auto` fixo, então quem passasse `className` não via efeito. Agora é concatenada; é por ela que o consumidor limita a largura (e, com isso, a altura) do mapa.
- **Modo "Mapeamento de recursos" agora é um mapa de emendas com dados reais.** A tela exibia cinco valores estáticos do estado inteiro (já defasados — o total pago tinha saltado de R$ 3,3 para 4,3 bi) e um **PNG** do mapa linkando para o Datapedia. Passa a usar o `ParaibaOutlineMap` de verdade como coroplético do valor pago por município, com `ModeToggle` alternando entre as esferas **federal** e **estadual**, hover mostrando o valor de qualquer município para comparação e painel do município selecionado com empenhado, pago, quebra por ano e contagem de emendas/autores. As duas esferas **não são somadas num número único**: a federal vem de código IBGE estruturado (exata) e a estadual é inferida do texto da emenda (estimativa, com `InfoTooltip` explicando a cobertura) — o card da esfera ativa vem primeiro, mas ambos ficam visíveis. O detalhamento por emenda continua encaminhando para o Datapedia. Novos: contrato `src/types/emendas.ts`, client `fetchEmendas`, hook `useEmendas` (cache no módulo — uma requisição por sessão) e `src/utils/emendas.ts`.
- **`GET /api/emendas` servido pelo snapshot estático (branch snapshot).** Seguindo o padrão de `municipalities.json`: novo `public/api-snapshot/emendas.json` (145 KB, 223 municípios × 2 esferas) gerado por `database/scripts/gerar_api_snapshot_emendas.py` a partir dos snapshots dos dois ETLs, mais o rewrite no `vercel.json` e o bypass equivalente no proxy do `vite.config.ts` — o frontend chama `/api/emendas` normalmente e funciona em dev e no preview sem a rede Sebrae. O shape emitido é o mesmo que a rota Fastify vai devolver quando existir.
- **`ParaibaOutlineMap`: rampa sequencial e detalhe no tooltip.** Nova prop opcional `tooltipDetail` acrescenta uma linha ao tooltip do hover (o valor do município). A coloração por `values` — um ramo que existia mas nunca tinha sido usado — varria o **matiz** de azul a vermelho, o que lê como categorias em vez de intensidade; passa a misturar o acento na superfície (`color-mix`) numa escala de matiz única, com piso de 8% para o município não sumir. **Correção:** o tooltip é `position: fixed` posicionado pelo cursor, mas `backdrop-filter` (a classe `.glass`) cria containing block para `fixed` — dentro de um container glass as coordenadas passavam a valer a partir da caixa do container e o tooltip aparecia deslocado. Agora vai por portal no `body`. O bug não aparecia em `SectionAgendas` porque lá o mapa fica fora do container glass.
- **ETL de emendas parlamentares federais por município (`database/scripts/gerar_seed_emendas_federais.py`).** Primeira fonte de dados do modo "Mapeamento de recursos", que até aqui exibia cinco valores estáticos do estado inteiro e uma imagem PNG do mapa. Lê os arquivos anuais **"Emendas parlamentares por Documentos de Despesa"** do Portal da Transparência (CGU) — ZIPs públicos, **sem chave de API**, baixados do CDN de dados abertos e lidos em streaming de dentro do ZIP (o CSV tem ~320 Mb/ano; nada é extraído em disco). Entrega empenhado/pago por município com quebra anual, para os **223 municípios da PB**. Decisões metodológicas relevantes: (a) usa o conjunto **por documento**, não a lista de emendas — o campo de localidade da emenda vem "MÚLTIPLA"/"Nacional" na maior parte dos casos e perderia a destinação real, enquanto o documento traz o **código IBGE do município de aplicação** já estruturado; (b) separa os dois eixos de tempo — **ano da emenda** define o universo (default ≥ 2023) e **ano do documento** define a quebra anual (`porAno`), de modo que restos a pagar aparecem no ano em que o dinheiro se moveu; (c) as colunas de valor são exclusivas por fase da despesa (Empenho preenche só "Valor Empenhado", Pagamento só "Valor Pago", Liquidação nenhuma), então somar as duas não duplica. Os ~13% do empenhado e ~18% do pago que a origem marca como aplicação estadual/nacional **não** são rateados entre municípios: vão num doc à parte com `escopo: "estado"` e campo `naoMunicipalizado`, para o total do estado fechar sem inflar município nenhum. Modos `--inspect` / `--offline` / `--write-mongo` / `--conferir` no padrão dos demais geradores; snapshot versionado em `database/data/emendas_federais_pb.json`. **Validado contra o painel da Datapedia** (mesma fonte pública de origem, conforme a nota técnica dela): totais de pago por ano batem **ao centavo** (2023, 2024 e 2025) e **220 dos 223 municípios** ficam dentro de 1% — as diferenças restantes são pagamentos novos, já que nosso extrato é posterior à atualização deles.
- **ETL de emendas parlamentares estaduais da ALPB (`database/scripts/gerar_seed_emendas_estaduais.py`).** Segunda esfera do modo "Mapeamento de recursos", a partir da API de dados abertos da **CODATA/CGE-PB** (pública, sem chave) que alimenta o portal da transparência do estado. Junta os dois endpoints pela chave (ano, emenda): `listagem_emendas` dá deputado, objeto e valor destinado; `execucao_emendas` dá empenhado e pago — o join casa 96–99% das emendas. Janela 2021–2025, 2.877 emendas, R$ 508.227.250,29 no total do estado (bate exato com a referência). **A atribuição municipal aqui é inferida, não estruturada:** a origem não tem campo de município (o `beneficiarioFinal` existe no schema mas vem preenchido em só 5,5% dos registros), então o município sai do texto livre do objeto. A regra é deliberadamente conservadora — só conta quando o **beneficiário declarado é o próprio município** ("para o Município de X" / "Prefeitura Municipal de X" / "Fundo Municipal … de X") e rejeita quando há uma entidade nomeada antes no mesmo trecho, caso em que o município é o endereço dela e não o destino. Sem essa distinção João Pessoa aparece com 2,5× o valor real, porque as entidades estaduais são sediadas lá. Emendas para ONGs, APAEs, dioceses, hospitais e órgãos estaduais ficam fora do total municipal e vão para o doc de `escopo: "estado"`, mesma lógica do federal. Resultado medido: **61,9% do valor é municipalizável** (a referência externa municipaliza 65,2%), delta agregado de **−4,94%**, com 55,6% dos municípios dentro de 1% e 79,4% dentro de 15% — o agregado é próximo, o município a município diverge, e esse é o teto do método. Modos `--inspect` / `--offline` / `--write-mongo` / `--conferir` e um `--amostra-nao-atribuidas` para auditar o resíduo.
- **Coleção `emendas` no banco (`database/setup.mongodb.js`).** Quinta coleção, fora de `indicatorValues` de propósito: emenda não é indicador de agenda (não tem `threshold` nem semáforo) e o shape é outro — empenhado/pago com quebra por ano. Chave `<IBGE>:<esfera>` (ou `PB:<esfera>` para o estado), com `esfera` ∈ federal/estadual em documentos separados. O campo **`atribuicao`** registra como o município foi determinado: `ibge` (campo estruturado na origem, exato — caso do federal) ou `texto-beneficiario` (inferido do texto livre do objeto da emenda, aproximado — caso do estadual), para a UI poder rotular o segundo como estimativa em vez de somar os dois num número só.
- **IA em todas as etapas do Formulador.** O "Aprimorar com IA" (`AiField`) chegou às etapas 4 a 10 — antes só 1 a 3. **11 campos novos** com o botão: público-alvo principal e secundário (4), atividades e metodologia (5), fases e marcos (6), continuidade e parcerias (9), gestão, monitoramento e prestação de contas (10) — cada um com instrução própria de prompt e contexto cruzado dos campos vizinhos (ex.: o cronograma recebe as atividades e a duração; o monitoramento recebe os objetivos específicos e os indicadores do projeto). Etapas estruturadas ganharam geração própria: **etapa 7 (Indicadores)** tem "Gerar com IA" por grupo (resultado/impacto/metas) via task nova `generate-indicators` — um indicador por objetivo específico, na mesma ordem, com Desfazer; **etapa 8 (Orçamento)** tem "Sugerir rubricas com IA" via task `suggest-budget-items` — só os nomes das rubricas derivados das atividades, valores em R$ em branco para o gestor (regra do projeto: a IA não inventa números; metas quantitativas usam placeholders "de X para Y" sem linha de base). Ficaram sem IA, de propósito: estimativa de beneficiários (semi-numérico) e os dados factuais da identificação (responsável, órgão, duração). De quebra, o allowlist de campos virou fonte única (`AI_FIELD_IDS` em `src/types/ai.ts`, importado pelo handler; `FIELD_INSTRUCTIONS` é `Record<AiFieldId, …>` — esquecer uma entrada nova vira erro de compilação).
- **Novo primitivo `Modal` (`src/components/ui/Modal.tsx`).** Portal em `<body>`, backdrop `bg-black/60`, fecha por Escape/click-fora/botão X, trava o scroll do body enquanto aberto. Painel reutiliza o `Card` e o header opcional (`title` + `IconButton` X — ícone novo no índice `@/components/icons`). Tailwind puro + tokens, padrões de dismiss herdados do `Tooltip`.
- **Conteúdo "IA" pré-gravado dos indicadores (`src/data/indicators/descriptions/indicator-ai.ts`).** Explicação inicial + 3 perguntas sugeridas com respostas prontas para cada um dos 24 indicadores de agenda do catálogo, chaveados pelo id do catálogo (mesmo padrão de `indicatorInfo`). Textos suportam os tokens `{municipio}`/`{valor}`/`{status}` (helper `fillTemplate`), preenchidos em render com os dados do município selecionado. Respostas qualitativas — sem cortes de classificação inventados (thresholds continuam vindo do banco). Base do modal de indicador com efeito typewriter; futuro: gerar por LLM/migrar pro banco.
- **`IndicatorModal` — modal "IA" do indicador (`src/components/agenda/IndicatorModal.tsx`).** Thread conversacional sobre um indicador: explicação inicial digitada com typewriter ao abrir, pills de perguntas sugeridas cujas respostas pré-gravadas ganham flash "Gerando resposta…" (~400ms) + typewriter (indistinguíveis das geradas), e pergunta livre que chama o LLM de verdade via `useAiTask` (task `indicator-question`, com contexto de indicador/valor/status/município). Só a última entrada digita (remount por `key`, padrão do `EconomicsAnalysis`); erros aparecem com as mensagens amigáveis do hook; auto-scroll no thread; header com valor/status/município (dot de status). Conteúdo por id de catálogo com fallback para `indicatorInfo` (pergunta livre sempre disponível).
- **Nomes de indicadores clicáveis no `AgendaCard` abrem o modal "IA".** `AgendaIndicator` ganhou `onLabelClick?` (label vira `<button>` com hover de acento + sublinhado; sem a prop, `<span>` como antes — outros usos não mudam), `AgendaCard` ganhou `onIndicatorClick?` e a `SectionAgendas` guarda o indicador selecionado e renderiza o `IndicatorModal` (remount por indicador+município via `key`, reiniciando thread/typewriter).
- **`AiField` — campo do Formulador com "Aprimorar com IA" (`src/components/formulator/AiField.tsx`).** Wrapper do `TextInput` (primitivo intocado) com botão ghost + Sparkles que envia o texto atual ao LLM (task `improve-field`) e digita o resultado de volta no próprio campo via typewriter (campo `disabled` durante; `onChange` do pai encaminhado por ref para evitar loop de efeito). "Desfazer" restaura o texto anterior e some ao editar manualmente; erros aparecem inline com as mensagens amigáveis; botão desabilitado com campo vazio.
- **"Aprimorar com IA" nos campos do Formulador.** `AiField` ligado em: Título do Projeto (`StepIdentification`); Problema central, Evidências e Dados, Impacto da Inação e Política pública associada (`StepJustification`); Objetivo Geral (`StepObjectives`). Campos com contexto cruzado: evidências/impacto/política/objetivo levam o problema central junto no prompt, e as evidências recebem também os indicadores em alerta/atenção do município (via `selectTopRisks`) para a IA citar dados reais do diagnóstico.
- **"Gerar objetivos específicos com IA" no `StepObjectives`.** Com o Objetivo Geral preenchido, o botão chama a task `generate-specific-objectives` (parse em `items[]` no servidor) e substitui a lista de objetivos específicos pelo resultado — sem typewriter (arrays de inputs não animam bem), com "Desfazer" restaurando a lista anterior e erro inline amigável.
- **Painel `AIAssistant` montado no Formulador, com ações reais.** O componente (que existia mas nunca foi montado) agora é a terceira coluna do `ModeFormulator` (some na Revisão). Ações migraram de `string[]` para `{ id, label }[]`: v1 com ações reais em Identificação (melhorar título), Justificativa (melhorar problema central, sugerir evidências — rascunho fundamentado nos indicadores em alerta do município) e Objetivos (melhorar objetivo geral, gerar objetivos específicos); as demais 7 etapas são só conteúdo (bloco de ações oculto). Novo hook `useFormulatorAi` mapeia id da ação → task de IA e grava o resultado via `setSlice` (botão "Gerando…" como feedback, ícone Sparkles). Descrições e exemplos do painel reescritos por etapa (antes placeholder único repetido nas 10).
- **Chat global de IA flutuante na Home.** FAB de 56px (`MessageCircle`, ícone novo no índice) fixo na faixa de margem direita das sections — centrado no gutter de 180px (`right: 62px`), sem cobrir conteúdo; visível só com município selecionado. Abre o `ChatPanel` (`src/components/chat/`): painel lateral direito (400px, z-50) com thread multi-turno via task `chat` (histórico das últimas 10 mensagens + resumo compacto de todos os indicadores do município no system prompt), sugestões de pergunta clicáveis com o thread vazio (`src/data/chat/suggestions.ts`, token `{municipio}`), respostas com typewriter, bolhas de usuário à direita, fecha por Escape/X. Estado do thread em memória (some ao fechar — v1).
- **`MarkdownLite` — respostas do LLM renderizadas com formatação (`src/components/ui/MarkdownLite.tsx`).** As superfícies conversacionais (chat e modal do indicador) renderizam o markdown leve que o modelo emite — **negrito**, itálico, `código`, listas numeradas e com hífen — via componente próprio React+Tailwind (sem lib, regra do projeto), tolerante a texto parcial durante o typewriter. O prompt libera markdown leve nessas tasks (`chat`, `indicator-question`) e mantém texto puro nas que preenchem campos de formulário (`improve-field`, `generate-specific-objectives`), onde a formatação apareceria literal no input.
- **Fundação da integração de IA (OpenRouter).** Novo contrato compartilhado `src/types/ai.ts` (união discriminada `AiTaskRequest` com as tasks `indicator-question`, `improve-field`, `generate-specific-objectives` e `chat`) e módulos server em `api/_lib/`: `openrouter.ts` (cliente fetch puro da API OpenAI-compatível do OpenRouter, timeout 30s, modelo default `nvidia/nemotron-3-super-120b-a12b:free` com override por `OPENROUTER_MODEL`), `prompts.ts` (templates pt-BR por task, system prompt ancorado no contexto Sebrae PB) e `handler.ts` (núcleo transport-agnóstico: valida body com type guards, mapeia 429 → `rate_limited`, parseia listas de objetivos em `items[]`). O cliente desliga o modo reasoning (`reasoning.enabled: false` — modelos como o Nemotron 3 vazavam a cadeia de raciocínio no `content` e estouravam o `max_tokens` antes da resposta), remove blocos `<think>` residuais por defesa, usa `max_tokens: 800` e, se a resposta estourar o teto (`finish_reason: length`), corta na última frase completa. `tsconfig.node.json` passa a checar `api/**`; novo `.env.example` documenta `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` (chave só no lado servidor — sem prefixo `VITE_`). O endpoint `POST /api/ai` existe em dois transportes com a mesma fonte: function serverless da Vercel (`api/ai.ts`) e middleware de dev do Vite (plugin inline em `vite.config.ts`, registrado antes do proxy `/api → :3000`). No client, `src/data/ai.ts` (`postAiTask` + `AiRequestError`) e o hook `src/hooks/useAiTask.ts` (estado `idle/loading/done/error`, mensagens de erro amigáveis centralizadas — ex.: 429 do modelo gratuito → aviso de limite diário).

### Alterações
- **Ocultar sessão de emendas** A sessão é um placeholder, vamos ocultar até termos informações para apresentar.

### Correções

- **Painel do `Modal` centralizado na horizontal.** O backdrop do primitivo `Modal` usava só `.flex-center` (que não aplica `justify-content`), então o painel — visível no modal "IA" do indicador — não ficava centralizado na tela. Adicionado `justify-center` no backdrop, valendo para todos os modais.
- **Ícone do FAB do chat centralizado (`ChatButton`).** O ícone `MessageCircle` ficava encostado à esquerda do botão: a classe utilitária `.flex-center` do projeto só aplica `display: flex; align-items: center` (sem `justify-content`), então o botão ganhou `justify-center` explícito para centralizar também na horizontal. Aproveitado o ajuste de cor do ícone: preto no estado normal e branco no hover (antes branco fixo).
- **Dev local funciona sem a API Node / rede Sebrae (branch snapshot).** O `npm run dev` proxyava todo `/api/*` para `localhost:3000` (Fastify + Mongo da rede Sebrae), então os dados de municípios não carregavam localmente — mesmo com o snapshot estático (`public/api-snapshot/`) já no repo. O proxy do Vite agora tem um `bypass` que espelha os rewrites do `vercel.json`: `/api/municipalities` e `/api/municipalities/:id` são servidos direto do snapshot; o restante de `/api/*` (ex.: `/api/ai`, que continua no middleware de dev) segue o fluxo de antes.
- **Hover do mapa não fica mais "preso" quando o mouse sai do SVG.** O `mouseleave` do `<path>` do município nem sempre dispara (movimento rápido do mouse, ou reordenação do DOM causada pelo sort que traz o município em hover para frente), então o último município ficava destacado e com `onHover` ativo mesmo com o cursor em outra parte da plataforma. O `onMouseLeave` do `<svg>` — que já limpava o tooltip (`cursor`) — agora também zera `hoveredId` e propaga `onHover(null)`, garantindo que nenhum hover sobrevive fora do mapa (`ParaibaOutlineMap`).

## [1.1.0] — 2026-07-08

### Novidades

- **`JourneyDivider` entre a `SectionAgendas` e a `SectionJornada`.** Marco de transição do diagnóstico (indicadores + mapa) para a Jornada (os 4 pilares), sinalizando que há mais conteúdo abaixo. Hairline em gradiente (transparente nas pontas → acento no centro) que puxa o olhar para uma pílula `.glass` central com o rótulo "Continue a jornada" e um chevron que "escorre" para baixo (animação `journey-cue`, respeitando `prefers-reduced-motion`). A pílula é um `<button>` que rola suave até a seção `#ambiente` (`scrollIntoView`), com foco de teclado visível. Só aparece quando há município selecionado (renderizado dentro do ramo `data ?` do `Home`, junto da própria `SectionJornada`). Novo `src/components/ui/JourneyDivider.tsx` + keyframe `journey-cue` em `index.css`.

### Melhorias

- **`IndicatorBar` com marcador gradual (posição + cor contínuas).** Antes o cubo tinha só 3 posições fixas (centro de cada zona: 16,6% / 50% / 83,4%) e cor sólida do status. Agora a **posição** reflete o valor real dentro da faixa oficial: escala linear onde os dois cortes (`warning`, `success`) caem em 1/3 e 2/3 da barra, com uma zona-largura de folga em cada extremo (clampado a [0,1]) — vale para `higher-better` e `lower-better`. E a **cor** do cubo é a cor da própria barra naquele ponto: o marcador recebe o mesmo gradiente da barra, dimensionado à largura dela (`--spacing-gutter`) e deslocado via `background-position` para "amostrar" a fatia sob ele — sem cálculo de cor em JS, respeitando os tokens (e dark mode). Anel branco fino (`box-shadow`) mantém o cubo legível quando a cor coincide com a barra. Sem valor numérico/faixa (mas com status), cai no fallback antigo (centro da zona + cor sólida). Novo `src/utils/indicatorBar.ts` (`parseIndicatorValue`, `markerFraction`); `AgendaIndicator` passa `value`/`threshold` para a barra. Afeta os 6 indicadores com faixa oficial (IDH-M, IGM-CFA, IGMA, ISDEL-governança, tempo de abertura/viabilidade).

### Remoções

- **Header removido por completo.** Era disfuncional — logo com `window.location.reload()` no clique, links de nav redundantes com a `SideNav` da Home e avatar de usuário decorativo (sem logout ligado). A única peça funcional era o botão de login, **preservado e movido para o `SectionHero`** (página de login, rota `/`) com label **"Entrar"**, logo abaixo do "Jornada do Município Empreendedor", mantendo a lógica `login()` + `navigate('/home')`. Saíram `src/components/layout/Header.tsx`, `src/components/layout/User.tsx` (só o Header usava) e o hook `src/hooks/useActiveSection.ts` (idem), além do `<Header />`/import no `Layout`, da classe `.header-container` e do token `--header-height` em `index.css`. Navegação entre páginas segue por links in-page (cards de trilhas → `/trilhas`, botão "Ver oportunidades" → `/oportunidades`) e a nav de pilares na Home pela `SideNav`.
- **Footer removido por completo.** Era placeholder do protótipo: marca + três colunas de links todos mortos (`href="#"`) com conteúdo fictício ("Documentação", "Tutoriais", "API", "Suporte", `contato@plataforma.gov.br`). Não servia à acessibilidade (o landmark `<main>` do `Layout` permanece; o `contentinfo` do footer é opcional e, cheio de links mortos, piorava a navegação por teclado/leitor de tela). Saíram `src/components/layout/Footer.tsx`, o `<Footer />` e seu import no `Layout`, e os exports `FooterColumn`/`footerColumns`/`brandText`/`copyright` de `src/data/layout.ts`.
- **Integração com Microsoft Clarity removida por completo.** Saíram o wrapper `src/utils/analytics.ts`, os componentes `AnalyticsTracker` e `ConsentBanner`, a dependência `@microsoft/clarity` (`package.json`/lockfile), o `.env.example` (variável `VITE_CLARITY_ID`) e o header CORS `Access-Control-Allow-Origin: *` em `/assets/*` do `vercel.json` (existia só para o replay do Clarity). Removidas também todas as chamadas de instrumentação (`trackEvent`/`setTag`) dos componentes (`Header`, `Tooltip`/`InfoTooltip`, `PillButton`, `ModeResources`, `SectionErrorBoundary`, `ModeFormulator`, `FormulatorReview`, `MunicipalityProvider`). Docs (`CLAUDE.md`, `README.md`) atualizados. O header CORS servia ao replay do Clarity no deploy estático da Vercel — removido do `vercel.json`. Caso exista um bloco equivalente (`location /assets/` com `Access-Control-Allow-Origin`) no Nginx do servidor Sebrae, pode ser removido manualmente, mas ele não é versionado no repo.

### Correções

- **Tempos da Redesim com amostra insuficiente deixam de exibir valor enganoso.** `tempo-abertura` e `tempo-viabilidade` são médias/percentis por município; em municípios pequenos, com 1–2 aberturas na janela de 12 meses (ex.: Cajazeirinhas, `n=1` → `0,1h`), o valor não é representativo e o semáforo `lower-better` ainda o pintava de **verde ("Bom")** — parecia campeão em agilidade quando teve uma única abertura. A API de leitura (`server/`) passou a **ocultar** esses valores quando o `breakdown.confiabilidade` do banco não é `alta` (`baixa` = n<30, `sem-dados` = n=0): o indicador vira `—` / `status: none` no detalhe (`/api/municipalities/:id`) e some do `/api/map` (não colore o mapa), igual aos `sem-dados`. Só os **27 municípios com n≥30** seguem exibindo o tempo. Regra restrita a esses 2 indicadores (novo `LOW_SAMPLE_HIDDEN` em `server/src/services.ts`, helper `isLowConfidence`) — outros indicadores que também marcam `confiabilidade: 'baixa'` (crescimento-mpe, negócios abertos/extintos, compras públicas) **não** são afetados, pois lá é contagem real de município pequeno, não artefato de média. `IndicatorValueDoc` ganhou o campo `breakdown?` em `server/src/types.ts`. **Correção de produção** (o gate roda contra o Mongo `DadosOPP`); o snapshot estático do preview é ajustado à parte na branch `preview/snapshot`.

## [1.0.1] — 2026-07-07

### Robustez

- **Error boundary por seção (`SectionErrorBoundary`).** Antes, um erro de render em qualquer seção derrubava a app inteira (tela branca — como no crash do Panorâma). Novo boundary isola a falha: exibe um fallback no design system (ícone de alerta + mensagem) e registra o evento `secao_com_erro` no analytics, mantendo o resto da página utilizável. Aplicado às seções da Home (`agendas`, `jornada`) e ao **modo ativo** dentro do `SectionJornada` (`key={modo}` reseta o boundary ao trocar de modo, e o SideNav/ModeToggle seguem vivos quando um modo quebra). Novo ícone `TriangleAlert` no index centralizado.

### Backend (API)

- **Tipos do servidor alinhados ao shape real de `variation`.** `server/src/types.ts` dizia `variation?: string`, mas o banco/ETL grava um objeto estruturado — desalinhamento que deixou o crash do frontend passar batido. Novo tipo `EconomicVariation` + alias `RawVariation` (`EconomicVariation | string | null`) aplicado a `IndicatorValueDoc`, `Indicator` e `EconomicBaseItem`, espelhando o contrato do frontend.
- **Validador Mongo de `indicatorValues.variation` corrigido.** `database/setup.mongodb.js` ainda exigia `bsonType: 'string'` enquanto o ETL grava objeto — inconsistência que rejeitaria inserts se a validação estivesse estrita. Passou a aceitar `object | string | null`, com sub-schema do objeto (`deltaPct`, `previousValue`, `previousYear`, `basis` ∈ edicao-anterior|yoy|yoy-media-anual).

### Correções

- **Crash do modo "Panorâma Sócioeconômico" (React error #31).** A API passou a devolver `variation` da base econômica como **objeto estruturado** (`{ deltaPct, previousValue, previousYear, basis }`) em vez de string formatada, e o `EconomicsCard` renderizava o objeto direto como filho JSX — o que derrubava a árvore inteira (tela branca no modo, tanto no preview quanto em produção). Frontend passou a tipar e tratar o objeto: novo tipo `EconomicVariation`, helpers `toEconomicVariation`/`formatVariationPct` (`src/utils/economics.ts`) e formatação do delta em pt-BR com sinal (ex.: `+12,2%`) + ano de comparação no `title`. Indicadores sem variação (contrato legado `''`) não mostram badge.

### Design / Contrato

- **`tone` removido do contrato da base econômica.** A cor do badge de variação vinha de um `tone` que era dado de demo escrito à mão e arbitrário (deletado na migração pra API; o ETL nunca o recomputou). Como o `MAPEAMENTO_BASE_DOS_DADOS.md` define que os cards da base econômica **não têm semáforo por design** e não existe metadado de direção (maior/menor-é-melhor) para classificar melhora/piora de forma reproduzível, decidiu-se manter a **variação em cor neutra**. Campo `tone` removido de `EconomicBaseItem`/`EconomicBaseValue`/`IndicatorValueDoc` (frontend + server), do build do servidor e do validador Mongo (`indicatorValues`).

## [1.0.0] — 2026-07-06

**Primeiro release de produção da Plataforma OPP.** Ponto de convergência entre a camada de dados/ETL (`database/`) e o redesign (`new-design`), agora servido de ponta a ponta pela API de leitura sobre o MongoDB `DadosOPP`. Frontend e API (`server/`) versionados juntos em **1.0.0** — deploy único (Nginx serve o `dist/` e faz proxy de `/api/*` para o processo Node).

### Dados / Indicadores

- **Pasta `database/`** (ETL lake→OPP, seeds MongoDB, snapshots, `MAPEAMENTO_BASE_DOS_DADOS.md`) trazida da branch `database` — autocontida, sem conflito com o design.
- **IDs de indicadores alinhados ao banco** (`indicators._id`, contrato da futura API): `igm-cfa-2025`→`igm-cfa`, `idh-m-2021`→`idh-m`, `educacao-isdel`→`isdel-educacao-emp`, `ensino-medio`→`trabalhadores-medio-completo`, `ensino-superior`→`trabalhadores-superior-completo`, `idh-m-total`→`idh-m`. Labels/`updatedAt`/`tone` do new-design preservados.
- **Campo `unit`** no catálogo — unidade/escala canônica de cada indicador.
- **Semáforo só nos indicadores com faixa oficial.** `thresholds.ts` reduzido aos **6** indicadores de agenda cuja fonte publica classificação (IGM-CFA, IDH-M, ISDEL-Governança, IGMA, Tempo de abertura, Tempo de viabilidade), com cortes exatos (IGM-CFA 7,51/5,01; tempos ≤72h/≤168h). `StatusType` ganha **`'none'`**: indicadores sem faixa **não renderizam o `IndicatorBar`**. A **cor de agenda foi removida** (`agendaStatus` → `'none'`): o agregado por agenda não tem faixa oficial, então o header fica neutro. Único semáforo visível = os 6 `IndicatorBar` oficiais. Base econômica segue com `tone?` manual.
- **Indicadores não implementados ocultos.** Novo campo `implemented?: boolean` no catálogo — `false` esconde o indicador da plataforma. Marcados `apoiados-sebrae` e `linhas-credito` (sem seed/fonte no banco), que deixam de aparecer nos cards de agenda, no total do `AgendaStats`, no dropdown/coloração do mapa e na seção Riscos. Filtro central no provider (`implemented !== false`) e em `map-data`. Mecanismo à prova da API: quando o banco alimentar o frontend, indicador sem dado simplesmente não é retornado. Os dados demo estáticos permanecem até a integração via API.

### Backend (API)

- **Scaffold da API de leitura** (`server/`) — processo Node/Fastify isolado que lê o MongoDB `DadosOPP` e devolve o mesmo shape (`IndicatorsData`) que o frontend consumia dos TS estáticos. Roda na máquina da app (`10.1.100.99`), lê o banco (`10.1.141.23`), Nginx faz proxy de `/api/*`.
  - Rotas: `GET /api/health`, `/api/municipalities`, `/api/municipalities/:id`, `/api/map`.
  - **DB-driven de ponta a ponta:** agendas/base econômica montadas de `agendas` + `indicators.placements`; status derivado do `threshold` de cada indicador no banco (sem tabela hardcoded — `thresholds.ts` do frontend fica obsoleto). Indicador sem documento no banco não é retornado, tornando o flag `implemented?` desnecessário na integração.
  - `mongodb` 6 (só leitura) + `dotenv`; conexão única com pool; shutdown limpo (SIGTERM). Ver `server/README.md`.
  - Validado ao vivo contra o `DadosOPP` (10.1.141.23): 223 municípios, semáforo calculado no servidor (IGM-CFA 7,06→warning etc.), mapa com 22 opções (os 2 não-implementados não têm doc no banco, então não são retornados).

### Frontend ↔ API

- **Frontend passa a consumir a API** em vez dos TS estáticos. Novo client `src/data/api.ts` (`fetchMunicipalities`, `fetchMunicipalityData`). Proxy `/api → :3000` no Vite dev; Nginx em produção.
- **`MunicipalityProvider` agora é assíncrono:** busca a lista de municípios no boot e os dados do município selecionado sob demanda (`fetch('/api/municipalities/:id')`), com estado `loading`/`error` e guarda contra respostas obsoletas. A lista (223 municípios) e o status vêm do banco.
- **Troca de município sem flash (stale-while-revalidate):** ao trocar de município já com um selecionado, o provider **mantém o município atual renderizado** durante o fetch (não limpa os dados) e faz a troca atômica só quando os dados novos chegam — antes voltava pro mapa expandido no meio do carregamento. Descarte de respostas obsoletas via `requestIdRef` (clicar B→C mostra C mesmo se B resolver depois).
- `CitySelector`, `SectionAgendas` e `StepIdentification` passam a ler a lista de `useMunicipality().municipalities` em vez de `municipalities.json`. `SectionAgendas` mostra "Carregando indicadores…" durante o fetch.
- **Órfãos:** `map-data.ts`, `mapHelpers.ts`, `usePanoramaMedia`, `usePanoramaIndicators` e os `values/*.ts` estáticos deixam de ter consumidor vivo (o mapa interativo saiu no redesign) — removidos em seguida.
- **Labels de indicadores limpos** (sincronizado de `database`): removido o sufixo de escala/metodologia de 6 labels que agora aparecem na UI via API ("— marco 75% (h)", "— pontuação (0–600)", "(var. % a.a.)" etc.) — a escala vive em `unit`, a metodologia na `description`. Requer reaplicar os 6 seeds no banco.
- **Id renomeado `mpe-eli-sebrae` → `crescimento-mpe`** (sincronizado de `database`): o id agora reflete o dado real (proxy de crescimento de MPE formalizadas; o recorte "nos ELI" é interno do Sebrae). Atualizado no `catalog.ts` (id + label "no município") e nas `descriptions/{indicators,risks}.ts`. Requer rodar `scripts/migrar_id_crescimento_mpe.mongodb.js` no banco.

### UI — IndicatorBar (semáforo)

- **Barra oculta sem perder espaço** (status `'none'`): indicadores sem faixa oficial não colapsavam mais o `AgendaIndicator`. A barra fica `invisible` mantendo largura (gutter) + altura, então o valor segue centralizado e o layout equilibrado. Componente convergido com a branch `new-design` (idêntico).
- **Valores de threshold nos rótulos da barra** (no lugar de MIN/MED/MAX): as 3 zonas da barra passam a mostrar os cortes reais da faixa oficial (ex.: IGM-CFA `< 5,01 · 5,01–7,51 · ≥ 7,51`; tempos `> 168 · 72–168 · ≤ 72`). A API devolve `threshold` por indicador (`server`), e o frontend deriva os rótulos em `utils/segmentLabels.ts` (`AgendaIndicator`/`AgendaCard`/`AgendaIndicatorItem`). Só os 6 indicadores com faixa oficial têm rótulos. **Reiniciar a API** para o `threshold` entrar na resposta.

## [0.8.0] — 2026-04-23

Refactor massivo de **padronização de nomenclatura para inglês** em todo o codebase. Identificadores de código (tipos, interfaces, propriedades, nomes de arquivo, variáveis internas) passam a usar inglês consistente. Texto exibido ao usuário (labels, títulos, descrições, botões) permanece em português. URLs de rota e nomes de eventos analytics também permanecem em português.

### Breaking Changes

**Tipos (`src/types/`)**
| Antes | Depois |
|---|---|
| `src/types/indicadores.ts` | `src/types/indicators.ts` |
| `src/types/formulador.ts` | `src/types/formulator.ts` |
| `IndicadoresData` | `IndicatorsData` |
| `BaseEconomicaItem` | `EconomicBaseItem` |
| `Indicador` | `Indicator` |
| `Agenda.nome` / `.indicadores` | `Agenda.name` / `.indicators` |
| `FormuladorState` / `EMPTY_FORMULADOR_STATE` | `FormulatorState` / `EMPTY_FORMULATOR_STATE` |
| Todas as props de etapa (ex: `titulo`, `atividades`, `rubricas[].valor`) | `title`, `activities`, `items[].value`, etc. |

**Dados (`src/data/`)**
| Antes | Depois |
|---|---|
| `src/data/indicadores/` | `src/data/indicators/` |
| `indicators/catalogo.ts` → export `catalogo` | `indicators/catalog.ts` → export `catalog` |
| `indicators/mapa.ts` → `IndicadorKey` | `indicators/map-data.ts` → `IndicatorKey` |
| `indicators/municipios.json` | `indicators/municipalities.json` |
| `indicators/valores/` | `indicators/values/` |
| `indicators/descricoes/` | `indicators/descriptions/` |
| `src/data/formulador/etapas.ts` → `findEtapaBySlug`, `findEtapaIndex`, step shape `.titulo`/`.nome` | `src/data/formulator/steps.ts` → `findStepBySlug`, `findStepIndex`, step shape `.title`/`.name` |
| `src/data/home/capacitacao.ts` | `src/data/home/training.ts` |
| `src/data/home/casos-sucesso.ts` | `src/data/home/case-studies.ts` |
| `src/data/home/recursos.ts` | `src/data/home/resources.ts` |
| `src/data/home/formulador.ts` | `src/data/home/formulator.ts` |

**Hooks (`src/hooks/`)**
| Antes | Depois |
|---|---|
| `useMunicipio` / `MunicipioProvider` | `useMunicipality` / `MunicipalityProvider` |
| `MunicipioState.nome` / `.dados` | `MunicipalityState.name` / `.data` |
| `setMunicipio(id, nome, origem)` | `setMunicipality(id, name, source)` |
| `useFormulador` / `FormuladorProvider` | `useFormulator` / `FormulatorProvider` |
| `usePanoramaIndicadores` | `usePanoramaIndicators` |

**Utils (`src/utils/`)**
| Antes | Depois |
|---|---|
| `formuladorCompleteness.ts` | `formulatorCompleteness.ts` |

**Componentes**
| Antes | Depois |
|---|---|
| `economics/EconomicsCard` — prop `analise` | `economic-base/EconomicBaseCard` — prop `analysis` |
| `economics/EconomicsAnalysis` | `economic-base/EconomicBaseAnalysis` |
| `courses/CoursesCard` — props `titulo`/`carga`/`descricao` | `training/TrainingCard` — props `title`/`duration`/`description` |
| `courses/CoursesCardRow` | `training/TrainingCardRow` |
| `formulador/FormuladorCard` | `formulator/FormulatorCard` |
| `formulador/FormuladorProgress` | `formulator/FormulatorProgress` |
| `RisksCard` props `valor`/`tipo`/`descricao`/`indicadorLabel`/`contexto` | props `value`/`type`/`description`/`indicatorLabel`/`context` |
| `ValueBadges` prop `indicador` | prop `indicator` |
| `PanoramaMediaInfo` props `municipioNome`/`municipioFormatted`/`maiorFormatted`/`maiorMunicipioNome` | props `municipalityName`/`municipalityFormatted`/`highestFormatted`/`highestMunicipalityName` |
| `CaseStudiesCard` prop `caso` (shape `.titulo`/`.imagem`/`.cidade`/`.descricao`) | prop `caseStudy` (shape `.title`/`.image`/`.city`/`.description`) |

**localStorage**
| Antes | Depois |
|---|---|
| Chave `formulador:${id}` | Chave `formulator:${id}` |

> Rascunhos salvos na versão anterior são incompatíveis e serão ignorados (o formulador inicia vazio).

---

### Changed

- **Componentes, seções e páginas — renomeação para inglês.**
  - Diretórios: `economics/` → `economic-base/`, `courses/` → `training/`, `formulador/` → `formulator/`
  - Seções: `SectionRiscos` → `SectionRisks`, `SectionBaseEconomica` → `SectionEconomicBase`, `SectionCapacitacao` → `SectionTraining`, `SectionCasosSucesso` → `SectionCaseStudies`, `SectionRecursos` → `SectionResources`, `SectionFormulador` → `SectionFormulator`
  - Páginas: `Formulador` → `Formulator`, `FormuladorStep` → `FormulatorStep`, `FormuladorConclusao` → `FormulatorConclusion`, `Trilhas` → `Trails`, `Oportunidades` → `Opportunities`, `Comunidade` → `Community`
  - Steps do formulador: `StepOrcamento` → `StepBudget`, `StepPlanoAcao` → `StepActionPlan`, `StepGovernanca` → `StepGovernance`, `StepJustificativa` → `StepJustification`, `StepObjetivos` → `StepObjectives`, `StepSustentabilidade` → `StepSustainability`, `StepPublicoAlvo` → `StepTargetAudience`, `StepCronograma` → `StepTimeline`
  - Props e state: `valor→value`, `nome→name`, `indicadores→indicators`, `rubricas→items`, `atividades→activities`, `metodologia→methodology`, etc.
  - `App.tsx` e `Home.tsx` atualizados com novos imports; testes e mocks atualizados.

- **ESLint — regra `quotes: single`** adicionada para forçar aspas simples em todo o código (`avoidEscape: true` para evitar conflitos em strings com apóstrofos).

## [0.7.3] — 2026-04-22

Versão de **consolidação da camada de dados** (`src/data/`) e **nova affordance de informação nos cards**. O protótipo ganha um padrão reutilizável de "ícone Info + tooltip" (primitivo `InfoTooltip`), usado nos cards de Agenda e Base Econômica; toda a pasta `src/data/` é reorganizada em domínios (`indicadores/`, `home/`, `formulador/`, `geo/`); e os arquivos de descrição passam a ser indexados por `id` do catálogo — o que, de quebra, corrige um bug silencioso em `riscos.ts` em que vários contextos caíam no fallback por labels desatualizados.

### Added

- **`ui/InfoTooltip`** — primitivo para o padrão "ícone `Info` que abre tooltip com título + descrição", antes inline no `AgendaCard`. Composto por `IconButton` (variant `ghost`) + `Tooltip` + `TitleSubtitle` (size `sm`). API: `title` + `subtitle` + `label` (aria-label obrigatório) + `trackingKey` opcional. Refatorado o uso existente em `AgendaCard`.
- **`EconomicsCard` — `InfoTooltip` por indicador.** Cada card da Base Econômica passa a exibir um ícone `Info` no topo à direita, abrindo tooltip com a definição do indicador. Conteúdo em `src/data/indicadores/descricoes/base-economica.ts` (12 indicadores cadastrados); card só renderiza o ícone quando há conteúdo registrado.
- **`ui/Tooltip` — prop `portal`.** Renderiza o panel via portal no `<body>` com `position: fixed`, usando o `getBoundingClientRect` do trigger para posicionar. Resolve o caso em que o painel ficava atrás do card vizinho no grid por conta do stacking context criado pelo `transform` do `card-hoverable` (o `z-50` só ordena irmãos dentro do mesmo stacking context). `InfoTooltip` passa `portal` por padrão — é usado dentro de cards em grid.
- **`src/data/indicadores/status-labels.ts`** — `statusLabels` (Bom/Atenção/Alerta) + `statusLabelsPanorama` (mesma base, mas com "Crítico" em vez de "Alerta" — vocabulário específico da legenda do mapa). Vive junto do tipo `StatusType` em vez de um `labels.ts` genérico.

### Changed

- **`src/data/` — reorganização por domínio.** Arquivos antes flat viraram pastas semânticas:
  - `indicadores/` (catalogo, thresholds, mapa, municipios.json, valores/*, descricoes/*, status-labels) — tudo que descreve/classifica/valora indicadores
  - `home/` (sections, capacitacao, casos-sucesso, economics, recursos, formulador, ai-assistant) — conteúdo das seções da home
  - `formulador/` (etapas, ai-assistant) — rota `/formulador`
  - `geo/paraiba.json` (antes `paraiba-municipios.json` na raiz)
  - `layout.ts` permanece na raiz (globais)
  - Renomeações: `agenda-objetivos` → `indicadores/descricoes/agendas`; `base-economica-contexto` → `indicadores/descricoes/base-economica`; `indicador-info` → `indicadores/descricoes/indicadores`; `riscos-contexto` → `indicadores/descricoes/riscos`; `mapa-indicadores` → `indicadores/mapa`; `formulador-etapas` → `formulador/etapas`; `formulador-ai` → `formulador/ai-assistant`; `municipios/*` → `indicadores/valores/*`.
  - Todos os imports atualizados em ~40 arquivos (páginas, seções, hooks, utils, tests). `git mv` preservou histórico.
- **`descricoes/*.ts` — chaves passam a usar `id` do catálogo.** Antes, `agendas.ts` indexava por `agenda.nome`, `base-economica.ts` por `item.label` e `riscos.ts` por `indicador.label` — renomear qualquer texto no catálogo quebrava tooltips silenciosamente. Agora todos os arquivos de `descricoes/` usam o `id` estável (paralelo a `indicadores.ts` que já seguia esse padrão).
  - `types/indicadores.ts`: `Agenda` e `BaseEconomicaItem` ganham `id` obrigatório.
  - `MunicipioProvider`: propaga `id` do catálogo nos objetos mesclados.
  - Consumidores (`AgendaCard`, `EconomicsCard`, `SectionAgendas`, `SectionBaseEconomica`, `SectionRiscos`, mocks de teste) passam a receber/usar `id` no lookup.
- **Desmontagem de `labels.ts`.** O arquivo misturava 5 categorias distintas (enum de status, CTAs 1:1, conteúdo de seção do Panorama, frase da seção Agendas, placeholder de usuário) sem coerência. Conteúdo dispersado para onde pertence:
  - `panoramaLabels` → `home/sections.ts` (`sectionContent.panorama.labels`)
  - `agendaStatsLabel` → `home/sections.ts` (`sectionContent.agendas.statsLabel`)
  - `statusLabels` + `statusLabelsMap` → `indicadores/status-labels.ts`, renomeados `statusLabels` / `statusLabelsPanorama`
  - `ctaLabels` → inline nos 3 componentes consumidores (1 uso cada — indireção sem ganho)
  - `defaultUserName` → inline em `User.tsx` como default prop
- **Catálogo — labels corrigidos.** Textos de indicadores da Base Econômica revisados no `catalogo.ts`, incluindo a ortografia de "Desenvolvimento Sustentável" no label do IDSC.
- **`EconomicsCard` — refinamentos de layout.** Label sem `uppercase` (era incoerente com o Figma), espaçamento interno ajustado, e `max-width` removido do valor (permitia quebra desnecessária em valores mais longos).

### Fixed

- **`riscos.ts` — contextos dessincronizados do catálogo.** Várias chaves estavam com labels desatualizados (ex: `'IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025'` vs catálogo `'IGM – Índice CFA de Governança Municipal'`), caindo silenciosamente no `defaultRiscoContexto`. Migração das chaves para `id` resolve o problema e previne regressão futura.
- **Tooltip atrás de card vizinho.** Tooltips dentro de cards em grid (ex: AgendaCard, EconomicsCard) podiam ficar parcialmente ocultos pelo card ao lado por causa do stacking context criado pelo `transform` do `card-hoverable`. Resolvido via nova prop `portal` no `Tooltip`, que move o painel para `<body>`.
- **`ConsentBanner`** — substituído `useEffect` + `setVisible` por inicializador lazy no `useState`, eliminando o erro `react-hooks/set-state-in-effect`.
- **`FormulatorStep`** — `stepStartRef` inicializado com `0` em vez de `Date.now()` diretamente na chamada do `useRef`; valor real atribuído dentro do `useEffect`, eliminando o erro `react-hooks/purity`.

### Removed

- **`src/data/labels.ts`** — arquivo desmontado (ver "Changed" acima).
- **Arquivos de indicadores não utilizados** — limpeza inicial em `src/data/indicadores/` (legado dos JSONs por município que foram substituídos pela camada `catalogo + valores + thresholds`).

## [0.7.2] — 2026-04-21

Versão de instrumentação para **teste com usuários** — integração do Microsoft Clarity (heatmaps + gravações de sessão) com camada de consentimento LGPD e 13 eventos customizados cobrindo os dois fluxos-alvo do teste moderado (navegação geral + Formulador end-to-end).

### Added

- **Microsoft Clarity — integração para testes com usuários.** Nova camada de analytics para coletar heatmaps, gravações de sessão e eventos customizados durante o teste com 10 participantes em 7 máquinas controladas. Stack mínima, client-side, sem impacto no servidor de produção.
  - **`src/utils/analytics.ts`** — wrapper centralizado (`initAnalytics`, `grantConsent`/`denyConsent`, `trackEvent`, `setTag`, `identifySession`). Só efetiva em build de produção (`import.meta.env.PROD`) com `VITE_CLARITY_ID` preenchido; no-op silencioso em dev/preview e antes do consentimento.
  - **`components/ui/ConsentBanner`** — banner LGPD com "Aceitar" / "Recusar", persiste em `localStorage` e só aparece na primeira visita.
  - **`components/AnalyticsTracker`** — bootstrap: inicializa Clarity se já houver consentimento, identifica a sessão via `?participante=XX` (útil pra etiquetar as máquinas do teste moderado) e dispara `pagina_visitada` a cada mudança de rota.
  - **`.env.example`** + `.env` no `.gitignore` documentando `VITE_CLARITY_ID`.
  - **13 eventos customizados** instrumentados cobrindo os dois fluxos-alvo do teste (navegação geral + Formulador end-to-end):
    - **Navegação:** `pagina_visitada` (rota), `hero_bloco_clicado` (bloco), `nav_header_clicado` (secao)
    - **Município:** `municipio_alterado` (de, para, origem: `seletor` | `mapa`) + `setTag('municipio')` para filtrar gravações por cidade no dashboard
    - **Mapa:** `mapa_ativado`, `indicador_mapa_alterado` (indicador)
    - **Formulador:** `formulador_iniciado`, `formulador_step_visitado` (step, numero), `formulador_step_concluido` (step, numero, tempo_ms), `formulador_abandonado` (ultimo_step, via: `nav` | `logo` | `unload`), `formulador_concluido` (steps_completos, total_steps)
    - **Descoberta:** `tooltip_aberto` (chave) — dispara uma vez por instância para não poluir em hover; `cta_externo_clicado` (destino, label) — no `PillButton` com `href` externo e no link-imagem do Datapedia em `SectionRecursos`

### Fixed

- **Vercel — CORS em `/assets/*` para o replay do Clarity.** O replay do Microsoft Clarity busca o CSS/JS do site a partir de um iframe em `clarity.microsoft.com`. Sem `Access-Control-Allow-Origin` nos assets servidos pela Vercel, o browser bloqueava o fetch e as gravações renderizavam HTML puro (sem estilos, fontes serif, layout achatado). Adicionado `Access-Control-Allow-Origin: *` para `/assets/(.*)` em `vercel.json` — seguro porque são arquivos públicos já servidos para qualquer visitante do site.

## [0.7.1] — 2026-04-21

Versão de refinamento de **interações e hover** — tokens semânticos de hover, o novo primitivo `HoverOverlay`, mudança do padrão `opacity-90` para `background-color` por variante em todos os botões, e nav pill no Header. Além disso, o carrossel ganha setas laterais no gutter da seção, os Casos de Sucesso passam a usar conteúdo real do Geocracia, e o scroll restoration é normalizado entre browsers.

### Added

- **`ui/HoverOverlay`** — primitivo para o padrão "escurece pai no hover + revela pill com hint" (antes duplicado em `ParaibaMap.tsx` e `SectionRecursos.tsx`). API mínima: `label` + `radius` (`sm|md|lg|xl`, default `md`). Requer que o elemento pai tenha `relative group`; a pill é um `<span>` decorativo, então o clique fica no pai (`<a>`, `<button>` ou `<div onClick>`) sem conflito de hit-target. Refatorados ambos os usages: `ParaibaMap` passa `radius="sm"`, `SectionRecursos` passa `radius="xl"`.
- **Design System — tokens semânticos de hover.** Adicionados `--semantic-button-{primary|secondary|tertiary|success}-hover` e `--semantic-surface-hover` em `index.css` (light + dark mode). `buttonHoverStyles` em `button-styles.ts` e o nav pill do `Header` agora consomem esses tokens em vez de apontar direto para primitives — dark mode passa a ser controlado por override de token (1 lugar), e o hover tem fonte única de verdade entre botões e superfícies hoverable.
- **`ScrollToTop`** — criado `src/components/ScrollToTop.tsx` (`window.scrollTo(0, 0)` a cada mudança de `pathname`, ignorando quando há `hash`) e montado dentro do `<BrowserRouter>` em `App.tsx`. Normaliza o comportamento entre browsers/máquinas — antes, as rotas `/oportunidades`, `/comunidade` e `/formulador` abriam com o scroll preservado em alguns ambientes (default `history.scrollRestoration: 'auto'` varia entre Chrome/Safari/Firefox e entre máquinas rápidas/lentas). Removido o `window.scrollTo({ top: 0 })` redundante de `Trilhas.tsx`.

### Changed

**Hover e botões**

- **Buttons — hover escurece o bg sem afetar filhos.** Substituído `hover:opacity-90` em `Button`, `IconButton` e `PillButton` por mudança de `background-color` por variante (`buttonHoverStyles` em `button-styles.ts`): primary → blue-800, secondary → blue-200, tertiary → lime-200, ghost → surface-secondary, success → green-800. No `PillButton`, mantém o círculo interno visualmente intacto (antes, a opacidade herdada descolorava o círculo).
- **Header — hover dos nav links vira pill.** Substituído `hover:text-accent` (que só mudava a cor da fonte) por `hover:bg-[var(--semantic-surface-hover)]`: como cada link já tem `px-sm py-xs rounded-full`, o hover agora aparece como pill azul-claro — consistente com o estado ativo.
- **`--semantic-surface-hover`** ajustado para um tom mais claro (melhor contraste com o texto em superfícies `bg-surface-secondary` e no nav pill).

**Carousel**

- **Setas laterais sobrepostas.** Os botões de navegação saíram da linha abaixo do scroll e passaram a ser `IconButton` absolutamente posicionados nas laterais do carrossel (`left/right: calc(-1 * var(--spacing-xl))`), dentro do gutter da `SectionContainer` (180px de `--spacing-margin`). Variante alterada para `primary` para contraste com as imagens dos cards. Permite aumentar o respiro vertical sem empurrar os botões para longe.
- **`card-hoverable` removido dos cards dentro de carrossel** (`CaseStudiesCard`, `CoursesCard`) — o hover-lift com sombra conflitava com `snap-mandatory` e os novos overlays.

**Casos de Sucesso**

- **Conteúdo real do Geocracia.** Os 5 cards fictícios (Belo Horizonte, Maringá, Sobral, Joinville, Vitória da Conquista) foram substituídos por 4 casos reais publicados em geocracia.com: Projeto Ponte Digital (PA), TerraInk (BRASIL), Atlas do Hidrogênio Verde (RN) e Crédito Rural Geoespacial (BRASIL). Nova prop `url` em `CasoSucesso` — o CTA "Ver estudo de caso" agora encaminha para o artigo original (abre em nova aba automaticamente via `PillButton`). Imagens og:image baixadas em `public/images/cases/`.
- **`CaseStudiesCard`** — ajuste fino de largura e tamanho do título para melhor equilíbrio visual na nova grade de 4 casos.

**Outros ajustes**

- **`StepIdentificacao`** — `Dropdown` migrado de `variant="tertiary"` (lime) para `variant="secondary"` (azul claro), alinhando com o visual dos campos do formulador. `buttonHoverStyles.secondary` ajustado em conjunto.
- **`SectionRecursos`** — raio dos CTAs padronizado para coincidir com os demais botões da home.
- **`--primitives-white`** — substituído uso de `theme('colors.white')` por literal `#ffffff` em `index.css` (mais previsível; o helper `theme()` pode resolver para variações conforme configs do Tailwind).
- **`EconomicsAnalysis`** — título do estado vazio passa de "Análise inteligente da base econômica" para "Análise de desempenho do município" (mais direto e alinhado ao contexto do município selecionado).

**Documentação**

- **`README.md`** — funcionalidades expandidas para cobrir Hero com 4 pilares, Base Econômica com 12 indicadores + análise simulada por IA, página `/formulador` em 10 etapas, páginas `/trilhas` / `/oportunidades` / `/comunidade`, e tabela de municípios expandida de 3 para 8 (João Pessoa, Campina Grande, Queimadas, Conde, Caaporã, Pitimbu, Monteiro, Cabaceiras). Árvore de `src/` atualizada com as novas pastas (`trilhas/`, `icons/`, `components/formulador/steps/`) e páginas.
- **`CLAUDE.md`** — status atualizado para 8 municípios + páginas adicionais; tabela de dados substitui `indicadores/*.json` por `municipios/*.ts` + `catalogo.ts` + `thresholds.ts` (arquitetura da 0.6.2); Base Econômica passa a ser descrita como 12 cards em `grid-4`. Seção **"CSS — Design System Classes"** reescrita: a partir da 0.7.0, tokens de spacing/borderRadius/backgroundColor/textColor/fontWeight são integrados ao `tailwind.config.js`, então `gap-md`, `p-sm`, `rounded-sm`, `bg-surface`, `text-inactive` etc. são classes **nativas** do Tailwind (não estão mais em `@layer components`). Exemplos de código atualizados (`rounded-md p-md bg-surface` em vez de `rounded-[var(--radius-md)]`). `HoverOverlay` adicionado à tabela de componentes Tailwind puros.

### Fixed

- **Carousel — crop do hover à esquerda/direita e abaixo.** Adicionado `scroll-padding-inline: var(--spacing-xs)` no scroll container do `Carousel` (sem isso, `snap-mandatory` alinhava a borda do card com x=0, clipando o anel de 1px do hover). Aumentado o respiro vertical de `py-xs -my-xs` (4px) para `py-md -my-md` (24px), suficiente para acomodar a sombra inferior do `.card-hoverable:hover` (`box-shadow 0 10px 15px -3px` estende ~23px abaixo do card).

## [0.7.0] — 2026-04-21

Versão de consolidação do design system — tokens do `index.css` integrados ao Tailwind config (eliminando ~80 classes custom duplicadas) e paleta de cores primitivas ancorada na escala Tailwind oficial (slate/blue/green/yellow/red/lime) — e de refino da **Base Econômica**: catálogo de 12 indicadores alinhado ao CSV de referência, análise simulada por IA com efeito typewriter por município, e ajustes de layout. Também inclui o novo campo "Política pública associada" em `StepJustificativa` e pequenos refinos de texto em `SectionHero` e página `/trilhas`.

### Added

**Base Econômica**

- **`EconomicsAnalysis` — geração simulada por IA.** O card da seção Base Econômica agora inicia vazio, com título, subtítulo e CTA "Gerar análise com IA". Ao clicar, o texto é revelado com efeito de máquina-de-escrever (cursor piscando) até completar. No estado final aparece um botão "Gerar novamente" que reinicia a animação. Cada município tem uma análise própria (fallback para texto genérico). A troca de município reseta o card para o estado inicial via `key={municipio.id}`.
- **`src/hooks/useTypewriter.ts`** — hook reutilizável para efeito de digitação caractere-a-caractere. API: `useTypewriter({ text, enabled, speed?, onDone? })` → `{ displayed }`. Reset ocorre via remount (nova `key` no consumidor).
- **`src/data/economics.ts`** — `analisePorMunicipio` (8 análises, uma por código IBGE) + `getAnaliseForMunicipio(id)` com fallback para `defaultAnalise`. Novos labels: `emptyAnaliseTitle`, `emptyAnaliseSubtitle`, `gerarAnaliseLabel`, `regenerarAnaliseLabel`, `gerandoAnaliseLabel`.
- **`.typewriter-caret`** — classe CSS em `index.css` com animação `typewriter-caret-blink` (step-end, 0.9s).
- **`Sparkles`** — ícone adicionado ao re-export central de `@/components/icons`.

**Design system**

- **`src/components/ui/buttons/button-styles.ts`** — constantes `buttonVariantStyles` e `buttonBaseClass` compartilhadas entre Button e IconButton.
- **`IconButton` modo decorativo** — nova prop `decorative` renderiza `<span aria-hidden>` ao invés de `<button>`, unificando o padrão "ícone em círculo" num único componente. Nova escala: `xs` (24×24), `sm` (32×32), `md` (40×40), `lg` (48×48). `SectionHero` e `EconomicsCard` migrados para usar `IconButton decorative`.
- **Primitivas `lime`** adicionadas em `src/index.css` (`--primitives-lime-{100|200|300|800|900}`) e tokens semânticos `--semantic-secondary` (gray-200) e `--semantic-tertiary` (lime-300) — habilitam o novo visual de `button-tertiary`.
- **`.grid-4`** em `index.css` — completa a família `.grid-2` / `.grid-3` / `.grid-5` com 4 colunas e gap `--spacing-xs`.

**Formulador**

- **`StepJustificativa` — campo "Política pública associada".** Nova entrada `politica` em `JustificativaData` (e `EMPTY_FORMULADOR_STATE`) com textarea de 4 linhas e hint "Qual política pública nova ou existente esse projeto está associado?".

### Changed

**Tailwind config + index.css**

- **`tailwind.config.js`** — `theme.extend` populado com spacing, borderRadius, backgroundColor, textColor e fontWeight mapeados para as CSS variables do design system. Classes como `gap-md`, `p-sm`, `rounded-sm`, `bg-surface`, `text-inactive` agora são nativas do Tailwind. `rounded-full` preserva o default do Tailwind (`9999px`) para garantir círculos perfeitos em qualquer tamanho.
- **`src/index.css`** — removidas ~80 classes utilitárias custom do `@layer components` (gap, padding, radius, background, text-color) que duplicavam o que o Tailwind agora gera nativamente. Mantidas apenas classes compostas (`.typo-*`, `.card-*`, `.flex-*`, `.grid-*`, `.status-*`, `.divider`, `.scrollbar-hide`, `.section-container`).
- **Codebase (~30 .tsx)** — renomeado `radius-*` → `rounded-*` em todas as className strings para usar a convenção do Tailwind.
- **Cores primitivas ancoradas no Tailwind.** Valores hex hardcoded substituídos por `theme('colors.<palette>.<shade>')` — `gray-*` passa a usar `slate.*`; `blue-500` passa a referenciar `blue.600`; `white`/`black` viram `slate.50`/`slate.900`. Tokens semânticos ajustados: `--semantic-main` agora é azul (antes preto), `--semantic-surface-secondary` vira azul claro (blue-100), `--semantic-button-secondary` vira blue-100 e `--semantic-button-tertiary` vira lime-300 (antes gray-200). Resultado: paleta controlada pelo Tailwind, com botões tertiary em lime e secondary em azul claro.
- **Status com contraste maior.** `--primitives-{green|yellow|red}-500` → `-700` para as cores de status (`--semantic-success`, `--semantic-warning`, `--semantic-alert`), melhorando a legibilidade do texto sobre os surfaces claros.
- **Escala de display rescalada** (`src/index.css`): `--font-size-display-large` 96→64px, `--font-size-display` 56→32px. Os valores anteriores estavam grandes demais para os números exibidos em `AgendaStats` e `RisksCard`.
- **`AgendaStats`** — total agora usa `typo-display-lg` (antes `typo-display`) e `gap-md` interno (antes `gap-sm`), ganhando peso visual adequado após o rescale da escala display.
- **`RisksCard`** — valor passa de `typo-display-sm` para `typo-display`, harmonizando com a nova escala.

**Componentes UI**

- **`Card.tsx`** — API de padding simplificada: removido o split `{ x, y }`, agora aceita apenas `'none' | 'sm' | 'md' | 'lg' | 'xl'`. Componente reduzido de 107 para 68 linhas. `AgendaCard`, `AgendaStats` e `EconomicsAnalysis` migrados para padding uniforme + override via `className`. Resolução de padding/radius simplificada aproveitando a integração de tokens no Tailwind.
- **`Button.tsx`** e **`IconButton.tsx`** — `variantStyles` e classe base extraídos para `button-styles.ts` compartilhado, eliminando duplicação.
- **`PillButton.tsx`** — shell agora usa `buttonVariantStyles` (tokens semânticos de botão) em vez de `bg-accent`/`bg-surface-secondary`. Circle inverte as cores do botão (label→bg, bg→icon). Depois restaurado o split `typoPrimary`/`typoSecondary` (as classes `.typo-button-*` trazem cor embutida que sobrescreve a variant com mesma especificidade, causando texto branco em shell claro).
- **`EconomicsAnalysis`** — `Card` passa a usar `surface="secondary"` para destacar visualmente o bloco de análise (antes aparecia como mais um card branco indistinguível dos EconomicsCard).
- **`SectionBaseEconomica`** — grid passa de `.grid-5` para `.grid-4` para acomodar os 12 indicadores novos em linhas de 4 cards.
- **`UserAvatar`** — `--radius-xl` restaurado para alinhar com o design original (após ajustes no Tailwind config).

**Dados**

- **Base Econômica — 12 indicadores do CSV de referência.** `catalogo.baseEconomica` substituído pela lista do `indicadores_base_economica.csv`: IDSC, IDH-M, Cobertura Atenção Básica, IDEB Anos Iniciais/Finais, GINI, Remuneração média, Empresas Ativas, PIB per capita, MEIs, MEs, EPPs. Todos os 8 municípios atualizados — valores do CSV onde disponíveis, preenchimentos fictícios com sufixo `*` nos demais (mesma convenção das agendas).
- **Variações percentuais fictícias.** Valores placeholder de `variacao` (labels como `'2021'` ou `'*'`) substituídos por deltas plausíveis (`+X,X%*`) para que cada `EconomicsCard` exiba um indicador de crescimento.

**Texto / refinos visuais**

- **`SectionHero`** — gap interno do `SectionContainer` ajustado de `gap-lg` para `gap-2xl` (mais respiro entre os blocos); subtítulo "Inteligência Territorial" → "Inteligencia em políticas públicas" (reflete melhor o foco da plataforma).
- **`/trilhas`** — título da página: "Capacitações para estruturar projetos e acessar recursos" → "Capacitação para gestores públicos municipais" (foco no público-alvo).

### Tests

- **Snapshots atualizados** — `EconomicsCard` (variação de `text-right`), `AgendaStats` (`typo-display-lg` + `gap-md`) e `RisksCard` (`typo-display`).

## [0.6.5] — 2026-04-20

Versão focada em **navegação e placeholders**: o hero passa a ser o mapa mental da plataforma (4 pilares em grid 2×2), o Header espelha essa estrutura, e as duas últimas CTAs órfãs (`Ver oportunidades` e `Entrar na comunidade`) agora apontam para páginas placeholder dedicadas. Inclui também limpeza tipográfica no `SectionHeader` e no sistema de `line-height`.

### Added

- **`src/pages/Oportunidades.tsx`** — nova página placeholder `/oportunidades`, acessada pelo botão "Ver oportunidades" em `SectionRecursos`. Hero simples com título (com `<highlight>`) + descrição centralizados, sem cards nem eyebrow. Header + Footer padrão da plataforma.
- **`src/pages/Comunidade.tsx`** — nova página placeholder `/comunidade`, acessada pelo botão "Entrar na comunidade" em `SectionCasosSucesso`. Mesma estrutura hero-only de Oportunidades.
- **Rotas** `/oportunidades` e `/comunidade` em `App.tsx`.
- **`src/data/sections.ts`** — novas entradas `oportunidades` e `comunidade` com título (com markup `<highlight>`) e descrição de cada placeholder.
- **`SectionCasosSucesso`** — novo bloco "Comunidade de prática de Inovação em Políticas Públicas" abaixo do carrossel, com `TitleSubtitle` + `PillButton` "Entrar na comunidade" (hoje apontando para `/comunidade`).
- **Header navLink "Capacitação"** entre `Mapeamento de recursos` e `Formulador de iniciativas`, espelhando os 4 pilares do hero. Ativa o caminho pré-existente `isTrilhas → effectiveActive = 'capacitacao'` para manter o realce quando o usuário está em `/trilhas`.

### Changed

- **`SectionHero`** — CTAs passam de 3 para **4 blocos** em grid 2×2 (Agenda / Recursos / Capacitação / Formulador), alinhados à nova diretriz de dividir a plataforma nesses 4 pilares. Cards agora são **clicáveis** (`<button>` com `card-hoverable`) e fazem scroll suave para a seção correspondente com offset do header sticky (antes o `aria-label` indicava "etapa" mas não havia interação). Cada bloco ganha ícone distinto (`ChartColumn`/`Landmark`/`GraduationCap`/`Briefcase`), e padding interno aumentado para `lg` (40px) para dar respiro ao conteúdo.
- **`SectionRecursos`** — botão "Ver oportunidades" agora navega para `/oportunidades` (antes `href="#"`).
- **`SectionCasosSucesso`** — botão "Entrar na comunidade" agora navega para `/comunidade` (antes `href="#"`).
- **`SectionHeader`** — refatorado para sempre renderizar o mesmo markup (um único branch em vez de dois). Título passa de `<h2>` para `<h1>` (alinhado ao papel do título como cabeçalho principal da seção). Descrição fica em coluna à direita com `pt-2xs` para alinhamento ótico com o título, e largura do título adapta-se (`w-3/4` sem descrição, `w-2/3` com).
- **Header nav** — labels passam de `typo-body` para `typo-body-sm` para acomodar o novo item "Capacitação" sem quebrar o layout da pílula central.
- **Typography (`src/index.css`)** — variáveis de `line-height` não-utilizadas removidas; `line-height` default volta a `normal`. Classes `.typo-*` foram auditadas para aplicar explicitamente o `line-height` quando necessário, eliminando heranças implícitas.

### Tests

- **`sections.test.tsx`** — `SectionRecursos` e `SectionCasosSucesso` agora rodam sob `TestWrapper`, necessário desde que `PillButton` passou a renderizar um `<Link>` do React Router para hrefs internos.
- **Snapshots atualizados** — `SectionHeader` (novo markup com `<h1>` + coluna direita) e `Header` (novo navLink "Capacitação").

## [0.6.4] — 2026-04-19

Versão focada no **Formulador**: a marcação de "etapa concluída" passa a refletir o preenchimento real dos campos (em vez de apenas visitar a etapa) e a tela de conclusão perde o botão mockado "Enviar para análise". Também inclui ajustes no `CitySelector` (limpa o campo no foco) e no mapa da Paraíba (tooltip/click restritos a municípios com dados).

### Changed

- **`CitySelector`** — ao focar o input, o campo é limpo (em vez de pré-selecionar o nome do município atual). Permite que o usuário comece a digitar imediatamente sem precisar apagar o texto.
- **`ParaibaMap`** — tooltip com nome do município aparece ao passar o mouse sobre os polígonos das **cidades com dados na plataforma** (os 8 municípios de `municipios.json`). Clicar em um desses municípios **troca a seleção global** via `setMunicipio(id, nome)`, atualizando todas as seções e o `CitySelector` no header. Municípios sem dados permanecem não-clicáveis. Cursor `pointer` aplicado nos polígonos clicáveis para sinalizar a affordance.
- **Formulador — conclusão por preenchimento.** Uma etapa só é marcada como `Concluído` (check verde) quando **todos os campos obrigatórios** estão preenchidos. Etapas visitadas mas com campos faltando aparecem como `Em andamento` com estado inativo (cinza) — antes bastava clicar Próxima/Finalizar para marcar como concluída. Novo utilitário `src/utils/formuladorCompleteness.ts` com `isEtapaCompleta(slug, state)` e `countEtapasCompletas(state)`. `StepIndicator` ganha 4ª variante `in-progress`. `ProjectSteps` passa a receber `completedSlugs` além de `visitedSlugs`. Barra de progresso no topo (`FormuladorProgress`) agora reflete o % de etapas efetivamente completas.
- **Formulador — tela de conclusão.** Botão "Enviar para análise" (ação mockada) substituído por "Voltar para home", que navega para `/`. Banner de sucesso ("Projeto enviado com sucesso!") removido junto com o estado `enviado` (dead code).

## [0.6.3] — 2026-04-19

Versão que introduz a página **/trilhas** — listagem completa de trilhas de capacitação com seus cursos em carrossel — e liga os cards da SectionCapacitacao a essa página via hash (`#trilha-{slug}` ou `#curso-{slug}-{idx}`), destacando o curso clicado quando aplicável. Também liga cada curso à sua página na Escola Virtual do Governo.

### Added

- **`src/pages/Trilhas.tsx`** — nova página baseada no Figma `1103:3`. Hero com título + descrição, e cada trilha em uma seção com título, badge "X cursos", descrição e carrossel horizontal de `<TrilhaCard>`. Suporta navegação por hash: `/trilhas#trilha-{slug}` rola até a trilha; `/trilhas#curso-{slug}-{idx}` rola até o curso específico e realça o card.
- **`src/components/trilhas/TrilhaCard.tsx`** — card individual de um curso (distinto do `CoursesCard`, que é o resumo da trilha). Mostra carga, título, descrição (fallback genérico) e CTA "ver curso". Aceita `highlighted` para realce via outline quando navegado por anchor.
- **Rota `/trilhas`** em `App.tsx`.
- **`src/data/capacitacao.ts`** — adicionado campo `slug` em `Trilha`, campo opcional `descricao` em `Curso`, e helpers `trilhaAnchor(slug)` / `cursoAnchor(slug, idx)` para gerar âncoras estáveis.
- **`src/data/sections.ts`** — nova entrada `trilhas` com título e descrição da página.

### Changed

- **`CoursesCard`** agora recebe `slug` e liga ao `/trilhas#trilha-{slug}` via `PillButton`.
- **`CoursesCardRow`** ganha prop opcional `href` (antes fixo em `#`). `CoursesCard` passa `/trilhas#curso-{slug}-{i}` para cada linha, permitindo navegação até o curso específico.
- **`PillButton`** passa a usar o `Link` do React Router quando `href` é interno (começa com `/`). Antes usava `<a>` puro, que causava full reload em navegação interna.
- **`Header`** generaliza o tratamento de rotas não-Home: em `/trilhas` (e qualquer rota fora da `/`), cliques no logo e nav links navegam para a Home via React Router em vez de tentar fazer scroll local. `CitySelector` também fica oculto em `/trilhas` (mesmo comportamento de `/formulador`).
- **Cursos ligados à Escola Virtual do Governo.** Campo `url` adicionado em `Curso` e populado para todos os cursos. `TrilhaCard` passa o `url` para o `PillButton` "Ver curso" (abre em nova aba via `target="_blank"`).

Versão que **refatora a camada de dados** — separando a estrutura das agendas (catálogo) dos valores de cada município, e centralizando a derivação de `status` em uma régua por indicador — e **expande o protótipo de 3 para 8 municípios paraibanos** (com base nos CSVs de referência). Também ganha `ui/Carousel` como primitivo de carrossel reutilizável, e um lote de ajustes de tipografia e layout em cards.

### Added

- **`src/data/catalogo.ts`** — fonte única da estrutura de agendas e base econômica (ids estáveis + labels + ícones). Antes, `nome` da agenda, `label` do indicador e `icone` da base econômica se repetiam em cada JSON de município.
- **`src/data/thresholds.ts`** — régua de classificação por indicador. Converte o valor bruto em `StatusType` (`success`/`warning`/`alert`) via funções `higher-better`/`lower-better`/`enum`. Escalas oficiais embutidas: IDH-M/PNUD (`<0,6` alert / `0,6–0,7` warning / `≥0,7` success), ISDEL/Sebrae (faixas Muito Baixo/Baixo/Médio/Alto/Muito Alto), IGMA/Áquila (0-100), IGM-CFA (0-10); demais heurísticas documentadas no arquivo.
- **`src/data/municipios/{slug}.ts`** — um arquivo por cidade contendo apenas valores (`agendas: Record<id, string | number>` e `baseEconomica: Record<id, { valor, variacao }>`). O `status` é derivado pelo provider no merge com `thresholds.ts`.
- **6 novos municípios** (total agora: 8) — Queimadas (2512507), Conde (2504603), Caaporã (2503001), Pitimbu (2511905), Monteiro (2509701), Cabaceiras (2503100). Valores de agendas vêm dos CSVs de referência; valores de base econômica pesquisados (IBGE Cidades, Atlas Brasil/PNUD, Wikipedia — população estimativa 2025).
- **Marcador `*` para valores fictícios.** Onde não há fonte pública acessível (dados internos Sebrae como "MPE apoiadas pelo ELI", índices sem equivalente municipal como GEM/ICE, Participação MPE no PIB, Dependência Adm. Pública), o valor é inventado de forma plausível e sufixado com `*` (ex: `+3,2%*`, `R$ 420M*`, `1.950*`). Deixa auditável em código quais números são demo.
- **`ui/Carousel`** — novo primitivo de carrossel horizontal com snap-scroll + setas de navegação. Encapsula a `useRef` + handler `scrollBy` e renderiza `IconButton`s `ArrowLeft`/`ArrowRight` abaixo do track. API: `scrollAmount` (px por clique) + `children`.
- **`.scrollbar-hide`** (`src/index.css`) — utilitário agora implementado de verdade (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`). Antes a classe era usada nas sections mas não existia em lugar nenhum, então a barra de rolagem horizontal ficava visível.

### Changed

- **`MunicipioProvider`** passa a fazer merge runtime entre catálogo (estrutura) + valores do município + thresholds (status derivado). API pública (`useMunicipio`) inalterada — componentes e testes consomem `IndicadoresData` com a mesma forma de antes.
- **Valores de João Pessoa e Campina Grande migrados** usando o CSV de agendas como fonte primária (ex: IGM JP 7,8 → 6,54; IGMA agora em escala 0-100 como a fonte oficial Áquila). Os mocks anteriores deixaram de existir.
- **`SectionCapacitacao`** e **`SectionCasosSucesso`** passam a usar `<Carousel>` em vez de replicar o track e as setas. `SectionCapacitacao` ganha setas de navegação (antes não tinha). `SectionCasosSucesso` corrige `scrollAmount` — o valor anterior (`375+24`) estava desalinhado com a largura real do card (350) e o `gap-sm` (12px); passa a `362`. `SectionCapacitacao` usa `492`.
- **`SectionCapacitacao`** — removida a expansão "Ver todas as trilhas / Ver menos trilhas". Todas as trilhas são exibidas direto no carrossel.
- **`SectionCasosSucesso`** — header simplificado (removido wrapper desnecessário) e scroll container ganha padding horizontal para não cortar sombras dos cards na borda.
- **Tipografia do `TitleSubtitle`** — ajustes finos nas configurações de `sm` e `md` (line-height de body e tamanho correto por variante). `CaseStudiesCard` passa do tamanho `sm` para `md`; `SectionHero` passa a usar tamanho ajustado.
- **`CoursesCard`** — layout reorganizado para melhor display das linhas de curso + ajuste de padding.
- **`CaseStudiesCard`** — `PillButton` perde largura fixa para se comportar bem em contêineres menores.
- **`FormuladorCard`** — `TitleSubtitle` agora ocupa largura total do contêiner; descrição simplificada e `className` prop morta removida.
- **`RisksCard`** — layout e tipografia refinados para leitura (hierarquia entre label, valor e contexto).
- **`EconomicsCard`** — label passa de `typo-h4` para `typo-body uppercase` para pesar menos visualmente vs. o número.
- **Overlay de Recursos** — label ajustado.
- **`parseNumeric` corrigido para formato brasileiro** (`src/data/thresholds.ts`): antes `"12.840"` virava `12.84` e `deriveStatus` rendia status errado. Agora detecta separador de milhar BR (`1.240` → `1240`) preservando decimal com vírgula (`0,763` → `0.763`).
- **Tooltip de indicadores nas agendas.** `indicador-info.ts` era indexado pelas labels longas originais dos indicadores; quando as labels foram encurtadas no catálogo, o lookup `indicadorInfo[label]` passou a retornar `undefined` e o tooltip sumiu dos cards. Agora `indicador-info.ts` é chaveado pelo `id` estável do catálogo, o `Indicador` carrega `id` (injetado pelo `MunicipioProvider`) e o `AgendaIndicator` usa esse `id` no lookup — label pode mudar à vontade sem quebrar o tooltip.

### Removed

- **`src/data/indicadores/*.json`** — substituídos por `src/data/municipios/*.ts` com a nova estrutura de valores.
- **Município Patos** removido do protótipo (não consta no conjunto de referência de 8 municípios).
- **`Risco` type** e campo `riscos` de `IndicadoresData` (`src/types/indicadores.ts`) — nunca consumidos pela UI. `SectionRiscos` já deriva do filtro `alert`/`warning` das agendas.
- **CSVs fonte** (`src/data/indicadores_agendas.csv`, `src/data/indicadores_base_economica.csv`) — transcritos para os arquivos TS por município; não eram importados pelo build.

## [0.6.1] — 2026-04-17

Versão de polimento pós-`0.6.0`: rebalanceia a escala tipográfica dos botões (que vinha herdando valores grandes demais dos tokens originais), ajusta o CTA do card do Formulador e habilita o roteamento client-side em deploys da Vercel.

### Added

- **`vercel.json`** com rewrite `"/(.*)" → "/index.html"` para suportar SPA routing — sem isso, acessar rotas como `/formulador` direto na Vercel retornava 404.

### Changed

- **Tokens de tipografia de botão rescalados** (`src/index.css`): `--font-size-button-lg` 40→24px, `--font-size-button` 20→16px, `--font-size-button-sm` 16→14px. Os valores anteriores estavam grandes demais para os contêineres dos botões.
- **`Button`** — mapeamento de tipografia por tamanho padronizado: `sm` agora usa `typo-button-sm`, `md` usa `typo-button`, `lg` usa `typo-button-lg` (antes estavam deslocados em um nível).
- **`PillButton`** — `size="md"` ganha padding horizontal maior (`pl-md`/`pr-md` no lado oposto ao círculo) para dar respiro ao label; `size="lg"` passa a usar `typo-button-lg`; default do `size` muda de `lg` para `md`.
- **`SectionCapacitacao`** — botão "Ver todas as trilhas / Ver menos trilhas" passa de `size="lg"` para `size="md"` para harmonizar com a nova escala.
- **`FormuladorCardData`** (`src/data/formulador.ts`) — label do CTA do card do Formulador na Home: "Começar com a ajuda da IA" → "Começar agora".

## [0.6.0] — 2026-04-17

Versão que introduz o **Formulador de Projetos** — um fluxo em 10 etapas + tela de Conclusão com resumo exportável em PDF, persistência local por município e integração dos links do Header com a Home via deep-linking. Para sustentar a experiência, o design system ganha três primitivos novos (`TextInput`, `ProgressBar`, `NumberBullet`), o `PillButton` foi generalizado (variantes, posição do ícone, polimórfico `<a>`/`<button>`) e surgiram variantes novas de `Button` (`success`) e `Dropdown` (`ButtonVariant`).

### Added

**Formulador**

- **Rota `/formulador`** (`pages/Formulador.tsx` + `FormuladorStep.tsx` + `FormuladorConclusao.tsx`) com rotas aninhadas: `/formulador` → redirect pra `identificacao`, `/formulador/:stepSlug` → etapa, `/formulador/conclusao` → resumo. Slug inválido volta pra primeira etapa.
- **10 componentes de etapa** (`components/formulador/steps/`): `StepIdentificacao`, `StepJustificativa`, `StepObjetivos`, `StepPublicoAlvo`, `StepPlanoAcao`, `StepCronograma`, `StepIndicadores`, `StepOrcamento`, `StepSustentabilidade`, `StepGovernanca`. Cada um lê/escreve um slice do `FormuladorContext` via `TextInput`. Objetivos e Orçamento têm listas dinâmicas (+ Adicionar); Orçamento calcula Valor Total via `useMemo` (parse pt-BR + `Intl`).
- **Estado global do Formulador** (`FormuladorContext` + `FormuladorProvider` + `useFormulador`) — um rascunho por município (chave `formulador:${ibgeId}` em `localStorage`), hidratação no mount, persistência automática a cada mudança. Helpers `setSlice(key, value)`, `markVisited(slug)`, `reset()`. Troca de município recarrega o rascunho correspondente via render-phase state update.
- **Tipagem em `types/formulador.ts`** — um tipo por etapa + `FormuladorState` + `EMPTY_FORMULADOR_STATE`.
- **Componentes do layout do Formulador** (`components/formulador/`):
  - `FormCard` — título/subtítulo + slot + footer paginado (Anterior / X de N / Próxima ou Finalizar).
  - `FormuladorProgress` — `Card` com `ProgressBar` + "X% concluído" + "Y/10 etapas • Etapa Atual: …".
  - `ProjectSteps` — sidebar das 10 etapas (deriva status de `currentSlug` + `visitedSlugs`).
  - `StepIndicator` — item da sidebar com 3 variantes (unchecked/current/checked).
  - `AIAssistant` — painel cinza com descrição + exemplos + ações (no-op placeholder v1; removido do layout posteriormente).
- **Fontes de verdade** em `data/`: `formulador-etapas.ts` (slug, label, nome, título, subtitle das 10 etapas + helpers) e `formulador-ai.ts` (conteúdo do AIAssistant por etapa).

**Design system**

- **`TextInput`** (`components/ui/TextInput.tsx`) — primitivo de input/textarea com `title`, `subtitle`, `hint`, `disabled`, `multiline`, `rows`. Cobre as 9 variantes do Figma (`603:2011`) com booleans ao invés de enum.
- **`ProgressBar`** (`components/ui/ProgressBar.tsx`) — barra 0–100 genérica, `role="progressbar"` + `aria-valuenow`, fill em `bg-accent`.
- **`NumberBullet`** (`components/ui/NumberBullet.tsx`) — bullet numérico circular. Variants `primary` (accent + texto `--semantic-text-secondary`) / `secondary` (cinza + texto preto); sizes `sm` (24px) / `md` (32px).
- **Token semântico `--semantic-text-secondary`** adicionado em `src/index.css` (light mode: `--primitives-white`) — habilita o variant `primary` do `NumberBullet`.
- Ícones `Check`, `Circle`, `CircleDot`, `Plus`, `Trash2`, `X` exportados de `components/icons`.

**Outras**

- **Exportação PDF da Conclusão** — "Baixar PDF" (via `window.print()`) agora captura só a área de resumo. `@media print` em `src/index.css` esconde header/footer/hero/progress/sidebar/botões via `visibility: hidden` e revela apenas `.print-area`. Título exclusivo ("Resumo do projeto" + título do projeto + município) aparece só no PDF via `hidden print:flex`. `break-inside: avoid` nos cards de cada etapa.

### Changed

**Header e navegação**

- **`Header`** na rota `/formulador`:
  - Link "Formulador de iniciativas" fica destacado como ativo (pinado por `pathname.startsWith('/formulador')`; scroll-spy não tem seções pra inferir aqui).
  - `CitySelector` é ocultado (seleção de município passa a ser o Dropdown da etapa Identificação).
  - Logo e qualquer link de navegação disparam `window.confirm('Você perderá o rascunho do formulário deste município. Deseja continuar?')`. Se OK, `reset()` limpa o rascunho e o usuário vai pra Home: logo → topo; link → `/#<sectionId>`.
- **`Home`** passa a observar `location.hash` e faz scroll pra seção correspondente com offset do header sticky (95px). Cobre o retorno do Formulador e torna `/#panorama`, `/#recursos` etc. deep-linkáveis.

**Componentes UI**

- **`PillButton`** — agora expõe `variant` (`'primary'` | `'secondary'` | `'ghost'`, default `primary`) e `iconPosition` (`'left'` | `'right'`, default `right`). Combinado com `size` (sm/md/lg), gera 9 cores × 3 tamanhos. `iconPosition='left'` inverte padding e troca pra `ArrowLeft`. Passou a ser **polimórfico**: renderiza `<a>` quando `href` é fornecido, senão `<button type="button">` (com `onClick` e `disabled`). Detecta href interno (começa com `/`) e omite `target="_blank"` pra navegação SPA. `size="sm"` ganhou altura 32px com círculo 24px inset 4px; novas utilidades `.pl-2xs` / `.pr-2xs` no design system. Call sites `CaseStudiesCard` e `CoursesCardRow` passam a usar `variant="ghost"` explicitamente.
- **`Button`** — nova variante `success` (fundo `--semantic-success`, label branco).
- **`Dropdown`** — novo prop opcional `ButtonVariant` (`'primary' | 'secondary' | 'tertiary' | 'ghost'`, default `'primary'`) pra customizar o trigger. Callers existentes (`SectionPanorama`) seguem iguais.
- **`ProgressBar`** — fill passa de preto para `bg-accent`.

**Formulador**

- **`FormCard`** — botões Anterior e Próxima/Finalizar agora usam `PillButton` (tamanho `sm`). Anterior/Próxima = `variant="secondary"`; Finalizar = `variant="primary"` na última etapa. Cards de layout (`FormCard`, `FormuladorProgress`, `ProjectSteps`) passam a usar `radius="sm"` uniformemente.
- **Layout da página `/formulador`** — hero usa `<TitleSubtitle>` e estrutura semântica ajustada (`<main>` + `<section>` aninhados; gap-xl entre blocos, gap-sm dentro do grid de etapa).
- **`FormuladorStep`** — `AIAssistant` removido do layout (placeholder idêntico em todas as etapas na v1). Grid interno vira só `ProjectSteps` + `FormCard`.
- **`StepIdentificacao`** — campo "Município" virou um `Dropdown` sincronizado com o `MunicipioProvider` (`ButtonVariant="tertiary"`). Trocar no Dropdown dispara `setMunicipio(...)` e o rascunho recarrega o do novo município. Fim da divergência entre município global e digitado à mão.
- **`IdentificacaoData`** — campo `municipio` removido do rascunho (fonte única = `MunicipioProvider`); resumo da Conclusão lê `municipio.nome` direto do contexto.
- **`StepObjetivos`** — permite remover objetivos específicos (lixeira ghost + `Trash2`; some quando só resta 1 objetivo).
- **`StepIndicadores`** — os três grupos (Resultado, Impacto, Metas Quantitativas) passam a ter uma linha por objetivo específico (etapa 3), com o texto do objetivo como label (fallback "Objetivo N" / "Indicador N").

**Tela de Conclusão**

- **Banner de sucesso** só aparece depois que o usuário clica em "Enviar para análise". Após o clique, o botão troca pra variante `success` (verde + `Check` + "Enviado") e o `onClick` vira no-op.
- **Layout alinhado com o Figma**: "Editar projeto" e "Baixar PDF" (`variant="tertiary"`) à esquerda; "Enviar para análise" empurrado pra direita com `ml-auto`. Cada etapa do resumo exibe um `<NumberBullet variant="primary">` antes do título; título fica fora do card de campos; campos vão pra card com fundo mais claro (`bg-primary` ≈ `#f3f3f3`) e labels em `text-inactive`.
- **Resumo label-a-label com o Figma**:
  - **Cronograma** "explode" o textarea em blocos individuais: cada linha no formato `"Fase 1 - Diagnóstico: Meses 1-2"` vira uma linha label/value própria (novo helper `parseLinesIntoBlocks`).
  - **Orçamento** ganha "Valor Total do Projeto" calculado no topo e lista cada rubrica como label/value.
  - **Plano de Ação**: label `"Atividades Previstas"` → `"Principais Ações"`; cada linha do textarea vira um bullet `• …`.
  - **Justificativa**: `"Problema central"` → `"Problema Central"`.
  - **Sustentabilidade**: `"Parcerias Institucionais"` → `"Parcerias Previstas"`.
  - Renderer oculta o `<p>` da label quando ela vem vazia (suporte à fallback do parseador).

**Outros**

- **`formuladorCards`** — `buttonHref` do card "Assistente de formulação de projetos" aponta agora para `/formulador` (antes `#`).
- **`TestWrapper`** — envolve os children em `MemoryRouter` + `FormuladorProvider` (Header consome `useFormulador` pra `reset()` e `useLocation`).
- **Testes** — 65 testes no total (antes 56). Smoke tests para `TextInput` (2 variantes), `ProgressBar`, `NumberBullet` (2 variantes), `StepIndicator` (3 variantes), `ProjectSteps`, `FormuladorProgress`, `AIAssistant`, `FormCard` (2 variantes). Snapshots para `TextInput`, `ProgressBar`, `NumberBullet` (2 variantes), `StepIndicator` checked, `FormuladorProgress`, `AIAssistant`.

## [0.5.1] — 2026-04-17

Versão focada em consolidar a conexão entre agendas e a seção Panorama, e em adicionar affordances de contexto via tooltips (objetivo por agenda e descrição por indicador). Inclui refresh completo dos indicadores para espelhar a última versão do Figma e ajuste do `DropdownMenu` para não vazar da tela com a lista mais longa.

### Added

- **`DropdownMenu` com limite de altura** (`components/ui/DropdownMenu.tsx`) — com o dropdown do Panorama listando todos os indicadores das agendas, a lista estava vazando a tela. Adicionado `max-h: 40dvh` (viewport-relative, sem número mágico em pixels) + `overflow-y-auto` na UL.
- **`Tooltip`** (`components/ui/Tooltip.tsx`) — componente reutilizável, usa `Card` como base para o painel flutuante. Props: `content`, `placement` (top/bottom), `align` (start/end), `width`, `trigger` (`hover` | `click`), `followCursor`. Em `hover`, abre em hover + focus (keyboard-friendly); em `click`, abre/fecha no clique com click-outside e `Escape` para fechar; com `followCursor`, o painel é **portalado ao `<body>`** e posicionado com `position: fixed` à direita do cursor (16px offset), `pointer-events-none`, escapando stacking contexts dos cards vizinhos. `role="tooltip"` para a11y.
- **Objetivos das agendas** (`data/agenda-objetivos.ts`) — mapa `{ [nomeDaAgenda]: objetivo }` com os 6 objetivos extraídos do Figma (Governança, Simplificação, Inovação ELI, Educação, Financiamento, Inclusão produtiva).
- **Tooltip de objetivo no `AgendaCard`** — ícone `Info` no canto superior direito do card exibe o objetivo da agenda em tooltip ao hover/focus. Texto segue `.typo-body-sm` com destaque bold no heading "Objetivo".
- **Tooltip de descrição em `AgendaIndicator`** — hover da linha do indicador abre um tooltip com `followCursor` à direita do cursor, mostrando o label em bold + descrição curta (o que o indicador mede / fonte). Sem ícone adicional — a própria linha é o trigger (`cursor-help` quando há descrição). Dados em `data/indicador-info.ts` (mapa label → descrição para os 24 indicadores das agendas).
- Ícone `Info` exportado de `components/icons`.

### Changed

**Indicadores das agendas** (`data/indicadores/*.json` — 3 municípios)
- Revisão completa dos indicadores das 6 agendas conforme última versão do Figma.
- Agenda 1 — Governança: labels renomeados (`IGM – Índice CFA de Governança Municipal (Finanças, Gestão e Desempenho) 2025`, `IDH-M 2021`, `Governança para o Desenvolvimento – ISDEL 2023`) e novo indicador `Índice de Gestão Municipal Áquila (IGMA)`.
- Agenda 2 — Simplificação: labels renomeados para refletir o texto atual (`Tempo médio de viabilidade da empresa (h) em relação à média estadual`, `Tempo médio de abertura da empresa (h)`, `Ranking municipal Redesim/PB`).
- Agenda 3 — renomeada para `"Inovação inclusiva e digitalização para Pequenos Negócios, em ELI"`; adicionados `Taxa de crescimento de MPE formalizadas nos ELI com apoio Sebrae` e `Taxa de crescimento do valor das compras públicas de inovação nos pequenos negócios`.
- Agenda 4 — Educação: label do primeiro indicador atualizado para `Subdimensão Educação Empreendedora, da dimensão Capital Empreendedor – ISDEL`; indicadores de Ensino Médio/Superior ganharam o qualificador `"com pelo menos"`.
- Agenda 5 — renomeada para `"Financiamento e crédito orientado"`; substituída por dois indicadores de valor absoluto (`Valor (R$) das operações de crédito e de financiamento concedidos no município` e `Valor (R$) total das Operações diretas e indiretas não automáticas (financiamento e crédito)`).
- Agenda 6 — Inclusão produtiva expandida com 5 novos indicadores: `Total de empresas ativas`, `Taxa de crescimento anual de beneficiários do Bolsa Família entre 18 e 50 anos`, `Número de pequenos negócios apoiados pelo Sebrae`, `% dos pequenos negócios no total de compras públicas no município`, `Linhas de Crédito Disponíveis`.

**Mapa/panorama** (`data/mapa-indicadores.ts`)
- `indicadorOptions` sincronizado com os novos labels das agendas para manter o dropdown do panorama funcional.
- Adicionadas 10 novas `IndicadorKey`s cobrindo todos os indicadores novos das agendas (IGMA, ELI Sebrae, compras públicas de inovação, operações de crédito R$, operações não automáticas R$, empresas ativas, Bolsa Família 18–50, apoiados Sebrae, MPE em compras públicas, linhas de crédito) — o dropdown do Panorama agora espelha 1:1 os indicadores das agendas.
- Entries populadas para João Pessoa, Campina Grande e Patos; demais 9 municípios ficam sem cor/badge nos novos indicadores (comportamento padrão já tratado por `ParaibaMap` e `usePanoramaMedia`).
- Removidos os indicadores antigos `operacoes_credito` e `financiamentos` (substituídos pelos novos indicadores de valor absoluto da Agenda 5).

**Contextos de risco** (`data/riscos-contexto.ts`)
- Chaves atualizadas para refletir os novos labels; adicionados contextos para os novos indicadores de alerta/atenção (IGMA, ELI, compras públicas, Bolsa Família, Sebrae, linhas de crédito).

## [0.5.0] — 2026-04-17

Versão focada em experiência de abertura e consolidação do design system: nova `SectionHero` com macro-objetivo e CTAs temáticos, utility `.card-hoverable` (hover ring via `box-shadow` por fora do border-box) adotada em todos os cards interativos, títulos das seções padronizados em formato de pergunta e refinos de layout (`SectionHeader` em proporções, `Footer` centralizado em 1440px, scroll de casos de sucesso sem crop do lift).

### Added

- `SectionHero`: nova seção inserida antes de `SectionAgendas`. Apresenta o macro-objetivo da plataforma ("uma plataforma de inteligência que converte dados do território em insights e capacidade da gestão pública em ação...") com destaques em accent e 3 cards temáticos (Mobilize agendas, Analise o ambiente, Formule soluções). Cada card usa o primitivo `Card` com ícone circular em `surface-secondary` e `TitleSubtitle` do design system. Atende feedback da Luisa Oliveira sobre deixar o propósito e chamadas para ação visíveis na abertura.
- `sectionContent.hero` em `data/sections.ts` — título com marcadores `<highlight>` e array de CTAs (id, label, description, sectionId).
- Smoke test de `SectionHero` em `test/sections.test.tsx`.
- Descrições nas seções **Riscos**, **Recursos** e **Casos de Sucesso** — antes só tinham título; agora `SectionHeader` recebe `description` em todas.
- Classe utilitária `.pb-3xl` em `index.css` (paralela às demais `.pb-*`).

### Changed

**Títulos e descrições das seções** (`data/sections.ts`)
- `panorama.description`: reescrita para destacar distribuição entre municípios → `"Explore como está o Ambiente de Negócios do estado e a distribuição entre os municípios."`
- `baseEconomica.title`: `"Base Econômica e Competitiva"` → `"Qual o panorâma sócioeconômico do município?"` (formato de pergunta, alinhado com as demais seções).
- `recursos.title`: `"Recursos e Capacitação para o Desenvolvimento do Município"` → `"Onde acessar oportunidades de captação de recursos?"`.
- `casosSucesso.title`: `"Municípios que transformaram seu ambiente de negócios"` → `"Inspire-se com casos de sucesso"`.
- `formulador.title`: `"Formulador de projetos e politicas publicas"` → `"Como escrever projetos de políticas públicas?"`.

**Dados de recursos** (`data/recursos.ts`)
- `recursosContent.emendas.title`: `"Emendas parlamentares disponíveis"` → `"Emendas federais e estaduais mapeadas"`.
- `recursosContent.buttons.explorarEmendas`: `"Explorar emendas"` → `"Explorar oportunidades de emendas"`.

**Agendas** (`data/indicadores/*.json` — 3 municípios)
- Agenda `"Inovação inclusiva e digitalização para Pequenos Negócios, em ELI"` → `"Ecossistemas de Inovação: Inclusão e digitalização para Pequenos Negócios"`.
- Agenda `"Viabilização financeira e crédito orientado"` → `"Acesso a crédito e viabilização financeira"`.

**AgendaStats** (`components/agenda/AgendaStats.tsx` + `data/labels.ts`)
- `agendaStatsLabel`: `"indicadores avaliados"` → `"indicadores alinhados às agendas estratégicas para melhorar o ambiente de negócios do seu município"` (texto mais contextual).
- Layout: wrapper ganha `gap-3xl`; gap interno do total `gap-md` → `gap-sm`; tipografia do label `typo-body-lg` → `typo-body`.

**SectionHeader** (`components/ui/SectionHeader.tsx`)
- Proporções substituem max-widths fixos: sem description, `max-w-[1000px]` + `flex-col-start` → `flex` com `h2.w-3/4`; com description, `max-w-[690px]` / `max-w-[400px]` → `w-2/3` / `w-1/3`.

**Home** (`pages/Home.tsx`)
- Padding do `<main>`: `py-xl` → `pb-3xl` (remove padding top, aumenta bottom para respiro final da página).

**SectionHero** (`components/sections/SectionHero.tsx`)
- CTAs migrados para o design system: `<button>` customizado → primitivo `Card` (`ui/Card`); `<h3>` + `<p>` inline → `TitleSubtitle size="sm"`.
- Ícone circular: `radius-md` + `bg: --semantic-accent-surface` + cor accent → `radius-full` + `bg-surface-secondary` com cor padrão do ícone.
- Hover extraído para utilitário do DS `.card-hoverable` (`index.css`) — agrupa `cursor-pointer`, `transition` e, no `:hover`, lift (`translateY(-2px)`) + sombra com anel 1px em `--semantic-accent-surface` renderizado **por fora do border-box** (via `box-shadow` com spread, não via `border`). Assim o anel funciona em qualquer card: sem borda própria aparece só o anel; com borda própria (ex.: `Card bordered`) a cor da borda permanece intocada e o anel surge por fora. `:focus-visible` usa `outline` accent independente.
- Removidos: step number (`01`/`02`/`03`), rodapé "Começar" com `ArrowRight`, constante `HEADER_HEIGHT` e função `scrollToSection` — cards deixam de ter navegação por click para as seções de destino nesta iteração.

**Adoção de `.card-hoverable` nos cards interativos**
- `AgendaCard` (`components/agenda/AgendaCard.tsx`)
- `CaseStudiesCard` (`components/case-studies/CaseStudiesCard.tsx`)
- `EconomicsCard` (`components/economics/EconomicsCard.tsx`)
- `EconomicsAnalysis` (`components/economics/EconomicsAnalysis.tsx`)
- `ResourcesCard` (`components/resources/ResourcesCard.tsx`)
- `RisksCard` (`components/risks/RisksCard.tsx`) — caso com `Card bordered surface={alert|warning}`: borda colorida permanece intocada e o anel accent surge por fora dela.

**SectionCasosSucesso** (`components/sections/SectionCasosSucesso.tsx`)
- Scroll container de cards ganha `py-xs -my-[var(--spacing-xs)]`: dá respiro vertical para o lift + anel do `.card-hoverable` (o `overflow-x-auto` força `overflow-y` a clipar, cortando a animação no topo/base) sem alterar o espaçamento externo.

**Footer** (`components/layout/Footer.tsx`)
- Linhas interna (brand + colunas) e bottom (divider + copyright) ganham `mx-auto w-full max-w-[1440px]` — conteúdo do footer agora segue a mesma largura máxima/centering das demais seções, ficando alinhado mesmo em viewports acima de 1440px.

## [0.4.0] — 2026-04-16

Refino da seção Capacitação: conteúdo realinhado ao planejamento do projeto, `CoursesCard` agora é expansível individualmente e `SectionCapacitacao` adota layout empilhado com trilha única visível por padrão.

### Added

- `SectionCapacitacao`: `SectionHeader` ganha `description` ("Curadoria de cursos e conteúdos de aprimoramento para uma gestão pública cada vez mais inovadora.") — novo campo em `data/sections.ts`.
- `CoursesCard`: botão interno de expandir/recolher (`Ver trilha completa (N)` / `Ver menos cursos`) com `ChevronDown`/`ChevronUp`; exibe 2 cursos por default e revela os demais ao clicar.

### Changed

**SectionCapacitacao**
- Layout: `grid-2` (2 colunas) → `flex-col` empilhado — cada trilha ocupa a largura total.
- `VISIBLE_COUNT` de trilhas: `2` → `1` (apenas a primeira trilha aparece antes de expandir).
- Botão "Ver todas as trilhas": variant `secondary` → `primary`; rótulo perde o contador (`Ver todas as trilhas (N)` → `Ver todas as trilhas`).

**CoursesCard**
- CTA externa (`PillButton verTrilhaCompleta`) substituída pelo novo toggle interno de expandir cursos da trilha.
- Padding: `{x: 'xl', y: '2xl'}` → `xl` uniforme; `min-h-[35dvh]` removido (altura orgânica); adiciona `w-full`.
- Lista interna de cursos ganha `px-lg` para alinhamento com o título.
- `TitleSubtitle` size: `sm` → `md`.

**CoursesCardRow**
- `PillButton` size: `md` → `sm`.
- `PillButton` sm redesenhado: círculo `24×24` → `32×32`, ícone `xs` → `md` (mais visível na linha).
- Título do curso: `typo-body` → `typo-body-bold`.
- Container do conteúdo perde `max-w-[290px] flex-1`; linha agora usa `gap-3xl` + `px-sm`.
- Label `ctaLabels.verCurso`: `"Ver curso"` → `"ver curso"` (lowercase, alinhado com o visual da linha).

**Dados de capacitação** (`data/capacitacao.ts`)
- Reescrita completa das trilhas, alinhada ao planejamento do projeto. 8 trilhas consolidadas em 5:
  - `Formulação e Avaliação de Políticas Públicas` (absorve "Avaliação de Políticas Públicas" + "Políticas Públicas Setoriais e Participação Social")
  - `Gerenciamento de Projetos` (absorve "Metodologias Ágeis", "Design/Inovação/Transformação Digital" e "Gestão de Projetos no Setor Público")
  - `Captação de Recursos` (absorve "Convênios de ECTI", "Compras Públicas/Marco Legal" e partes de "Gestão Municipal")
  - `Prestação de contas` (nova, especializada)
- Título da seção: `"Capacitação para estruturar projetos e acessar recursos"` → `"Habilidades para uma gestão pública inovadora"`.

## [0.3.1] — 2026-04-16

Corrige erro de build

### Changed

**Panorama**
- `PanoramaMediaInfo`: prop `count` (não consumida) removida.

## [0.3.0] — 2026-04-16

Primitivo `Card` consolidando 9 cards + 3 seções, sistema de cores de botão (primary azul, texto automático) e padronização de layout. 22 commits desde 0.2.0, sem quebra de comportamento do protótipo.

### Added

**Design system**
- `ui/Card` — primitivo unificado para superfície de card. Variantes tipadas: `surface` (primary/secondary/success/warning/alert), `padding` (all ou `{x, y}`), `bordered`, `radius` (sm/md), `as` (div/section). Consolida 4 padrões que estavam espalhados em 9 cards (`.card-surface` inline, `bg-[var]+rounded-[var]` inline, variantes de status hardcoded no `RisksCard`, e o wrapper `SectionCard`).
- `.card-surface-secondary` em `index.css` — espelha `.card-surface` para surface cinza (background + border-radius num único utility).
- `.typo-button-secondary-{lg,md,sm}` em `index.css` — tipografia de botão com texto escuro (`--semantic-button-label-secondary`) para uso em shells claros (ex: `PillButton` sm/md).

**Seções**
- `PanoramaMediaInfo`: nome do município campeão exibido ao lado do maior valor estadual (ex: `0,745 (Campina Grande)`). `usePanoramaMedia` retorna `maiorMunicipioNome` via lookup por valor do indicador.

### Changed

**Primitivo Card**
- 9 cards migrados para `<Card>`: `AgendaCard`, `AgendaStats`, `EconomicsCard`, `EconomicsAnalysis`, `ResourcesCard`, `RisksCard`, `CaseStudiesCard`, `FormuladorCard`, `CoursesCard`. Bloco do `SectionAIAssistant` e wrappers de `SectionPanorama` / `SectionRecursos` também passam a usar `Card`.
- `RisksCard`: mapa `tipoStyles` local (bg+border por variante) eliminado — agora delegado ao `<Card surface={tipo} bordered>`.
- `CoursesCard`: padding `px-xl py-2xl` (que ficava escondido no map interno do antigo `SectionCard`) agora explícito como `padding={{x: 'xl', y: '2xl'}}` no call-site.
- `TitleSubtitle`: prop `content` renomeada para `subtitle` — mais descritiva. Consumidores atualizados: `CaseStudiesCard`, `CoursesCard`, `SectionRecursos`, `FormuladorCard`.
- `FormuladorCard`: reescrito para usar `Card` + `TitleSubtitle` no lugar de markup inline.
- `EconomicsAnalysis`: wrapper `<div>` → `<section>` (HTML semântico), preservado via nova prop `as` do `Card`.

**Sistema de cor de botão**
- **Tokens**: `--semantic-button-primary` preto → `blue-500`; `--font-size-button` 24 → 20px; `--font-size-display-small` 28 → 24px. Classes `.typo-button-*` agora usam `--semantic-button-label-primary` (branco) por default.
- `PillButton`: sm/md adotam `typo-button-secondary-{sm,base}` (texto escuro em shell claro). lg perde `h-[64px] w-[340px]` fixo (auto-sized), shell `bg-surface-secondary` → `bg-accent` (azul primário), círculo 48×48 → 40×40.
- `Dropdown`: trigger inline substituído por `<Button variant="primary" size="md" icon={ChevronDown} iconPosition="right">` — herda tokens de cor de botão automaticamente.
- `CoursesCard`: CTA `PillButton` perde `w-[325px]` — PillButton lg agora é auto-sized.

**Refinamentos visuais**
- `CoursesCardRow`: título `typo-h4 uppercase` → `typo-body` (combina com densidade da linha); gap interno `sm` → `xs`.
- `PanoramaMediaInfo`: tipografia achatada para `typo-body` em todos os labels (sem mais `text-inactive`/`text-accent` destacados); remove sufixo `(N municípios)` da média.
- `SectionPanorama`: info da média + mapa agrupados em `<section>` interna com `gap-sm`; gap externo do `Card` `md` → `lg`.
- `.divider` unificado em `--primitives-gray-200` (antes `--semantic-surface-secondary`); `Footer` migrado para `.divider`.
- **Padronização de cards** (`FormuladorCard`, `SectionRecursos` — Bloco 1 e Editais): `min-h-[35dvh]` removido; cards agora têm altura orgânica. `FormuladorCard` gap interno `lg` → `2xl`. Card de Editais passa a usar o mesmo layout do `FormuladorCard` (`flex flex-col items-end gap-2xl`).

**Dados**
- `data/capacitacao.ts`: durações dos cursos expandidas de `Nh` para `N horas` (ex: `36h` → `36 horas`).

### Removed

- `ui/SectionCard` — substituído pelo novo `ui/Card`.
- Borda invisível do `EconomicsCard` (`border` na mesma cor do background — artefato, não feature).
- Card "Modelos de projeto" do formulador — resta apenas o card do assistente IA.
- `.divider-primary` — consolidado em `.divider`.

## [0.2.0] — 2026-04-16

Consolidação do design system, nova taxonomia de botões e reorganização por domínio. 33 commits desde 0.1.0, sem quebra de comportamento do protótipo.

### Added

**Design system**
- Tokens de icon size `iconSizes` (xs 12 / sm 16 / md 20 / lg 24 / xl 32) co-localizados com os re-exports de ícones em `src/components/icons/index.ts`
- Classes utilitárias `.radius-sm/md/lg/xl/full` e `.bg-primary/surface/surface-secondary/accent` em `index.css` — substituem `rounded-[var(--radius-*)]` e `bg-[var(--semantic-*)]` inline
- Classe `.grid-5` (5 colunas, gap-xs) — completa a família `.grid-2` / `.grid-3`

**Primitivas de UI**
- `ui/InsetBar` — barra encaixada no topo de SectionCard com label + controle
- `ui/useDropdownState` — hook compartilhado com open/setOpen/ref + click-outside
- `ui/DropdownMenu` — lista UL reutilizável com auto-sizing (`max-content` + `min-width: 100%`)
- `ui/buttons/IconButton` — botão circular icon-only com 4 variants × 3 sizes (sm 24×24, md 40×40, lg 48×48) e `aria-label` obrigatório
- `components/icons/index.ts` — re-exports `ArrowLeft`, `ChevronUp` e tipo `LucideIcon`

**Seções**
- PanoramaMediaInfo exibe agora valor do município selecionado (destaque accent) e maior valor estadual, além da média

**Qualidade**
- ESLint `no-restricted-imports` bloqueia imports diretos de `lucide-react` fora de `components/icons/index.ts`

### Changed

**API de botões**
- `Button`: `label: string` (obrigatório) substitui `children`; nova variant `ghost`; props opcionais `icon: LucideIcon` + `iconPosition: 'left' | 'right'` (default `right`). Tamanho do ícone derivado automaticamente do `size` do botão.
- `PillButton`: prop `size: 'sm' | 'md' | 'lg'` (default `lg`, retrocompat). Variantes sm/md têm shell transparente + círculo gray 24×24 com seta 12px; lg preserva design original (64×340 + círculo 48×48 + seta 24px).

**Refatorações**
- `Dropdown` e `CitySelector` consomem `useDropdownState` + `DropdownMenu` — dedupe da lógica de open/close e click-outside
- `CitySelector.query` passa a ser estado derivado (`open ? draft : municipio.nome`) — elimina setState-in-effect
- Imports de `lucide-react` migrados para `@/components/icons` em 9 arquivos — único ponto de entrada
- Props `size={N}` hardcoded trocadas por `iconSizes.xs/sm/md/lg/xl` em todos os consumidores
- ~45 ocorrências de `rounded-[var(--radius-*)]` e `bg-[var(--semantic-*)]` substituídas pelas novas classes em 20 componentes

**Reorganização de pastas**
- `src/components/ui/buttons/` criada; `Button.tsx` e `PillButton.tsx` movidos para lá (junto do novo `IconButton`)
- Primitivos da raiz reorganizados por domínio: `ParaibaMap` → `map/`, `CitySelector` + `User` → `layout/`, `TitleSubtitle` + `SectionHeader` → `ui/`
- `SectionCard`: wrapper `<div>` → `<section>` (HTML semântico)

**Docs**
- `CLAUDE.md` atualizado: nova taxonomia de botões (Button / IconButton / PillButton), `ui/buttons/`, primitivas de dropdown (`DropdownMenu`, `useDropdownState`) e tokens de icon size

### Fixed

- CaseStudiesCard CTA: `<div>` estilizado substituído por `PillButton size="sm"` — corrige acessibilidade (agora clicável e focável)
- CoursesCardRow CTA: idem — `<div>` → `PillButton size="md"`
- EconomicsCard e ResourcesCard: largura fixa removida; layout agora controlado pelo pai via `.grid-5`
- SectionBaseEconomica e SectionRecursos: `flex flex-wrap` + calc substituído por `grid-5`
- SectionPanorama: `padding="md"` removido do SectionCard; header do dropdown agora encaixado como `InsetBar`
- SectionBaseEconomica: gap vertical ajustado (`gap-lg` → `gap-md`)
- Dropdown: background do trigger ajustado (`bg-surface-secondary` → `bg-surface`)
- ParaibaMap: `z-[1000]` desnecessário removido do overlay de ativação
- Tipografia: `--font-size-display-small` corrigido de 24px para 28px
- Classes nomeadas `.radius-*` (não `.rounded-*`) para evitar colisão com utilities nativas do Tailwind

### Removed

- `ui/ScrollArrowButton` — substituído por `IconButton variant="secondary" size="lg"` em SectionCasosSucesso
- Pasta `src/constants/` — tokens de icon size consolidados em `components/icons`
- CSS vars `--icon-size-*` não-consumidas descartadas de `index.css` (fonte única passa a ser `iconSizes` em JS)

## [0.1.0] — 2026-04-15

Primeiro release do protótipo funcional da Plataforma OPP.

### Funcionalidades

- **8 seções completas:** Agendas, Panorama, Base Econômica, Riscos, Recursos, Capacitação, Casos de Sucesso, Formulador
- **Mapa interativo da Paraíba:** Leaflet + Carto Positron + GeoJSON local, polígonos coloridos por status, badges de valor, overlay click-to-interact
- **Estado global por município:** Context API com dados mock para João Pessoa, Campina Grande e Patos
- **Header sticky com scroll-spy:** nav links acompanham a seção visível com pill de acento, logo scroll-to-top
- **CitySelector digitável:** campo de busca com dropdown filtrado por nome de município
- **Riscos dinâmicos:** seção extrai automaticamente top 3 indicadores em alert/warning das agendas
- **Design system completo:** tokens de cor, tipografia (16 classes `.typo-*`), spacing, radius — extraídos das Figma Variables
- **Dark mode:** tokens semânticos configurados via classe `.dark` (sem toggle na UI)

### Componentes

- Layout: Header, Footer, User, UserAvatar, CitySelector
- Agenda: AgendaCard, AgendaBadge, AgendaIndicator, AgendaStats
- Economics: EconomicsCard, EconomicsAnalysis
- Risks: RisksCard
- Resources: ResourcesCard
- Courses: CoursesCard, CoursesCardRow
- Case Studies: CaseStudiesCard
- Formulador: FormuladorCard
- UI primitivos: Button, PillButton, Dropdown, SectionContainer, SectionCard, Grid, ScrollArrowButton
- Compartilhados: SectionHeader, TitleSubtitle
- Mapa: ParaibaMap, ValueBadges, PanoramaLegend, PanoramaMediaInfo

### Infraestrutura

- React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v3
- Testes: Vitest + React Testing Library — 46 testes (smoke + snapshots)
- Deploy estático via Vercel (protótipo)
- Dados em JSON/TS locais (sem API)
- Fonte Inter via Google Fonts
- Lucide React para ícones
