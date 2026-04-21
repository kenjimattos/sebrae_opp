# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Added

- **`EconomicsAnalysis` — geração simulada por IA.** O card da seção Base Econômica agora inicia vazio, com título, subtítulo e CTA "Gerar análise com IA". Ao clicar, o texto é revelado com efeito de máquina-de-escrever (cursor piscando) até completar. No estado final aparece um botão "Gerar novamente" que reinicia a animação. Cada município tem uma análise própria (fallback para texto genérico). A troca de município reseta o card para o estado inicial via `key={municipio.id}`.
- **`src/hooks/useTypewriter.ts`** — hook reutilizável para efeito de digitação caractere-a-caractere. API: `useTypewriter({ text, enabled, speed?, onDone? })` → `{ displayed }`. Reset ocorre via remount (nova `key` no consumidor).
- **`src/data/economics.ts`** — `analisePorMunicipio` (8 análises, uma por código IBGE) + `getAnaliseForMunicipio(id)` com fallback para `defaultAnalise`. Novos labels: `emptyAnaliseTitle`, `emptyAnaliseSubtitle`, `gerarAnaliseLabel`, `regenerarAnaliseLabel`, `gerandoAnaliseLabel`.
- **`.typewriter-caret`** — classe CSS em `index.css` com animação `typewriter-caret-blink` (step-end, 0.9s).
- **`Sparkles`** — ícone adicionado ao re-export central de `@/components/icons`.

### Changed

- **`EconomicsAnalysis`** — API simplificada: aceita apenas `{ analise: string }`. Consumidor controla reset via `key`. Componente agora tem máquina de estados interna (`idle` | `typing` | `done`).
- **`SectionBaseEconomica`** — consome `useMunicipio` para derivar a análise do município atual e passa `key={municipio.id}` para garantir reset ao trocar o município.

## [0.7.0] — 2026-04-20

Refactoring do design system: integração dos tokens no Tailwind config, eliminando ~80 classes custom duplicadas do `index.css`. Extração de estilos compartilhados de botão.

### Changed

- **`tailwind.config.js`** — `theme.extend` populado com spacing, borderRadius, backgroundColor, textColor e fontWeight mapeados para as CSS variables do design system. Classes como `gap-md`, `p-sm`, `rounded-sm`, `bg-surface`, `text-inactive` agora são nativas do Tailwind. `rounded-full` preserva o default do Tailwind (`9999px`) para garantir círculos perfeitos em qualquer tamanho.
- **`src/index.css`** — removidas ~80 classes utilitárias custom do `@layer components` (gap, padding, radius, background, text-color) que duplicavam o que o Tailwind agora gera nativamente. Mantidas apenas classes compostas (`.typo-*`, `.card-*`, `.flex-*`, `.grid-*`, `.status-*`, `.divider`, `.scrollbar-hide`, `.section-container`).
- **Codebase (~30 .tsx)** — renomeado `radius-*` → `rounded-*` em todas as className strings para usar a convenção do Tailwind.
- **`Card.tsx`** — API de padding simplificada: removido o split `{ x, y }`, agora aceita apenas `'none' | 'sm' | 'md' | 'lg' | 'xl'`. Componente reduzido de 107 para 68 linhas. `AgendaCard`, `AgendaStats` e `EconomicsAnalysis` migrados para padding uniforme + override via `className`.
- **`Button.tsx`** e **`IconButton.tsx`** — `variantStyles` e classe base extraídos para `button-styles.ts` compartilhado, eliminando duplicação.
- **`PillButton.tsx`** — shell agora usa `buttonVariantStyles` (tokens semânticos de botão) em vez de `bg-accent`/`bg-surface-secondary`. Circle inverte as cores do botão (label→bg, bg→icon). Eliminada duplicação `typoPrimary`/`typoSecondary`.

### Added

- **`src/components/ui/buttons/button-styles.ts`** — constantes `buttonVariantStyles` e `buttonBaseClass` compartilhadas entre Button e IconButton.
- **`IconButton` modo decorativo** — nova prop `decorative` renderiza `<span aria-hidden>` ao invés de `<button>`, unificando o padrão "ícone em círculo" num único componente. Nova escala: `xs` (24×24), `sm` (32×32), `md` (40×40), `lg` (48×48). `SectionHero` e `EconomicsCard` migrados para usar `IconButton decorative`.
- **`SectionHero`** — substituídos todos os `style={{}}` inline por classes Tailwind (`tracking-[0.12em]`, `bg-accent`, `font-regular leading-[1.2]`, `grid-cols-2 gap-sm`).
- **`Oportunidades.tsx`**, **`Comunidade.tsx`** — `style={{ fontWeight, lineHeight }}` substituído por `font-regular leading-[1.2]`.
- **`Trilhas.tsx`** — `style={{ scrollMarginTop }}` substituído por `scroll-mt-[120px]`.

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
