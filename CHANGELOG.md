# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Não lançado]

### Correções

- **Um `threshold` que saiu do seed em junho seguia no banco, classificando 219 dos 223 municípios.** O `trabalhadores-ct` é contagem bruta de vínculos da RAIS e a fonte não publica faixa oficial; por isso `72d8e21` (09/06) removeu a régua inventada de 1000/300 do seed, junto com a do `trabalhadores-tic`. O seed grava o catálogo com `updateOne` + `$set`, e `$set` só toca nos campos que o objeto menciona — tirar `threshold` do objeto fez o seed **parar de falar** do campo, não apagá-lo. Todo reaplicar depois disso confirmou o valor antigo em silêncio, sem erro nem aviso. O `tic` escapou porque nasceu e foi corrigido no mesmo dia, e a faixa dele provavelmente nunca chegou ao Mongo; o `ct` existiu um dia inteiro com ela. Medido: dos 33 indicadores do catálogo, **32 batem exatamente com o seed e só este diverge** — não é falha sistemática do mecanismo, é um resíduo pontual. O efeito passava de cosmético: `selectTopRisks` monta o modo Riscos com os indicadores em `alert`/`warning`, e o item falso entrava no top-3 de **89 municípios**, empurrando um risco verdadeiro para fora em 87 deles.
- **A gravação do catálogo passa a ser `replaceOne`, não `$set`.** O documento no banco vira exatamente o que o seed declara, então campo removido do seed desaparece ao aplicar — sem script de migração avulso, que alguém precisaria lembrar de rodar num banco novo. Conferido que é seguro: só os seeds e as duas migrações escrevem em `indicators`, nada mais acrescenta campo àqueles documentos. A conferência do documento em produção mostrou que `threshold` era o **único** resíduo (9 campos no `ct` contra 8 no `tic`, idênticos no resto), então não há outro campo a recuperar. Por ora só o gerador do `trabalhadores-ct`: os outros 25 têm o mesmo `$set`, mas nenhum deixou resíduo, e trocá-los é prevenção — vai em commit próprio, com o diff conferido.

### Infraestrutura

- **Os outros 25 geradores de seed passam a gravar o catálogo com `replaceOne`.** Nenhum deles deixou resíduo no banco — a conferência dos 33 indicadores achou uma divergência só, já corrigida —, então isto não muda dado: fecha a porta para o próximo campo que alguém remover de um seed. A troca foi aplicada **no texto dos 32 seeds**, não regerando-os: três geradores escrevem `indicador-tempo-viabilidade.mongodb.js` e dois escrevem `indicador-mpe-compras-publicas.mongodb.js`, então rodar todos em sequência faz o último sobrescrever o certo com fonte antiga — chegou a acontecer aqui, com o seed do tempo de viabilidade voltando do Mapa de Empresas em vez do data lake. Conferido que o texto editado é byte a byte o que o gerador emite nessas duas linhas, e o diff dos 32 arquivos é exatamente elas: 64 linhas, nenhum valor tocado. Um gerador (`gerar_seed_mpe_compras_publicas.py`) nem roda offline: o snapshot dele não está versionado em `database/data/`.

## [1.4.0] — 2026-09-05

### Novidades

- **Confirmação antes de descartar o que o gestor escreveu.** Uma varredura atrás de "o que faz o formulário esvaziar" achou nove caminhos, nenhum com aviso. Entrou um `ConfirmProvider` na raiz — um modal só, em promessa (`const ok = await confirm({...})`), montado uma vez em vez de um par estado+modal por botão. Fechar por Escape ou clique fora resolve `false`: o caminho de menor esforço tem de preservar o trabalho.
  - **O aviso é uma vez por sessão** (`options.once`), não a cada clique. Perguntar sempre num botão de uso frequente não protege ninguém: vira o diálogo que se fecha no reflexo, e aí o aviso que importa passa junto. Cancelar não marca nada — quem disse não continua sendo perguntado, porque não concordou. As quatro ações de IA dividem a mesma chave, já que a lição é uma só (a IA substitui, não acrescenta) e aprendê-la num botão vale para os outros; a troca de município tem chave própria, porque aceitar que a IA troque um campo não é aceitar que a tela inteira mude de projeto. A memória vive em `ref`, some ao recarregar a página, e o texto do aviso diz isso.
  - **Os quatro botões de IA que substituem conteúdo** (aprimorar campo, gerar objetivos específicos, sugerir rubricas, gerar indicadores) passam a confirmar — e só quando há o que perder, medido por `filledCount`/`filledBudgetCount`. Esta é a categoria irreversível: os três de lista trocam a lista **inteira** em vez de acrescentar, e o "Desfazer" de cada um vive no estado local da etapa, então sair da etapa e voltar apaga o botão e o texto original de uma vez. O caso das rubricas perde duas coisas ao mesmo tempo, os nomes e os valores em reais, e por isso tem frase própria. As outras superfícies de IA da plataforma (modal do indicador, análise do Panorama, chat da Home, painel `AIAssistant`) não escrevem no formulário — conferido: nenhuma chama `setSlice`.
  - **A troca de município** confirma quando há rascunho na tela. A guarda mora num hook (`useMunicipalityChange`), não nos botões: são **quatro** entradas para o mesmo efeito — a busca de cidade no topo da Home, o mapa da seção de agendas, o seletor da etapa 1 e o mapa do pilar de recursos — e proteger uma deixaria três abertas. Nenhum componente chama `setMunicipality` direto agora. A pergunta vem **antes** da chamada porque o provider é stale-while-revalidate: lá dentro a troca só acontece quando o fetch volta, e nesse ponto já não há como desistir. O texto continua guardado por município, e a frase diz isso.

### Alterado

- **A análise do Panorâma deixa de ser limitada por teto de tokens.** O bloco tinha `max_tokens: 260` para caber sob os cards. Medindo com o prompt real de produção (12 municípios, teto solto em 2000), o modelo escreve entre **182 e 275 tokens** — mediana 198, mas a cauda passa do teto: **Campina Grande, o município default da plataforma, quis 275**. Ou seja, o teto não limitava tamanho, produzia corte no meio da frase em cerca de 1 a cada 10 análises, e ninguém tinha medido. O teto especial sai e fica o default de 800, longe de qualquer amostra. O bloco não ganhou nada em troca: ele já cresce com o texto, e as ~40 palavras de diferença entre a menor e a maior amostra cabem sem empurrar nada da página.
- **A lição por trás disso.** Pedir tamanho no prompt orienta, não garante: para o mesmo pedido de 110 palavras as amostras vieram entre 103 e 150. Teto de token garante, mas a única coisa que ele sabe fazer é truncar no meio da frase. Quem absorve tamanho variável sem perder conteúdo é o layout — e aqui o layout já absorvia, bastou parar de cortar antes dele. O chat também já estava certo: tem rolagem e usa o teto default, quase o triplo do que pede.

### Correções

- **A cadeia de raciocínio do modelo podia sair inteira na tela.** A limpeza usava `content.replace(/<think>[\s\S]*?<\/think>/g, '')`, que só casa par completo. Quando a resposta é interrompida **no meio do raciocínio**, não há tag de fechamento, nada é removido e o rascunho de pensamento aparece para o gestor como se fosse a resposta — e isso acontece justamente quando o modelo se alonga. Agora um `<think>` sem fechamento leva junto tudo o que vem depois dele. Se sobrar vazio (a resposta era só raciocínio truncado), `callOpenRouter` lança, e a UI mostra erro em vez de um balão em branco. `reasoning.enabled: false` continua pedindo isso ao modelo; a defesa existe porque o catálogo `:free` rotaciona e nem todo modelo respeita. Medindo com o modelo atual, em 22 chamadas nenhuma emitiu `<think>` — é rede para a troca de modelo, não conserto de algo em curso.
- **O aparo da frase incompleta foi removido, não corrigido.** Uma resposta truncada era cortada no último `.`/`!`/`?`, e ponto também mora dentro de número: `"O custo é de R$ 3.2"` virava `"O custo é de R$ 3."`, um valor partido exibido como se fosse o valor — reproduzido na primeira truncagem forçada, com João Pessoa terminando em `"e pequeno porte (24."`. A primeira tentativa foi refinar a regra (exigir espaço depois do ponto), e ela consertou os números **e criou uma regressão**: sem espaço depois do ponto, nada mais era cortado. Testando contra frase real de política pública, nenhuma variante acerta `"Lei n. 14.133"`, `"art. 5"` nem o marcador de lista numerada, e todo erro dessa família produz o mesmo dano — um fragmento entregue com cara de frase pronta. Definir onde termina uma frase por expressão regular não tem ponto final, então a função deixou de tentar: a cauda truncada aparece como está. É pior de ler e melhor de confiar, porque parece cortada porque está.
- **Os cards de curso recarregavam o site inteiro, e isso esvaziava o formulador na tela.** `TrainingCard` e `TrainingCardRow` navegavam para `/trilhas#âncora` atribuindo a `window.location.href`, o que é uma recarga de documento, não navegação de SPA. O efeito em cadeia: o `AuthProvider` volta ao estado inicial (desloga) e o `MunicipalityProvider` volta ao município vazio; com o município vazio, o `FormulatorProvider` carrega a chave `formulator:` (sem id) e o formulário aparece em branco. O rascunho não se perdia — continuava salvo sob o id do município anterior — mas quem estava preenchendo via os campos zerarem sem entender por quê. Agora os dois usam `useNavigate`. O destino não muda: `/trilhas` já resolve o hash no cliente (`useLocation` + `scrollIntoView`) e o `ScrollToTop` global ignora rotas com hash de propósito, então a rolagem até a fileira ou o pôster continua igual.
- **Orçamento digitado com ponto virava um valor até mil vezes maior.** `parseBRL` removia **todos** os pontos antes de converter, então `"1000.50"` virava `100050` e `"1.5"` virava `15`. O próprio comentário da função listava `"1000.50"` como forma aceita — a documentação afirmava o contrário do que o código fazia. O campo de rubrica é livre, o gestor digita o que quiser, e o número entra na soma do projeto e sai no PDF: um orçamento de mil reais publicado como cem mil. Agora a leitura tem duas regras: com vírgula presente vale o padrão BR sem ambiguidade (vírgula decimal, ponto de milhar); sem vírgula, um ponto seguido de uma ou duas casas é decimal, porque milhar em pt-BR exige três (`"1.500"`) e ninguém escreve `"1.5"` querendo mil e quinhentos. `"1.500"` e `"1.000.000"` seguem sendo milhar.
- **A "Política pública associada" era preenchível e não saía no PDF.** A etapa 2 do formulador tem quatro campos; a tela de revisão montava três. O gestor escrevia o campo, via na tela do formulário, clicava em Baixar PDF e o texto não estava lá — sem erro, sem aviso, sem sinal de que faltava algo. É o pior tipo de perda: silenciosa e na saída final, que no piloto é o único artefato que sai da plataforma. Nenhum outro campo tem o problema (conferidos os dez blocos de `renderSection` contra os `TextInput`/`AiField` das dez etapas). O bloco vazio continua não sendo renderizado, então quem não preencher o campo não vê diferença.

### Documentação

- **`line-clamp` ganhou entrada própria nas regras de CSS, e ela começa pelo *para quê*.** Os quatro usos do projeto (`AgendaIndicatorItem`, `AgendaExpandable`, `CoursePoster`, `EconomicsCard`) cortam texto para dar **altura uniforme a cartões lado a lado** — dois deles pareiam com `min-h-[Nlh]`, que fixa o mínimo enquanto o clamp fixa o máximo. Não é economia de espaço: é grade que não fica serrilhada. Logo, **fora de grade não se corta** — bloco que ocupa a largura toda e não tem vizinho para alinhar cresce com o texto. Foi exatamente o erro cometido na análise do Panorâma, e é a regra que faltava para não repeti-lo.
- **Junto, a razão técnica de o corte falhar em silêncio.** `-webkit-line-clamp` conta linhas de texto **direto** na caixa; um `<div>` entre a classe e o texto — o que acontece naturalmente ao envolver um componente, como `AiMessage` → `MarkdownLite` → `<p>` — anula o corte sem erro de CSS, sem aviso no console e sem falha de build. Pior: a detecção de transbordo por `scrollHeight` contra `clientHeight` passa a dizer que não há nada escondido, então o sintoma esconde a causa. Por isso os quatro usos põem a classe no próprio `<p>`/`<h4>`; para cortar em volta de um componente, `max-h-*` + `overflow-hidden`, que não depende do aninhamento. E a linha que fecha: **jsdom não calcula layout**, então clamp, overflow e altura não têm teste possível neste projeto — conferem-se no navegador.
- **`CLAUDE.md` corrigido sobre "etapa concluída" do Formulador.** O arquivo dizia que era heurística marcada ao clicar Próxima, sem validar campos. Isso descreve o *em andamento* (`visitedSteps`); o check verde sai de `isStepComplete`, que confere os campos obrigatórios da etapa e alimenta o "X% concluído". E nenhum dos dois afeta o PDF, que imprime todo campo com texto — a doc induzia a procurar perda de conteúdo onde não há.

### Infraestrutura

- **A suíte de testes volta a existir, começando pela régua.** O `vite.config.ts` apontava para um `src/test/setup.ts` que não existia desde o redesign, e o repositório tinha `@testing-library/react` instalado com zero testes. A infra passa a ser **um Vitest na raiz com dois projetos** (`test.projects`): `tests/client` em jsdom, com o `setup.ts` do jest-dom, e `tests/server` em node puro, cobrindo `server/src` e `api/_lib`. Uma pasta `tests/` na raiz em vez de arquivos colocados ao lado do código por dois motivos: o build do servidor emite tudo que está sob `server/src`, então teste colocado ali exigiria um `exclude` só para não ir parar no `dist/`; e uma pasta na raiz é visível na primeira tela do repositório. Sem `globals`: `describe`/`it`/`expect` são importados de `'vitest'` em cada arquivo, porque o `tsconfig.node.json`, que cobre `api/_lib`, só conhece os tipos de node. O `tsc -b` checa os testes junto, cada metade no tsconfig do seu ambiente: `tests/client` e o `setup.ts` entram no `tsconfig.app.json`; `tests/server` entra no `tsconfig.node.json`, porque os testes de costura importam `services.ts`, que puxa `config.ts` e `process`, e o config do app não conhece os tipos de node — de propósito, senão um `process.env` em componente React passaria em silêncio.
- **Primeiro arquivo: `tests/server/status.test.ts`, 14 casos de `computeStatus`.** Os cinco pontos de fronteira de cada régua (`>=` no `higher-better`, `<=` no `lower-better`), o caminho `enum` (único que lê texto, com `trim`, ignorando `numericValue`) e os **dois casos de regressão da reforma de 1.3.1**: IGM `5.008` exibido `"5,01"` contra o corte 5,01 e ISDEL `0.470942` exibido `"0,471"` contra o corte 0,471 — se alguém reintroduzir leitura do `rawValue`, os dois acendem. Um bloco próprio trava a última linha de defesa do `numericValue`: ausente, `null`, `NaN`, `Infinity` e string numérica devolvem `'none'`, sem coerção e sem reconstruir a partir do texto — é a garantia que o schema do Mongo, em `validationAction: 'warn'`, apenas anuncia.
- **`tests/server/services.test.ts`: a costura, 18 casos.** É o bloco que trava a lição de 1.3.1: `pickValue`, `isLowConfidence` e `computeStatus` seguem privadas ou testadas por fora, e o que se fixa é a composição, pelas funções exportadas `buildIndicatorsData` e `buildMapData`. Escolha do ano (`referenceYear` do indicador vence o mais recente; ausente ou inexistente cai no mais recente; **um ano histórico com valor de fronteira não influencia a resposta** — o teste que teria mostrado, sem apuração manual, que as 11 divergências do seed não chegavam à tela); a ordem entre escolha e supressão (ano default fraco não resgata um anterior forte — decisão travada); supressão só para `tempo-abertura`/`tempo-viabilidade`, com `crescimento-mpe` de confiabilidade baixa passando; e a assimetria entre os endpoints, que é deliberada e invisível dentro de cada função: o detalhe mantém o indicador suprimido com `'—'`, o mapa o omite, e o mapa ainda descarta `numericValue` `null`/`NaN`/`undefined` e só conhece indicadores de agenda. A base econômica sai com `rawValue` cru, sem status e sem supressão. Uma fábrica em `tests/server/fixtures.ts` monta o `Catalog` reproduzindo a garantia de `repo.ts`: `byId` e `indicatorsByAgenda` apontam para os mesmos objetos.
- **`tests/client/indicatorBar.test.ts`: a posição do marcador, 21 casos.** Primeira função do frontend coberta, e a escolha não é por importância de tela: `markerFraction` entrou no caminho crítico na mesma reforma de 1.3.1 e **erra em silêncio** — o marcador fica no lugar errado, nenhuma exceção é lançada, e a barra passa a mentir com aparência de precisão. Travados: os dois cortes ancorando em 1/3 e 2/3 nos dois sentidos do eixo (com `toBeCloseTo`, porque `(value - w) / (3 * d) + 1/3` não devolve 2/3 exato em ponto flutuante), a folga de exatamente uma zona-largura em cada ponta antes do clamp, os nove caminhos que devolvem `null` (sem faixa, faixa `enum`, corte ausente, `success === warning`, valor não-numérico) e o zero como valor válido em vez de ausência. Duas asserções de **monotonicidade** sobre uma amostra de dez pontos pegam inversão de sinal melhor que casos pontuais. Um teste isolado documenta o que acontece com faixa incoerente: como `d` é `|s - w|`, a fórmula não percebe cortes trocados e um valor no corte de `success` cai na extremidade ruim da barra — travado como está, porque a régua vive no banco e é o seed que garante a coerência.
- **`sanitizeCompletion` extraída de `callOpenRouter` e exportada, com 12 casos em `tests/server/openrouter.test.ts`.** A limpeza da resposta vivia dentro da função que faz o `fetch`, então testar tratamento de string exigiria simular rede. Extraída, é função pura: recebe o texto, devolve o que vai para a tela. Cobre os pares `<think>` (um, vários), o não fechado, o caso em que sobra vazio e o markdown intacto. Um bloco inteiro trava a decisão de **não** aparar: frase incompleta, número decimal, `"Lei n. 14.133"`, `"art. 5"`, lista numerada e ponto sem espaço depois saem todos inteiros. São os casos em que cada tentativa de regra errava; travados assim, ninguém reintroduz o aparo sem ver o que ele quebra.
- **`tests/client/currency.test.ts`: 22 casos sobre o dinheiro digitado.** Cobre a tabela de leitura (com vírgula, sem vírgula, milhar, negativo), a entrada impossível virando `0` em vez de `NaN`, o total do orçamento com rubrica em branco no meio, e um teste de ida e volta (`parseBRL` → `formatBRL` → `parseBRL`) que trava a coerência entre o que se lê e o que se exibe.
- **`tests/client/formulatorOverwrite.test.ts`: 12 casos nas portas da confirmação.** São elas que decidem quando o aviso aparece: errar para menos esconde o alerta e o gestor perde texto; errar para mais pergunta num formulário em branco e vira ruído que se aprende a ignorar. `hasAnyContent` percorre a estrutura em vez de listar campo a campo, então etapa ou campo novo passa a contar sozinho — e `visitedSteps` fica de fora, porque passar pelas etapas não é preencher.
- **`tests/client/ConfirmProvider.test.tsx`: 4 casos, e o primeiro teste de componente do projeto.** A regra do "uma vez por sessão" falha em silêncio nos dois sentidos — grudando cedo demais o aviso nunca aparece, não grudando ele volta a cada clique — e nenhum dos dois dá erro na tela. Cobre: pergunta na primeira vez e não na segunda; cancelar não marca nada; Escape responde `não`; sem `once`, pergunta sempre. Usa `fireEvent` em vez de `user-event`, que não é dependência do projeto e não faria falta aqui.
- **`tests/client/ui.test.tsx`: 17 casos nos primitivos de UI, e só comportamento.** Componente de apresentação testado por render quebra a cada mudança de classe sem pegar defeito, então o que se trava aqui é o que a pessoa faz: o `Modal` fecha por Escape, por clique no backdrop e pelo X, **não** fecha por clique dentro do painel (conferido por mutação — tirar a comparação `e.target === e.currentTarget` derruba o caso), não fecha por outra tecla, não escuta nada enquanto fechado, e devolve o `overflow` do `body` ao desmontar. O `useDismiss` é compartilhado por Modal, Tooltip, ChatPanel e Dropdown, então o caso do Escape protege quatro superfícies de uma vez. Os quatro botões da família (`Button`, `Chip`, `IconButton`, `PillButton`) não disparam `onClick` quando `disabled`. E um bloco próprio trava a exceção à regra de não testar classe: o anel de foco vive em `buttonBaseClass`, é `outline` e não `ring` de propósito (box-shadow some em alto contraste forçado), e um teste confere que a constante declara o anel e que ele chega inteiro ao `Button` e ao `IconButton` — a acessibilidade de toda a UI de botões numa asserção só. O `PillButton` monta a sua própria shell e por isso é conferido à parte.
- **`tests/server/emendas.test.ts`: 19 casos na cobertura municipal e nas assimetrias das duas esferas.** A cobertura é decisão metodológica que vira número publicado, e a regra é assimétrica de propósito: o **federal** mede sobre `pago` (atribuição exata por código IBGE, interessa o executado), o **estadual** sobre `valor` (atribui-se a emenda inteira a partir do texto livre, e medir por `pago` subestimaria as não executadas). Trocar a base não quebra nada — só publica outro número, e é o tipo de regra que ninguém lembra em seis meses. Os fixtures escolhem valores em que cada base dá resultado diferente (federal 0,6 por `pago` contra 0,9 por `empenhado`; estadual 0,6 por `valor` contra 0,8 por `pago`), então a troca aparece como falha: conferido por mutação, fixar a base em `pago` derruba dois casos. Travados também o total do estado zerado (devolve `0`, não `NaN`), o arredondamento em 4 casas, `naoMunicipalizado` ausente virando cobertura 1, a esfera sem documento de estado sendo pulada em vez de quebrar, o `valor` que só o estadual emite (nos dois níveis), e a assimetria do zero — estadual todo zerado vira `null` porque significa "não atribuímos", federal zerado continua `0` porque lá é censo. Mais a ordem canônica por código IBGE, que o contrato promete e o sort do Mongo não daria.
- **`tests/client/formulatorCompleteness.test.ts`: 17 casos na régua de "etapa concluída".** É ela que acende o check na sidebar e move o "X% concluído" — errar para mais é o lado perigoso, porque o gestor fecha o formulário achando que terminou. Travados: as dez etapas em branco (nenhuma conclui), as dez com seu preenchimento mínimo (todas concluem), o isolamento entre elas, o slug desconhecido, os campos só com espaço, e os casos que a leitura do código não entrega de imediato — a política pública **não** é obrigatória para a justificativa, objetivo geral sem nenhum específico não conclui, os três grupos de indicadores são exigidos juntos, e no orçamento o nome e o valor precisam estar na **mesma** linha (rubrica nomeada numa e valor noutra não conclui). Um caso separa os dois estados que a sidebar mostra: visitar as dez etapas deixa `countCompletedSteps` em zero, porque passar não é preencher.
- **A limpeza do Testing Library é registrada à mão em `tests/setup.ts`.** Ela só se instala sozinha com `globals: true`, e o projeto importa `describe`/`it`/`expect` explicitamente. Sem o `afterEach(cleanup)`, o DOM de um teste sobrevive no seguinte e a busca falha com "multiple elements found" — sintoma que se lê como bug do componente, não da configuração. Custou uma rodada vermelha para descobrir.
- **`server/tsconfig.json` com `include: ["src"]`.** Os itens `../api/_lib` e `../src/types/ai.ts` eram redundantes: entram pela cadeia de imports (`routes.ts` → `handler.ts` → `types/ai.ts`), e `tsc --listFilesOnly` devolve os mesmos 13 arquivos sem eles.

## [1.3.1] — 2026-09-05

### Correções

- **O semáforo classificava o texto, não o número.** O ETL calcula um float por município e grava dois campos derivados dele: `numericValue`, o número na precisão da fonte, e `rawValue`, a string de exibição em padrão BR, arredondada. A API classificava pelo `rawValue`, reconstituindo um número a partir da string com um heurístico de formato brasileiro — e o `numericValue`, presente em 100% dos documentos, estava declarado em `IndicatorValueDoc` sem uma única leitura no código. O problema não é o heurístico: é que os cortes oficiais discriminam justamente na casa decimal que o arredondamento da exibição come. IGM 5,008 vira `"5,01"` e o corte do CFA é 5,01; ISDEL 0,470942 vira `"0,471"` e o corte é 0,471. `computeStatus` passa a receber o documento e ler `numericValue`; o caminho `enum` segue lendo o texto, que lá é o dado certo (a faixa é um mapa de rótulos).
- **Nenhum semáforo servido muda hoje — a correção é estrutural.** Vale registrar a medida, porque a primeira apuração foi feita sobre as linhas cruas dos seeds e apontou 11 municípios. Comparando o que a API de fato emite, o número é zero: dos 11 pares município×ano divergentes no banco, 10 estão em anos históricos que `pickValue` nunca retorna (o cliente recebe só o ano de referência default do indicador) e o 11º — 2512762 em `tempo-viabilidade` — já era suprimido por `isLowConfidence`, com `n = 1` no ano. O que a correção remove é a classe de erro, não um sintoma em tela: ela reaparece a cada avanço do ano default (as divergências do `igm-cfa` estão em 2018, 2021 e 2023, e valores de fronteira voltam a cada edição), quando um município de baixa amostra ganha volume, ou se a série histórica passar a ser exibida. **Impacto de mudança em indicador se afere pela saída do endpoint, não pelas linhas do seed** — os dois filtros rodam antes da classificação.
- **`parseNumeric` foi removido em vez de corrigido.** Ele tinha um bug real — `"0.763"` virava 763, porque três dígitos depois do ponto eram lidos como grupo de milhar — mas latente: dos 12.934 valores do banco, nenhum tem a forma que o dispara. Corrigi-lo não mudaria nenhum semáforo hoje, e mantê-lo como *fallback* preservaria o mecanismo que escondeu o problema: na ausência do número, a API voltaria a adivinhar a partir do texto sem emitir um som. Ausência agora é `'none'` — a mesma postura que o projeto já adota para indicador sem documento, faixa ausente e coleção `emendas` vazia (503, nunca payload zerado). Com isso `server/src/status.ts` cai de 64 para 43 linhas.
- **`/api/municipalities/:id` passa a emitir `numericValue`** junto de `value` em cada indicador de agenda. O `buildMapData`, que anunciava um `numericValue` reconstruído do texto, agora repassa o do banco.
- **`numericValue` virou obrigatório no schema da coleção `indicatorValues`** (`database/setup.mongodb.js`). O campo já era gravado pelos 26 scripts do ETL e existe em 100% dos documentos — a consulta `countDocuments({ numericValue: { $exists: false } })` devolve 0 —, mas o validador não o exigia, e essa folga era o único argumento que restava para manter um *fallback* de parsing no servidor. `null` segue válido pelo `bsonType` e significa "sem medida"; o `required` passa a cobrar a presença da chave. Como todo o `setup.mongodb.js` usa `validationAction: 'warn'`, o validador **registra aviso em vez de rejeitar** — ele documenta e denuncia o contrato, não o impõe. A garantia dura vem do código: sem `parseNumeric`, a ausência do campo não tem para onde degradar, vira `'none'` e aparece na tela como indicador sem semáforo.
- **O marcador da `IndicatorBar` também parava de adivinhar.** `src/utils/indicatorBar.ts` carregava uma cópia **byte a byte idêntica** do heurístico do servidor — `parseIndicatorValue`, 26 linhas — para reconstituir da string de exibição o número que posiciona o marcador. Heurística duplicada em duas camadas da stack era o rastro de um dado que nunca tinha sido propagado. Agora `Indicator` traz `numericValue` da API, `markerFraction` recebe o número, e o parser sai. `value` continua existindo, com o papel que sempre foi o dele: o texto na tela.

### Infraestrutura

- **Dependências atualizadas: 21 vulnerabilidades caíram para 5.** O build no servidor Sebrae vinha acompanhado de um aviso de `npm audit` que ninguém tinha lido até o fim. Lido, ele se separava em três grupos: a árvore do `@vercel/node`, o toolchain de build e uma única dependência de runtime. Só a terceira podia chegar ao usuário — `react-router` 7.14.0, pelo `turbo-stream` vendorizado (invocação arbitrária de construtor). Não era explorável aqui: o app usa `<BrowserRouter>` declarativo, sem *data routers*, *loaders* nem SSR, que é o caminho por onde o `turbo-stream` entra — conferido no artefato, zero ocorrências dele no bundle. Ainda assim subiu para 7.18.3, junto de `vite` 8.0.7→8.2.2 (o que traz `rolldown` de `1.0.0-rc.13` para `1.2.7`), `postcss` 8.5.9→8.5.28, `nanoid`, `tar`, `js-yaml`, `undici` e o resto do toolchain. Tudo dentro dos ranges do `package.json`, que não mudou: apenas o `package-lock.json`. Build e lint conferidos — 1855 módulos, bundle igual (753,81 kB).
- **As 5 vulnerabilidades restantes ficam de propósito.** Todas moram na subárvore do `@vercel/node` (`ajv`, `path-to-regexp`, `undici` fixado numa major antiga) — uma devDependency que existe só pelo `import type` em `api/ai.ts`, o transporte da Vercel, que **nesta branch não é usado**: quem atende `POST /api/ai` no servidor Sebrae é o Fastify. O `npm audit fix --force` as resolveria oferecendo `@vercel/node@3.0.1` — um *downgrade* de duas majors. Não rodar.
- **O `server/` tem árvore de dependências própria, e ela não estava sendo auditada.** As auditorias cobriam só a raiz; o `npm audit` do `server/` apontava 3 vulnerabilidades — e ao contrário das 5 da raiz, todas sob `@vercel/node`, estas eram dependências de runtime do processo exposto: `fastify` 5.10.0, seu roteador `find-my-way` e seu parser `fast-uri`. Nenhuma tinha precondição satisfeita na configuração atual — `trustProxy` não é setado, HTTP/2 não é habilitado (o Nginx termina e repassa HTTP/1.1) e nenhuma das 6 rotas declara `schema`. Corrigidas mesmo assim, sem quebra: `fastify` 5.12.3, `find-my-way` 9.9.0, `fast-uri` 3.1.7, com o `package.json` intocado. O `trustProxy` é justamente o tipo de flag que se liga depois atrás de um proxy reverso, e aí a precondição passa a existir. `server/` fica em 0 vulnerabilidades.
- **`caniuse-lite` atualizado** (`1.0.30001786` → `1.0.30001810`). O aviso de "browsers data is 6 months old" em todo build era isso; a base define quais prefixos o autoprefixer emite.

## [1.3.0] — 2026-09-05

### Novidades

- **Tema claro/escuro com controle no topo da página (`ThemeToggle` + `useTheme`).** Até aqui a aplicação era escura por decreto: `class="dark"` fixa no `<html>`, sem nenhum caminho para o tema claro — que existia em token, nunca em tela. O controle cicla **automático → claro → escuro**. Ele nasceu no cabeçalho do `SideNav` e **mudou de casa ainda nesta versão**: a `SideNav` só existe na segunda seção da Home, então trocar de tema exigia rolar até lá — e no login e em `/trilhas` não havia como. Agora é montado no `Layout`, fixo no topo à direita, e portanto existe em todas as rotas. Fica no mesmo eixo vertical do `ChatButton` (`right-[62px]`, `z-40`): os dois controles globais e persistentes ocupam a mesma faixa à direita, um em cada extremidade, com a mesma pílula de vidro do `CitySelector` para se lerem como a mesma camada de chrome. É **instância única** de propósito — `useTheme` é estado local e dois consumidores montados teriam preferências independentes —, e não virou `<header>`: um landmark `banner` por causa de um botão custaria ao `<main>` o posto de único landmark do documento. O estado `automático` é o default e não é um valor guardado: é a *ausência* da chave no `localStorage`, o que faz o default de quem nunca escolheu e o de quem voltou ao automático serem o mesmo estado. Ele também não congela o que o sistema dizia no boot — um listener de `matchMedia` mantém a página acompanhando o SO se ele trocar no meio da sessão (agendamento noturno, por exemplo); nos modos manuais o listener nem é registrado. Um script inline no `<head>` aplica a classe antes do primeiro paint, senão o tema errado aparece por um frame. O tema segue morando inteiramente no CSS: nenhum componente ganhou variante `dark:`, o efeito do hook é uma classe no `<html>` e só.
- **A marca do tema escuro virou camada de primitivas.** O bloco `.dark` carregava oito hex crus (`#161726`, `#1A1C31`, `#2C335D`, `#D4FE07`, `#40E629`, `#F5E421`, `#F14635`) e dois `theme(colors.slate.*)` sem aspas — a cadeia primitiva → semântica, que no tema claro é rigorosa, simplesmente não existia no escuro. As cores ganharam nome (`--primitives-navy-900/800/600`, `--primitives-lime-400`, `--primitives-green-400`, `--primitives-yellow-400`, `--primitives-red-400`) e o `.dark` passou a referenciá-las. Agora o único lugar do projeto onde hex é legítimo é a declaração das primitivas — e está dito em comentário lá. `--primitives-blue-500`, que valia `blue.600`, foi renomeada para `--primitives-blue-600`: primitiva cujo nome mente sobre o valor é pior que primitiva ausente.
- **Regra de lint contra cor em arbitrary value.** As convenções de token eram acordo de cavalheiros: nada no `npm run lint` impedia um `text-[color:var(--semantic-accent)]` de voltar. Entrou um `no-restricted-syntax` de escopo estreito, que pega dois padrões em literais de classe — `[…var(--semantic|--primitives…)]` e hex cru (`bg-[#161726]`) — e deixa passar o que é legítimo: arbitrary de dimensão (`w-[56px]`) e `var()` dentro de gradiente ou `color-mix` em `style` inline. Preferida a `eslint-plugin-tailwindcss`, cuja regra de arbitrary values é ampla demais e condenaria os dois casos legítimos acima. Na primeira execução a regra já encontrou o que a varredura manual não tinha achado (ver `button-styles.ts` nas correções).
- **Cobertura de tokens no `tailwind.config.js`.** O config expunha 11 utilitários de cor para 26 tokens semânticos, e o buraco explica os ~30 valores arbitrários espalhados pelos componentes: sem `text-primary`, `bg-surface-tertiary` ou `border-alert`, escrever `text-[color:var(--semantic-text-primary)]` era a única saída. Foram mapeados os tokens de texto (`primary`, `on-accent`, status), de fundo (`background`, `surface-tertiary`, `accent-hover`, `accent-surface`, surfaces de status, os três de botão) e de borda (`surface-secondary`, `surface-tertiary`, `text-primary`, status). Os pares de *label* de botão aparecem também como fundo, para o `PillButton` poder inverter bg e texto no círculo da seta usando classes nativas em vez de arbitrários.
- **`/trilhas` virou catálogo.** O pedido do cliente era "lembrar um catálogo estilo Netflix". Copiar a *casca* da Netflix não era opção: o acervo não tem imagem de curso nenhuma, e pôster sem arte vira caixa cinza. Então a página adota o **modelo de navegação** (billboard, fileiras que sangram até a borda, setas nas bordas, pôster que se revela no hover) e tira a identidade do único eixo numérico real dos dados — a **carga horária**. O acento lime do tema entra no lugar do vermelho da Netflix. Substituiu a lista de carrosséis com cards landscape de 393×241 e botão "ver curso".
  - **A carga horária é a arte do pôster** (`CoursePoster`). O numeral em Monoblock ocupa o lugar da capa, e um medidor de 4px no pé mede o curso contra o **mais pesado da própria trilha** — a fileira inteira passa a ser lida como um perfil de esforço (de 2h a 129h) antes de qualquer título. O pôster inteiro é o alvo do clique; o destino ("Escola Virtual do Governo ↗") aparece na intenção, não o tempo todo. Curso sem `url` não vira link: fica no acervo, esmaecido e rotulado, em vez de um botão morto.
  - **Billboard de abertura** (`CatalogBillboard`) com a ficha do acervo — 4 trilhas · 35 cursos · 869 horas — derivada de `catalogLoad`, não digitada, então não tem como divergir das fileiras abaixo.
  - **Fileiras full-bleed** (`CatalogRow`). Diferente do `Carousel` genérico (que segue intocado no Home e nos Casos de sucesso) em dois pontos: as setas ficam **sobrepostas às bordas** e aparecem no hover/foco em vez de empilhadas abaixo, e desabilitam nas pontas. O trilho continua rolável por teclado e trackpad com as setas escondidas. As fileiras sangram até a borda da tela — o corte no fim é o que sinaliza "tem mais".
  - **Barra de eixos fixa** (`TrailNav`), navegação e não filtro: clicar salta para a fileira, e a trilha visível se marca sozinha por `IntersectionObserver`. Filtrar esconderia acervo, e num catálogo a abundância é parte da mensagem.
  - **Sem numeração 01/02/03.** Os quatro eixos não são uma sequência, então a sobrancelha de cada fileira carrega o que de fato qualifica o acervo (`8 cursos · 320 horas · Escola Virtual do Governo`) em vez de um ordinal decorativo.
  - Os deep links do Home (`/trilhas#trilha-{slug}` e `/trilhas#curso-{slug}-{idx}`) continuam valendo, com o destaque agora no anel de acento do pôster.

- **`Chip` no design system (`src/components/ui/buttons/Chip.tsx`).** Controle selecionável — pill com estado de repouso/selecionado — **visualmente idêntico ao `Button`**, porque compartilha shell, variantes e tamanhos com ele pelo `button-styles.ts`: mudar o Button muda o Chip junto, por construção e não por cópia mantida à mão. Para isso, `sizeStyles` saiu de dentro do `Button` e virou `buttonSizeStyles` exportado, com os tipos `ButtonSize`/`ButtonSizeStyle`. O que justifica o componente próprio não é o visual e sim a API: no `Button` o estado vem de uma `variant` escolhida na chamada; no `Chip` vem de **dados** (`selected`), e o controle **anuncia essa seleção** via `aria-current` (navegação) ou `aria-pressed` (liga/desliga) — o `Button` não faz isso por não repassar `aria-*`. Primeiro consumidor: a `TrailNav`, cujo markup cru de 14 linhas virou 6. Não substitui o `ModeToggle`, que é outro membro da família (troca de painel no lugar, com `role="tablist"` e pill deslizante).
- **Tokens de foco no `tailwind.config.js`: `ringColor.accent` e `ringOffsetColor` (`background`/`surface`).** Sem o offset tokenizado o Tailwind usa **branco** por default, e todo botão da aplicação desenhava um halo claro em volta de si ao receber foco de teclado no dark (verificado: `--tw-ring-offset-color: #fff` no `PillButton`). O `buttonBaseClass` passou a declarar `ring-offset-background`, então a correção vale para toda a família `Button`/`IconButton`/`Chip` de uma vez.

### Documentação

- **Avaliação de Storybook (`docs/avaliacao-storybook.md`).** Veredito: viável e o projeto está bem posicionado — os 17 primitivos de `ui/` não consomem contexto, e as variantes já são enumeráveis e exportadas —, mas **não urgente**, porque o saneamento desta versão resolveu por outros meios a dor que motivaria a adoção (paridade de tema auditável por diff, contraste medido, regra de lint). O documento registra o que o setup exigiria sem falha (importar o `index.css` no preview, senão as classes compostas somem em silêncio; filtrar o plugin `/api/ai` e o proxy do `vite.config.ts`; fixtures capturadas da API para as stories de feature), o risco do Vite 8 ainda recente sob o Rolldown, o custo por etapa e a recomendação de adotar quando houver trabalho de UI em lote, não antes.

- **Os dois READMEs e o `CLAUDE.md` reescritos para o estado real do projeto.** O README da raiz não era tocado desde 08/07 (antes do 1.2.0) e descrevia um projeto que não existe mais: listava a rota `/oportunidades`, as páginas `Opportunities`/`Community`, o modo Editais e o `/trilhas` como carrossel — tudo removido ou substituído —, dizia que "o frontend não precisa de variáveis de ambiente" quando precisa da `OPENROUTER_API_KEY` em dev, e não mencionava IA, emendas, chat nem a pasta `api/`. O `CLAUDE.md` ainda anunciava "dark mode por tokens, sem toggle na UI" e a rota `/oportunidades`. Os dois passam a cobrir tema claro/escuro, as três camadas de cor, a regra de lint, o catálogo `/trilhas` e as armadilhas novas; a árvore de `src/` volta a bater com o disco. Correção de fato nos dois: diziam "em produção no servidor Sebrae" — o servidor recebe o deploy, mas **ainda não há produção** aberta a usuário final.
- **`database/README.md`: emendas e os 33 indicadores.** O arquivo cobria 19 dos 38 seeds e não citava emendas em lugar nenhum, apesar dos dois seeds, dos dois geradores e da coleção `emendas` existirem — quem montasse o banco pela lista terminava com um banco parcial, sem erro nenhum. Também afirmava "4 coleções" (são 5) e conferia contagens de uma carga antiga (12 indicadores / 8.251 valores; hoje 33 / 12.934). Passa a listar os 38 seeds agrupados por agenda e base econômica, marcando os 6 que têm `threshold`, e ganha o schema da coleção `emendas` com as duas armadilhas que só o validador registrava (o eixo de `porAno` muda por esfera; zero federal é zero, ausência estadual é `null`), e a operação dos dois ETLs de emendas com o limite do método estadual.

### Removidos

- **Dezenove primitivas de cor sem nenhum consumidor, e quatro tokens semânticos idem.** Saíram `gray-300/400/700/900`, `blue-200/900`, `green-200/800/900`, `yellow-200/800/900`, `red-200/800/900` e `lime-100/200/600` — metade da camada primitiva era escada de tons que ninguém subiu. Junto foram `--semantic-main`, `--semantic-secondary`, `--semantic-tertiary` e `--semantic-info-text-info`, restos de uma nomenclatura anterior à de `background`/`surface`/`accent`. Cada remoção foi conferida por grep incluindo `api/`, que importa de `src/`.
- **Carregamento morto da fonte Inter.** O `index.html` baixava quatro pesos da Inter do Google Fonts, mas nenhuma família de token a referencia (`--font-headings/titles/display/body` são Monoblock, Epic Pro e Intel One Mono) — a fonte era baixada e nunca usada. Os `preconnect` ficam: continuam servindo o `@import` do Intel One Mono no `index.css`.

- **Páginas `/oportunidades` e `/comunidade`, e o modo Editais.** As duas páginas eram **o mesmo arquivo** — diferiam só no nome da função — e a `Community` sequer estava roteada. Saem: `pages/Opportunities.tsx`, `pages/Community.tsx`, a rota e o import no `App.tsx`, `components/resources/ModeEditais.tsx`, a entrada comentada de Editais no registry do `SectionJornada`, e as chaves `sectionContent.opportunities` / `.community` e `resourcesContent.editais` / `.buttons.verOportunidades`. Junto morre o parser hand-rolled de `<highlight>` via `dangerouslySetInnerHTML` que as duas páginas duplicavam — e com ele um bug silencioso: o HTML injetado aplicava `var(--typo-weight-bold)`, **token que nunca existiu no projeto**, então o negrito do trecho destacado nunca funcionou.
- **Componentes órfãos (zero consumidores).** `ui/HoverOverlay.tsx`, `resources/ResourcesCard.tsx` e `agenda/AgendaBadge.tsx`. O `AgendaBadge` era o caso notável: um badge de status genérico (superfície + dot + valor) que nasceu em `agenda/` em vez de `ui/` e morreu sem uso — o `Badge` que o design system não tem. `statusStyles` segue vivo, usado por outros quatro componentes de agenda.
- **`resourcesContent.distribuicao`.** Dados do mapa em PNG que o mapa real de emendas substituiu; o `overlayLabel` existia só para o `HoverOverlay`, removido acima.

- **Varredura de código morto.** Levantamento por script de todo export sem consumidor, com o escopo de referência incluindo `api/` — sem isso `AI_FIELD_IDS` e os tipos de IA apareciam como mortos, quando na verdade o handler serverless os importa. Removidos, depois de verificar um a um: os componentes `ui/Grid`, `agenda/AgendaStats` e o hook `formulator/useFormulatorAi` (nenhum importado — só citados em comentários); o ícone `UserAvatar` e os re-exports `Building2`, `ChevronUp`, `DollarSign`, `Search`, `TrendingUp` e `Users`; os valores `statusLabelsPanorama` e `totalPago`; o tipo `MunicipalityValues`; e o `export` de `parseIndicatorValue`, que só é usado dentro do próprio módulo. Em `sectionContent` saíram seis chaves sem consumidor — `agendas`, `resources`, `panorama`, `economicBase`, `risks` e `training`: cabeçalhos de seção que o redesign dispensou quando o rótulo do `ModeToggle` passou a carregar o título. Com `agendas` foi embora o último `<highlight>`, marcação de um design antigo que desde a remoção das páginas placeholder não tinha mais nenhum renderizador no projeto — uma armadilha passiva, já que plugar aquela string num `TitleSubtitle` mostraria as tags literais na tela. A varredura foi repetida até o ponto fixo: a segunda rodada pegou a cascata (`EmendaMunicipio` ficou órfão ao sair o `totalPago`) e a terceira não achou mais nada.
- **Comentário que mentia sobre o comportamento (`AIAssistant`).** O cabeçalho dizia que as ações do painel "disparam gerações reais via `useFormulatorAi`", mas os botões de ação saíram num refactor anterior e o hook estava morto. O painel hoje é só leitura — a geração acontece nos campos (`AiField`) e nas etapas 7 e 8.

- **Foco de teclado unificado em `outline` (item D do mapeamento).** O projeto tinha dois vocabulários convivendo: `ring` (box-shadow) na família `Button`/`PillButton` e `outline` no `JourneyDivider` e no catálogo. Padronizamos em `outline`, e não por gosto: `box-shadow` **desaparece em modo de alto contraste forçado** (`forced-colors`), onde `outline` é preservado — um anel de foco que some justamente para quem mais depende dele não serve. Além disso o gap do `outline-offset` é transparente, então funciona sobre qualquer fundo, enquanto o `ring-offset` precisa saber se o controle está sobre o `background` ou sobre uma `surface` para não desenhar uma faixa da cor errada. Com isso saem os tokens `ringColor`/`ringOffsetColor` adicionados na versão anterior — a direção certa era a oposta. `JourneyDivider` de quebra troca o valor arbitrário `outline-[color:var(--semantic-accent)]` pela classe `outline-accent`.
- **FAB do chat: sem indicador de foco, cor fora do token e hover herdado do light mode.** O `ChatButton` não tinha **nenhuma** regra de `focus-visible` — era inalcançável visualmente por teclado. Também usava `text-black` cru em vez de `--semantic-button-label-primary`. E o hover apontava para `--semantic-accent-hover`, **token que a passada do dark mode esqueceu de redefinir**: caía no `blue-800` do `:root`, então o botão lime ficava azul escuro ao passar o mouse. O token agora existe no `.dark` (`lime-500`), e como o FAB era seu único consumidor, o efeito ficou contido nele.

- **Ponto de status com um tamanho só (`--size-status-dot`).** O semáforo era 8px no modal do indicador e **7px** no card de risco — dois lugares que nunca aparecem lado a lado, então a divergência passou despercebida. O valor virou token e foi aplicado **dentro** das classes `.status-*-dot` e `.risk-card__dot`, junto com o raio e o `flex-shrink`: o consumidor não precisa mais declarar dimensão, e por isso não pode mais divergir. De quebra, `statusStyles` perdeu a propriedade `bg` (o `Card` referencia as classes `status-*-bg` direto no seu próprio `surfaceClass`, então a cópia não tinha leitor) e o `IndicatorModal` passou a consumir `statusStyles[status].dot` em vez de reimplementar o mesmo mapeamento num helper local.

### Correções

- **O traço da borda vira `--border-default` — e volta para 1px, porque 0,5px não sobrevive ao Chromium.** O valor estava hardcoded em dois lugares em linguagens diferentes: `borderWidth.DEFAULT` no `tailwind.config.js` (a classe `border`) e o `padding` do `.glass::before`, que recorta o stroke diagonal do vidro pela máscara. Os dois precisam concordar, senão a borda de um card e a aresta de um painel glass, lado a lado na mesma tela, saem com espessuras diferentes — é a mesma espécie do `--size-status-dot`, e pior num ponto: aquele divergiu entre duas declarações CSS, que um diff mostraria juntas; este tem um lado em JS e outro em CSS, então nem o diff pega.

  Tokenizados, a verificação em navegador mostrou que **compartilhar o valor não bastava**: `border-width: 0.5px` resolve como 0,5px no WebKit mas é arredondado para 1px no Chromium, em qualquer DPR, enquanto o `padding` do `::before` fica 0,5px nos dois motores. Com 0,5px, portanto, a borda do card pintava o dobro da aresta do painel glass no Chrome e batia certo no Safari — o mesmo token, dois renders. O valor volta a **1px**, em que os dois consumidores pintam igual em todo motor, que era o ponto de dividirem o token. Isso desfaz a mudança para 0,5px anunciada mais abaixo nesta mesma versão (nada disso chegou a ser lançado); a medição fica registrada no bloco BORDER do `index.css`, com o aviso de não voltar a 0,5px sem medir nos dois motores.

- **Quatro comentários descreviam uma rota `/new` que não existe — e dois deles geravam CSS morto.** `SectionAgendas` e `AgendaList` diziam que o container esquerdo era `rounded-[25px]`; `ModeToggle` se apresentava como um toggle "Meu município / Território" sobre o mapa (hoje é o tablist que troca os modos de cada pilar, consumido pela `SectionJornada` e pelo `ModeResources`); `AgendaCard` também citava a `/new`. Todos reescritos para o que os arquivos fazem. O detalhe que eleva isso de dívida de documentação a defeito: o Tailwind varre os fontes por regex e **não sabe o que é comentário**, então aqueles dois `rounded-[25px]` produziam uma regra `.rounded-\[25px\]{border-radius:25px}` de verdade no bundle — verificado antes e depois no CSS gerado.

- **A escala de raio passa a ter três valores com três papéis, e o de superfície perde o nome de tamanho.** Depois que md/lg/xl saíram por falta de consumidor, sobrou um raio de superfície só — e `rounded-sm` continuava nomeando uma posição numa escala que não existe mais. Ele vira o **DEFAULT** do Tailwind (classe `rounded`, sem sufixo) e o token vira `--radius-default`, de modo que token e classe passem a ter o mesmo nome; as 19 ocorrências migraram. Nasce `--radius-xs` (2px) para os dois `rounded-[2px]` que estavam escritos à mão no chip de ícone decorativo e no marcador da régua de indicador — pelo mesmo motivo do `--size-status-dot`: os dois ainda concordam, e o momento de tokenizar é antes de divergirem. Fica `rounded` (superfície), `rounded-xs` (micro-elemento) e `rounded-full` (círculo).

  Duas armadilhas encontradas no caminho, ambas silenciosas: renomear o token deixou três `var(--radius-sm)` órfãos no próprio `index.css` — incluindo `.card-surface`, o raio de todo `Card` —, e `var()` indefinida não é erro de CSS, o `border-radius` só cai para 0. E remover a chave `sm` do `tailwind.config.js` sem migrar as classes não daria erro nenhum: `rounded-sm` cairia no default do Tailwind, 2px. Nenhuma das duas aparece em `lint`, `tsc` ou `build` — o que pega é conferir o CSS gerado, e é assim que se confere.

- **Os dois raios órfãos dos painéis `glass` voltam ao `rounded-sm`.** Um inventário dos 17 elementos que escrevem o shell `glass` à mão mostrou que a divergência era menor do que parecia: separados por papel, os `rounded-full` são todos de controles (ModeToggle, CitySelector, o pill do JourneyDivider, a variante `secondary` do `button-styles.ts`), onde a forma é correta. Dentro do papel de **painel de conteúdo**, `rounded-sm` já cobria 10 de 12 — desviavam só os cards de pilar do Hero (`rounded-lg`, 32px) e o card de risco (`rounded-md`, 24px), ambos agora alinhados em 12px. Os paddings que também desviam (`p-lg` no card de risco e no painel de casos de sucesso) **ficam como estão**: são escolha de composição, não acidente. Verificado nos dois temas — o traço diagonal do `.glass` e o glow do `.risk-card`, que é recortado por `overflow: hidden`, acompanham o raio novo sem artefato. Efeito colateral a registrar: `rounded-lg` fica sem nenhum consumidor no projeto, e `--radius-xl` já não tinha.

- **O passo das setas do `Carousel` era uma constante que envelheceu em silêncio.** Cada consumidor declarava o seu (`SCROLL_AMOUNT`), com o comentário dizendo a largura do card: `480 + 12` em `ModeTraining`, `350 + 12` em `ModeCaseStudies`. Só que os cards viraram percentuais em algum ponto — `w-[40%]` e `w-[32%]` — e medem, na coluna do painel a 1440px, 325px e 235px. O passo andava 1,46 card, o `snap-mandatory` corrigia para o ponto mais próximo, e o avanço oscilava entre um e dois cards conforme a posição em que o trilho estava. O `Carousel` passa a medir o primeiro card e o `columnGap` no momento do clique: um card por clique, sempre. A prop `scrollAmount` sai junto — largura declarada não sobrevive a card fluido. Medido nos dois modos depois da correção: passo de 329px onde o card+gap é 337 (a diferença são os 8px de `scroll-padding-inline`, que são de propósito) e clamp correto no fim do trilho.

- **A lista de indicadores da agenda estava copiada entre o card flutuante e o modo Eixos.** `AgendaCard` e `AgendaIndicatorItem` traziam o mesmo `map` com `pb-xs` na penúltima linha e o `<hr>` tracejado — o segundo com um comentário admitindo "mesmo tratamento do AgendaCard flutuante". Vira `AgendaIndicatorList`; a casca (título, borda, descrição, recolher/expandir) continua sendo de cada um, que é o que de fato os diferencia. A extração **preserva** a divergência que existia: no modo Eixos o label não abre o modal "IA", só no card flutuante — antes era omissão silenciosa da cópia, agora é uma prop ausente com comentário dizendo por quê. Vale decidir se é intencional.

- **Escape e clique-fora eram quatro implementações, cada uma com um pedaço do comportamento.** `Modal`, `Tooltip`, `ChatPanel` e `useDropdownState` registravam seus próprios listeners — o `Modal` com um comentário dizendo que herdara o padrão do `Tooltip` —, e o subconjunto coberto por cada um era acidente de qual cópia se pegou: só o Modal travava o scroll do body, só Tooltip e Dropdown ouviam `mousedown` fora, o ChatPanel não fazia nem uma coisa nem outra. Nasce `hooks/useDismiss` (`escape`, `outsideRef`, `lockScroll`), e o subconjunto vira escolha declarada na chamada. Duas mudanças de comportamento, ambas na direção de cobrir o que faltava: o **dropdown agora fecha com Escape** (`Dropdown` e `CitySelector`; nenhum dos dois vive dentro de um modal, então não há dispensa em cascata), e o listener de clique-fora dele passa a ser registrado só enquanto aberto, em vez de permanentemente. O ChatPanel segue sem clique-fora de propósito — o painel convive com a página atrás dele, e fechar ao clicar num card perderia a thread; agora isso está escrito no código em vez de ser omissão.

- **A barra "Gerar com IA / Desfazer" existia em quatro versões, três delas iguais por cópia.** `StepObjectives`, `StepIndicators` e `StepBudget` carregavam o mesmo bloco de ~25 linhas — botão de gerar com rótulo alternando para "Gerando…", o "Desfazer" condicional e a linha de erro — e já haviam divergido: o de indicadores abria com `mt-2xs` contra `mt-xs` dos outros dois. Nasce `formulator/AiActionBar`, que recebe os botões extras ("Adicionar objetivo", "Adicionar detalhamento") por `children`; o espaçamento unifica em `mt-xs`. O `AiField` **não** entra: sua barra alinha à direita e inverte a ordem dos botões porque o papel é outro (aprimorar o campo que se está digitando), e forçá-lo ali significaria uma prop de layout para cada diferença.

- **O tripé `previousRef` + `showUndo` + `undo`, repetido quatro vezes, virou `useUndoable`.** Mesmo com a barra compartilhada, cada consumidor remontava à mão o estado de desfazer — e a ordem entre guardar o valor anterior e esconder o botão é fácil de trocar sem querer, com sintoma que só aparece na segunda geração seguida (o Desfazer restauraria a geração anterior, não o texto do gestor). O hook expõe `capture`/`arm`/`undo`/`reset` e é usado pelos três steps e pelo `AiField`. As mensagens de erro das quatro superfícies ganharam `role="alert"`, que só o Panorâma tinha.

- **Três formatadores de reais e dois cálculos do total do orçamento.** `parseValue`/`formatBRL` estavam copiados na íntegra em `StepBudget` e `FormulatorReview` — o segundo com um comentário admitindo que "espelha o que StepBudget faz" —, e a soma das rubricas era refeita em cada um. Um projeto exibia, em tese, dois orçamentos diferentes. Nasce `utils/currency.ts` (`parseBRL`, `formatBRL`, `budgetTotal`) e o terceiro formatador, o `formatReaisCheio` das emendas, passa a delegar a ele: fica só com o que é próprio do domínio — o `—` para valor ausente, que ali é significativo. Nenhuma mudança de render (o `maximumFractionDigits: 2` que só a versão das emendas declarava é o default de `style: 'currency'` em pt-BR).

- **A análise do Panorâma renderizava markdown como texto cru — e a causa era a terceira cópia do mesmo bloco.** O trecho "Sparkles + resposta + caret do typewriter" existia três vezes: `ChatPanel`, `IndicatorModal` e `EconomicsAnalysis`. As duas primeiras eram idênticas até o `mt-[2px]` do ícone; a do Panorâma tinha ficado para trás e imprimia o texto direto no `<p>`, então os `**negritos**` e as listas que o prompt autoriza apareciam com os asteriscos na tela. Nasce `ui/AiMessage`, que passa a ser a fonte única do bloco — e do `useTypewriter` que os três repetiam linha a linha. O ícone é opcional (`icon={false}`), porque no Panorâma o Sparkles já está no cabeçalho da seção: o render das três superfícies fica igual ao de antes, exceto pelo markdown que volta a ser markdown.

- **`text-button-secondary` era classe sem cobertura — a seta do `PillButton` secundário caía na cor herdada.** A variante `secondary` do `PillButton` inverte fundo e texto no círculo da seta (`bg-button-label-secondary text-button-secondary`), mas o `textColor` do `tailwind.config.js` só expunha `button-primary` e os pares de label: `text-button-secondary` não gerava declaração nenhuma desde a migração dos arbitrary values (abaixo). Mesma espécie de defeito do `bg-primary`: classe plausível apontando para cobertura inexistente, sem erro em lugar nenhum. Token adicionado ao `textColor`.

- **Fundo explícito nos cards.** Quatro ajustes de lapidação na mesma passada: (1) a borda default caiu de 1px para 0,5px (`borderWidth.DEFAULT` no `tailwind.config.js`), e o pseudo-elemento do `.glass-bevel` acompanhou — **mudança depois desfeita**, ver a entrada do `--border-default` acima: 0,5px é arredondado para 1px no Chromium e fazia os dois vocabulários de borda do projeto pintarem diferente. (2) `AgendaCard`, `ModeEixos`, `EconomicsCard` e `TrainingCard` ganharam `bg-surface` explícito: pintavam por transparência, e a cor do card dependia do que estivesse atrás. (3) O `EconomicsCard` perdeu a borda do container. (4) O corpo do `AgendaExpandable` ficou `border-t-0` — a borda de cima dobrava com a de baixo do cabeçalho, e o traço duplicado ficou mais visível justamente quando a borda afinou.

- **Calibragem final do tema claro (cores).** O fundo passa de `gray-100` para `gray-200` e a superfície dos cards de branco para `gray-100`: um degrau a menos de brancura em tudo, e o vidro — que antes era branco sobre quase-branco — ganha contraste para existir. A luz do bevel no claro **entra pelo topo-esquerda**, ao contrário do escuro: `--semantic-glass-shade` (inset do topo-esquerda) recebe branco e `--semantic-glass-edge` (inset do inferior-direita) o `gray-500`; o traço sobe para `gray-600`. O gradiente do bevel claro volta a descer de branco para azul-acinzentado, com a parada final mais opaca (0,75) para o pé não se dissolver no fundo novo. Os comentários que descreviam o estado anterior (brilho interno branco, sombra gray-400, divisor "sobre o gray-100 do background") foram reescritos para o que o arquivo faz agora — inclusive um número que estava errado: o neon `#F5E421` sobre as superfícies claras mede ~1,2–1,3:1, não 1,07:1 (a conclusão, invisível, não muda).

- **Tokens do glass voltam a referenciar primitivas.** `--semantic-glass-{stroke,edge,shade}` guardavam trincas RGB cruas (`100 116 139`) e o `-tint` um `rgba()` com alpha embutido — cor crua na camada semântica, contra a regra de que só `--primitives-*` carrega valor literal. A causa era o idioma `rgb(var(--x) / alpha)` escolhido na tokenização original: ele só funciona com canais soltos, porque uma var com cor completa não se decompõe dentro de `rgb()`. O projeto já usava a ferramenta certa em outros lugares (`color-mix(in srgb, cor N%, transparent)` no halo do risco, no anel de hover e no ponto pulsante — inclusive dentro de `box-shadow` e gradiente); o `.glass` passa ao mesmo idioma, e os quatro tokens viram `var(--primitives-…)` nos dois temas. Única diferença de render: a sombra interna do escuro sai de preto puro para `--primitives-black` (slate-900) — diluída a 22%, o diff de pixels mediu delta máximo 7 em 765, abaixo do perceptível.

- **Farol e texto de status deixam de dividir um token só; glass claro fica mais leve.** Segunda rodada da calibragem do claro, guiada por feedback: (1) o semáforo agora é **neon nos dois temas** — nasce o trio `--semantic-{success,warning,alert}-vivid`, consumido pelo preenchimento gráfico (pontos de status, régua dos indicadores, barra de glow das agendas, ponto do card de risco), enquanto o trio base segue sendo a cor de **texto** com AA por tema (rótulo "ATENÇÃO", thresholds). Um token só não serve aos dois papéis: no escuro o neon é legível e vivo ao mesmo tempo, no claro legível-sobre-branco e vivo divergem sem conciliação — foi testado na prática: com o trio base em neon, o rótulo do risco fica ilegível. Única cor que não vem literal do escuro: o amarelo — `#F5E421` sobre branco mede 1,07:1 (invisível); no claro o farol amarelo é o `yellow-500` (dourado saturado). (2) A sombra interna do `.glass` no claro caiu de canais do slate-900 para os do **slate-400** — modelava como painel sujo, e o hover (que intensifica o bevel) piorava; o brilho interno voltou a branco e o traço de 1px ganhou token próprio (`--semantic-glass-stroke`, slate-500 no claro, branco no escuro), que é quem define a aresta.

- **Tema claro: glass, warning e o glow dos cards de risco.** Três dispositivos nascidos no escuro não sobreviviam à inversão. (1) A borda do vidro era um brilho branco (`--semantic-glass-edge: 255 255 255`) — invisível sobre fundo claro, então os painéis `.glass` viravam blocos chapados sem definição; no claro o canal passa a ser o slate-500, porque sobre fundo claro a aresta do vidro se define por linha escura, não por brilho. (2) O warning claro era `yellow-700`, que escurecido até AA sobre branco vira **oliva-amarronzado** — o "ATENÇÃO" dos riscos e o meio da régua dos indicadores liam marrom; virou `amber-700` (5,0:1 sobre branco, 4,6:1 sobre o fundo), que na mesma faixa de contraste continua lendo como amarelo de atenção. (3) O halo dos cards de risco misturava 42% da cor de status sobre o vidro — luz emitida funciona sobre navy, mas sobre branco o amber escuro a 42% é **mancha bege**. Nasce o par `--semantic-{warning,alert}-glow`, espelhado nos dois temas: no escuro resolve para os mesmos neon de hoje (render idêntico, confirmado por screenshot), no claro para os pastéis 300 do matiz — o halo volta a ser sinal. `RisksCard` passa a setar `--risk` e `--risk-glow`; o brilho do ponto pulsante acompanha o par.


- **O botão `success` tinha label branco fixo — 1,67:1 no tema escuro.** Mesmo defeito do `NumberBullet`, escondido num lugar diferente: o fundo é `green-700` (escuro) no tema claro e `green-400` (claro) no escuro, mas o texto era branco nos dois. Ganhou `--semantic-button-label-success`, que inverte junto com o verde (10,68:1 no escuro). O achado veio da regra de lint nova, não de leitura: a varredura manual anterior filtrava por `.tsx` e `button-styles.ts` é `.ts` — o arquivo mais central do design system era justamente o que escapava.
- **Auditoria de contraste dos dois temas, com três achados.** Com o tema claro finalmente alcançável, os pares texto/fundo foram medidos em ambos: (1) o divisor no claro tinha 1,13:1 contra o fundo — `gray-200` sobre `gray-100`, uma linha que não existia na prática; passou a `gray-300`, igualando o contraste que o divisor já tinha no escuro. (2) `--semantic-text-inactive` no escuro ficava em 3,5:1, abaixo do mínimo de texto; passou de `gray-500` para `gray-400`, que atende nas três superfícies do escuro. (3) O `.glass-bevel` trazia um gradiente periwinkle→navy fixo: no tema claro o texto quase preto do `ModeToggle` e do `CitySelector` cairia sobre um fundo escuro. O gradiente virou o token `--semantic-glass-bevel`, guardado inteiro (são cinco paradas — espalhá-las em cinco variáveis não deixaria nada mais legível), com uma descida de branco a azul-acinzentado no claro.
- **O anel do marcador do `IndicatorBar` era branco fixo.** Único `rgba` cru que restava em componente: o marcador é mais alto que a barra, então o anel sobra sobre o fundo da página — branco sobre `slate-100` sumiria no tema claro. Passou a acompanhar `--semantic-text-primary`. A sombra continua preta nos dois temas, porque sombra é sombra.
- **O tema escuro herdava quatro tokens do claro — e ninguém via.** O bloco `.dark` redefinia 18 dos 26 tokens semânticos; os ausentes caíam silenciosamente no valor do `:root`, que é o tema claro. Não há erro de CSS nesse caso: a variável resolve, só resolve errado. Dois vazamentos tinham efeito visível: as **surfaces de status** (`--semantic-{success,warning,alert}-surface`) mantinham os pasteis do light (`green/yellow/red-100`), então todo `Card` com status pintava uma mancha clara sobre o navy; e `--semantic-text-secondary` — o número branco do `NumberBullet` — continuava branco sobre o **lime** do accent escuro, contraste de ~1,7:1, ilegível. Agora o `.dark` é espelho completo do bloco do `:root`, na mesma ordem, com um comentário explicando que a paridade se audita por diff porque o CSS não a denuncia. As surfaces de status no escuro passam a derivar da própria cor de status via `color-mix` sobre a superfície: muda o status, o tinte acompanha.
- **`--semantic-text-secondary` virou `--semantic-text-on-accent`.** O nome dizia "o segundo texto do sistema" quando o papel real é "texto sobre superfície accent" — e é justamente por isso que ele precisa acompanhar o accent (branco sobre o azul do claro, preto sobre o lime do escuro) em vez de acompanhar o tema. Consumidor único, o `NumberBullet`, que de quebra troca o valor arbitrário pela classe nativa `text-on-accent`.
- **`.divider` e `.glass` tokenizados; classes soltas entram no `@layer`.** O `.divider` lia `--primitives-gray-200` direto — componente consumindo primitiva, e no escuro um cinza claro fora da paleta; virou `--semantic-divider`, com valor por tema. O `.glass`/`.glass-bevel` eram rgba literais que assumiam fundo escuro; nasceram `--semantic-glass-tint`/`-edge`/`-shade`, com os valores do escuro idênticos aos de antes e os do claro em primeira aproximação — a calibragem fina veio nas rodadas registradas acima. `.typewriter-caret` e `.journey-cue-chevron` estavam declarados fora de `@layer components`, com precedência de cascata diferente das demais compostas; entraram na camada.
- **Os ~30 arbitrary values de token viraram classes nativas — e derrubaram três suposições de tema escuro.** Com a cobertura nova do `tailwind.config.js`, os primitivos de `ui/` (`TextInput`, `Card`, `ProgressBar`, `DropdownMenu`, `SectionErrorBoundary`, `PillButton`, `ModeToggle`), os componentes de feature (`ChatButton`/`ChatPanel`, `CitySelector`, `EconomicsAnalysis`, `IndicatorModal`, `FormulatorStepIndicator`, `ModeResources`) e os cards de agenda trocaram `text-[color:var(--semantic-…)]` pelas classes que o config passou a expor. Não foi só convenção: `focus:border-white` do `TextInput`, `text-black`/`text-white` do `ModeToggle` e os `border-white`/`text-white` de `AgendaCard`/`AgendaExpandable`/`AgendaIndicator` assumiam fundo escuro — no claro seriam borda invisível sobre slate-100; viraram `border-text-primary` e `text-on-accent`/`text-primary`, que acompanham o tema. O anel de seleção do `EmendasEsferaCard` trocou `ring` por `outline` — o argumento do foco (box-shadow some em `forced-colors`) vale para qualquer indicador de estado. Dimensões na mesma passada: `bottom-[40px]` do FAB → `bottom-lg`, `h-[0.5rem]` do `ProgressBar` → `h-xs`.
- **`bg-primary` apontava para token inexistente — o fundo raiz da aplicação era transparente.** O `tailwind.config.js` mapeava `backgroundColor.primary` para `--semantic-background-primary`, variável que nunca existiu (o token real é `--semantic-background`), então `bg-primary` gerava declaração inválida e o browser a descartava: o wrapper do `Layout` e o painel de revisão do Formulador ficavam sem fundo próprio, funcionando por sorte (o `body` pintava por baixo). A classe foi renomeada para `bg-background` — nome honesto, sem ambiguidade com `button-primary` — e os dois consumidores migrados. O comentário do `.catalog-nav`, que citava o bug como justificativa do seu workaround, agora explica a razão verdadeira de continuar em CSS (o `color-mix` com transparência).
- **O `body` declarava `font-family: var(--font)` — token que não existe.** As famílias do projeto são `--font-headings/titles/display/body`; `--font` nunca foi declarado, então a propriedade era inválida e qualquer texto que herdasse do `body` (fora das classes `.typo-*`, que declaram a própria família) caía na fonte default do navegador. Agora aponta para `--font-body` (Intel One Mono), o fallback correto.
- **`ModeEixos` re-registrava o listener de `resize` a cada render.** `const agendas = municipality.data?.agendas ?? []` produz um array novo em todo render, e ele era dependência do `useCallback` que equaliza a altura dos cards — então o callback nunca era estável, o `useLayoutEffect` rodava sempre e o par `addEventListener`/`removeEventListener` se refazia junto. Nada aparecia na tela, mas o React Compiler desistia de otimizar o componente inteiro por causa disso (`preserve-manual-memoization`). O `?? []` passou para um `useMemo` ancorado em `municipality.data`. De quebra, o toggle usava um ternário só pelos efeitos colaterais (`next.has(id) ? next.delete(id) : next.add(id)`) — virou `if/else`, que é o que ele já era na intenção.
- **Violações mecânicas de lint que estavam na árvore.** Três componentes importavam ícones direto do `lucide-react`, furando a barreira que o `no-restricted-imports` existe para manter — o registry em `components/icons/` é o que garante que só os ícones listados entram no bundle. Quatro casos de aspas duplas e um template literal sem interpolação eram código anterior às regras. E o `_agenda` do `agendaStatus` não era descuido: a assinatura é preservada de propósito (a função ignora o argumento por decisão de produto) e o prefixo `_` anunciava isso — só que o typescript-eslint não trata `_` como convenção sem configuração; entrou `argsIgnorePattern` no `eslint.config.js` para dar sentido ao prefixo em vez de silenciar o aviso caso a caso.

- **Seis cursos duplicados dentro da própria trilha (`src/data/home/training.ts`).** "Gerenciamento de Projetos" repetia Scrum e Ágil (mesmo `url`) nas posições 0/2 e 1/3, e "Captação de Recursos" repetia os convênios de ECTI 650 e 651 com títulos diferentes e a mesma URL. Numa lista de texto passava despercebido; em fileira de pôsteres os repetidos ficam lado a lado. As contagens caem de 14 → 12 e 11 → 9 (catálogo: 41 → 35 cursos, 869 horas).
- **`max-w-*` em elemento com gutter espremia o cabeçalho das fileiras.** Com `box-sizing: border-box` global, os 180px de gutter de cada lado entram no `max-width`: um `max-w-3xl` (768px) no mesmo elemento deixava ~408px de conteúdo e quebrava a sobrancelha em duas linhas. O `max-width` passou para um filho sem padding.
- **A última trilha nunca alcançava o topo e a barra de eixos nunca marcava o último eixo.** Não havia conteúdo abaixo da última fileira para rolar, então o `scrollIntoView` parava no meio da tela e a faixa de 10% do `IntersectionObserver` nunca a alcançava. A última fileira passa a ter `min-height: calc(100dvh - var(--catalog-offset))`, reservando a própria rolagem; o fecho do catálogo ocupa essa folga inteira com `flex-1` em vez de decantar no fundo dela: a **soma das cargas** (869 horas) encerra a página na mesma voz tipográfica — Monoblock em acento — que cada pôster abre, com a contagem de cursos e o "Voltar ao topo" logo abaixo. O offset da barra fixa virou **uma variável CSS só** (`--catalog-offset`), usada pelo `scroll-margin-top` das seções e dos pôsteres e pelo `min-height` — antes era uma constante em TS repassada por prop, com chance de sair de sincronia.
- **A barra de eixos perdia a marcação em lote de saída.** O callback do `IntersectionObserver` só reporta o que **mudou**; `entries.find(isIntersecting)` devolvia `undefined` sempre que a única mudança do lote era uma seção *saindo* da faixa, e a marcação ficava congelada na anterior. O estado vivo passou para um `Set`, com empates resolvidos pela seção mais alta.
- **`outline-accent` não existia no `tailwind.config.js`.** As classes eram usadas mas `outlineColor` não estava no `extend`, então o anel de foco de teclado e o destaque de deep link caíam no `currentColor` e saíam **brancos** em vez do acento. Token adicionado — vale para o projeto inteiro, não só para `/trilhas`.


## [1.2.0] — 2026-08-22

### Novidades

- **SideNav da Jornada flutua e acompanha o scroll.** A barra dos 4 pilares tem altura fixa (`h-[83dvh]`) mas rolava junto com a página: nos modos altos (Emendas, Formulador, Panorâma) ela saía de vista e trocar de pilar exigia voltar ao topo. Agora é `sticky top-md` — a linha que a contém passou de `stretch` (default do flex, que faria o item crescer até a altura da linha e nunca "descolar") para `items-start`, e o próprio painel ganhou `overflow-y-auto scrollbar-hide` para nunca cortar o conteúdo em viewports baixas. A base agora encosta no fim da seção: o painel vive numa coluna que estica até o fim da linha (`self-stretch`) e é `sticky` dentro dela, então o limite do sticky é o fim da seção — e `max-h-full` impede que os 83dvh ultrapassem a coluna, o que deixava uma folga sob a barra nos pilares mais curtos (Emendas media 976px contra os 913px dela). O fim do scroll também passa a coincidir com a base pinada da barra, em vez de a barra se soltar e subir no último trecho da rolagem — mas sem esticá-la até a viewport inteira, que lê mal: a altura fica em `--nav-h` (83dvh) e a sobra vira `padding-bottom` da seção, derivado da mesma variável (`100dvh - var(--nav-h) - var(--spacing-md)`). Uma fonte só para os dois números, então não há como saírem de sincronia.
- **Análise do Panorâma gerada por IA de verdade (task `economic-analysis`).** O bloco "Análise de desempenho do município" tinha ícone Sparkles, botão "Gerar análise com IA", status "Analisando indicadores…" e typewriter — mas não chamava `/api/ai`: era um `Record<IBGE, string>` com textos escritos à mão. Só **8 dos 223** municípios tinham texto próprio; os outros 215 recebiam um parágrafo genérico idêntico apresentado como leitura daquele município. Pior, os números estavam fixos no código e já contradiziam os cards exibidos alguns pixels acima: o texto de Campina Grande dizia remuneração média de R$ 2.400 (real: R$ 2.770,62) e 12.840 empresas ativas (real: 26.911, menos da metade). Agora o componente chama o LLM com a base econômica **estruturada** (`AiEconomicBaseItem[]`, não um resumo em texto) mais o resumo dos indicadores de agenda com seus status, e o prompt proíbe citar qualquer número fora desse contexto — o mesmo dado que alimenta os cards alimenta a análise, então não há como divergirem. Sem cards a requisição é rejeitada (400) em vez de deixar o modelo preencher o vazio. `EconomicsAnalysis` ganhou estado de `loading` real e de erro (com as mensagens amigáveis do `useAiTask`), separados do `typing`, que antes era a única forma de "carregando". Resposta limitada a 110 palavras: o texto que ela substituiu tinha ~70 e sem teto explícito o modelo passava de 180, estourando o painel.
- **Faixa oficial dos indicadores no contexto da análise.** O resumo enviado ao modelo passa a incluir, para cada indicador de agenda com `threshold` no banco, as três zonas da faixa oficial — derivadas pelo mesmo `thresholdSegmentLabels` que rotula a `IndicatorBar`, sem segunda fonte de verdade. Sem elas o modelo inventava a própria classificação: chamou um IDH-M de 0,588 de "avanço no desenvolvimento humano" quando a faixa oficial põe 0,588 em **Alerta**. O alcance é limitado pelos dados, e o prompt reflete isso: dos 2.676 itens de base econômica exibidos nos 223 municípios, só 223 (o IDH-M) têm indicador de agenda correspondente com faixa — os outros 11 cards não têm faixa oficial em lugar nenhum da plataforma. A regra virou dupla: usar o status oficial onde existe, e descrever sem rotular como alto ou baixo onde não existe.
- **Teto de tokens por task no cliente do OpenRouter.** Pedir "no máximo 110 palavras" no prompt não é confiável — na mesma versão o modelo devolveu 92 palavras para Campina Grande e 201 para Cabaceiras, estourando o painel. `OpenRouterEnv` ganhou `maxTokens` opcional (default 800 inalterado) e a `economic-analysis` impõe 260, com o excedente aparado na última frase completa pelo tratamento de `finish_reason: 'length'` que já existia. O limite deixa de ser pedido e vira garantia.
- **A análise deixa de recitar os cards.** Com os 12 cards reais o modelo gastava metade do texto relistando valores que o usuário já vê logo acima. O prompt passa a limitar a 3 os números citados, escolhidos por sustentarem o argumento.
- **`POST /api/ai` na API Fastify — a IA passa a funcionar em produção Sebrae.** As superfícies de IA (chat da Home, ~20 botões do Formulador, pergunta livre do modal do indicador) chamavam `/api/ai`, que só existia como function da Vercel e middleware de dev do Vite. No servidor Sebrae o Nginx manda todo `/api/*` para o Fastify, que não tinha a rota: toda chamada batia num 404, e o `useAiTask` traduzia isso para "Não foi possível gerar a resposta agora. Tente novamente em instantes." — convite a repetir algo que nunca responderia. Novo terceiro transporte sobre o **mesmo núcleo** `api/_lib/handler.ts` (a rota só repassa o body; nenhuma lógica de IA foi duplicada em `server/src/`). `OPENROUTER_API_KEY` é opcional no server: sem ela a API sobe normalmente e só o `/api/ai` responde `missing_key`, que o frontend já mostra como "O serviço de IA não está configurado neste ambiente" — exigir a chave derrubaria indicadores, mapa e emendas por causa de um recurso acessório. Requer saída de rede da máquina da app para `openrouter.ai` (comando de teste no `server/.env.example`).
- **Núcleo de IA compartilhado entra no build do server.** O `tsconfig.json` do `server/` passa a compilar `api/_lib` e `src/types/ai.ts` (`rootDir: ".."`), mantendo fonte única em vez de forkar o handler. Efeito colateral: o entrypoint emitido vira `dist/server/src/index.js`, e o `ExecStart` da unit systemd em produção aponta para `dist/index.js`. Em vez de exigir edição da unit num servidor já no ar, um `postbuild` (`server/scripts/emit-entry-shim.mjs`) gera `dist/index.js` como um shim de uma linha para o entrypoint real — o contrato de deploy documentado no README continua valendo.

- **`GET /api/emendas` na API de leitura (`server/`).** O modo Emendas do "Mapeamento de recursos" chamava uma rota que não existia — na branch de preview ela era atendida por um JSON estático, e sem ele o painel ficava vazio. Nova rota lê a coleção `emendas` (`listEmendas` + `buildEmendasData`) e devolve as duas esferas de uma vez, para o toggle federal/estadual não disparar requisição nova; os 223 municípios saem na ordem do código IBGE (ordenada na rota — o sort default do Mongo é binário e jogaria "Água Branca" para depois do Z). Três decisões ficam na rota, documentadas no §17 do mapeamento: `coberturaMunicipal` é derivada (federal sobre `pago`, estadual sobre `valor`, porque no estadual o que se atribui é a emenda inteira e medir sobre pago subestimaria o não executado); **zero no estadual vira `null`** — lá o município é inferido do texto livre, então zero é "não conseguimos atribuir", enquanto no federal (censo de documentos por código IBGE) zero é zero real; e `naoMunicipalizado` é remontado com os campos declarados, sem vazar o `porAno` extra que o doc federal guarda. Coleção vazia devolve **503** em vez de um payload zerado que a UI mostraria como "R$ 0" para os 223 municípios. Verificada contra o snapshot da branch de preview: os 223 municípios e todos os metadados batem valor a valor.
- **Metadados da esfera de emendas no banco (`coletadoEm`, `criterioQuebraAnual`).** O contrato pede os dois, mas nenhum existia nos docs — só nos snapshots de ETL, de onde o gerador do JSON estático os lia. Passam a ser gravados no doc de rollup `PB:<esfera>` pelos dois geradores de seed (não se repetem nos 223 municipais), com os campos declarados no validator de `database/setup.mongodb.js`. Sem isso a rota teria que inventá-los no servidor.

- **Mapeamento de dados atualizado com as emendas parlamentares (`database/MAPEAMENTO_BASE_DOS_DADOS.md` §17).** As emendas só apareciam no doc como uma linha de "dado extra" via `/transferegov` do mcp-brasil — caminho que nem foi o usado. Nova §17 documenta as duas esferas lado a lado: fontes (**CGU** por documento de despesa e **CODATA/CGE-PB**), formatos, janelas de safra, os **dois eixos de tempo distintos** do `porAno` (documento × safra), totais PB, parcela não municipalizada, geradores e snapshots. Registra o ponto crítico — `atribuicao: 'ibge'` (exato) contra `'texto-beneficiario'` (estimativa), com a regra conservadora de atribuição do estadual e o porquê (sem ela João Pessoa infla 2,5×) —, a validação contra o painel da Datapedia (federal bate ao centavo por ano, 220/223 municípios dentro de 1%; estadual −4,94% no agregado, teto do método), a modelagem na coleção própria `emendas` (fora de `indicatorValues`, sem `threshold`) e o caminho até o frontend (snapshot estático em `/api/emendas`; **rota Fastify ainda não existe**). Etiquetas **CGU** e **CODATA/PB** entram no cabeçalho e na legenda; a linha antiga da §2 e a menção em §3 passam a apontar para a §17.
- **Pilar "Mapeamento de recursos" com um modo só.** O modo Editais saiu do registry (`PANEL_MODES.recursos` em `SectionJornada`), então o `ModeToggle` do pilar deixa de aparecer — mesmo mecanismo que já deixava o Formulador sem toggle. O componente `ModeEditais` continua no repo; para trazer de volta é reinserir a entrada e o import.
- **Layout do painel de Emendas ajustado à altura da SideNav.** A seção media **1.329px** contra os **913px** da SideNav (`h-[83dvh]`) — 416px de excesso. Medido bloco a bloco e corrigido onde pesava: mapa limitado a 520px de largura (a altura acompanha a largura, 415→299px), `gap-lg`→`gap-md` e `p-lg`→`p-md` no painel (os 5 blocos custavam 160px só de respiro), e o resumo do estado passou a dividir uma faixa com o CTA do Datapedia em vez de ocupar duas linhas próprias. O título voltou para a mesma linha do `ModeToggle`: empilhados, o título alinhado à esquerda brigava com o toggle e o mapa centralizados — três alinhamentos diferentes na vertical — e a linha extra custava ~70px. Resultado: **976px**, praticamente a altura da barra lateral. Os cards das duas esferas passaram de `card-surface` para `glass` (a classe não traz `border-radius`, que vem do `rounded-sm`).
- **`ParaibaOutlineMap`: a prop `className` era declarada mas nunca aplicada.** Ficava só na interface — o `<svg>` tinha `w-full h-auto` fixo, então quem passasse `className` não via efeito. Agora é concatenada; é por ela que o consumidor limita a largura (e, com isso, a altura) do mapa.
- **Modo "Mapeamento de recursos" agora é um mapa de emendas com dados reais.** A tela exibia cinco valores estáticos do estado inteiro (já defasados — o total pago tinha saltado de R$ 3,3 para 4,3 bi) e um **PNG** do mapa linkando para o Datapedia. Passa a usar o `ParaibaOutlineMap` de verdade como coroplético do valor pago por município, com `ModeToggle` alternando entre as esferas **federal** e **estadual**, hover mostrando o valor de qualquer município para comparação e painel do município selecionado com empenhado, pago, quebra por ano e contagem de emendas/autores. As duas esferas **não são somadas num número único**: a federal vem de código IBGE estruturado (exata) e a estadual é inferida do texto da emenda (estimativa, com `InfoTooltip` explicando a cobertura) — o card da esfera ativa vem primeiro, mas ambos ficam visíveis. O detalhamento por emenda continua encaminhando para o Datapedia. Novos: contrato `src/types/emendas.ts`, client `fetchEmendas`, hook `useEmendas` (cache no módulo — uma requisição por sessão) e `src/utils/emendas.ts`.
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

- **`CLAUDE.md` enxugado (259 → 167 linhas, 2.336 → 1.040 palavras).** O guia tinha crescido duplicando o que já se lê no código: o dump completo das CSS vars que estão no `index.css`, a enumeração de props do `ParaibaOutlineMap`, o algoritmo do `ModeRisks` passo a passo, a interface `MunicipalityState` copiada da fonte e uma tabela de `src/data/` que era listagem de diretório. Saiu também a justificativa histórica ("A partir da 0.7.0…") e uma duplicação literal introduzida ao documentar o transporte Fastify — os "três transportes" apareciam em **Arquitetura** e de novo em **Regras**. Ficou o que muda o comportamento de quem edita: regras, contratos e armadilhas, agora com uma seção **Armadilhas conhecidas** que reúne o shim do entrypoint do `server/`, a heurística de "etapa concluída" do Formulador e a suíte de testes ausente. Todas as 18 regras da versão anterior foram conferidas uma a uma.
- **Ocultar sessão de emendas** A sessão é um placeholder, vamos ocultar até termos informações para apresentar.

### Correções


- **Painel do `Modal` centralizado na horizontal.** O backdrop do primitivo `Modal` usava só `.flex-center` (que não aplica `justify-content`), então o painel — visível no modal "IA" do indicador — não ficava centralizado na tela. Adicionado `justify-center` no backdrop, valendo para todos os modais.
- **Ícone do FAB do chat centralizado (`ChatButton`).** O ícone `MessageCircle` ficava encostado à esquerda do botão: a classe utilitária `.flex-center` do projeto só aplica `display: flex; align-items: center` (sem `justify-content`), então o botão ganhou `justify-center` explícito para centralizar também na horizontal. Aproveitado o ajuste de cor do ícone: preto no estado normal e branco no hover (antes branco fixo).
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
