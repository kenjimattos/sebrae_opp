# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Added

- **`TextInput`** (`components/ui/TextInput.tsx`) — primitivo de input/textarea com props `title`, `subtitle`, `hint`, `disabled`, `multiline`, `rows`. Controlado via `value` + `onChange`. Cobre as 9 variantes do Figma (`603:2011`) com booleans ao invés de enum.
- **`ProgressBar`** (`components/ui/ProgressBar.tsx`) — barra de progresso horizontal genérica. Aceita `value` (0–100, com clamp), usa `role="progressbar"` + `aria-valuenow`.
- **`StepIndicator`** (`components/formulador/StepIndicator.tsx`) — item da sidebar com 3 variantes de status (unchecked/current/checked) usando `Circle`/`CircleDot`/`Check` do Lucide. Clicável quando `onClick` é fornecido.
- **`ProjectSteps`** (`components/formulador/ProjectSteps.tsx`) — sidebar do Formulador. Itera as 10 etapas e deriva o status de cada uma a partir de `currentSlug` + `visitedSlugs`.
- **`formulador-etapas.ts`** (`data/`) — fonte única de verdade para as 10 etapas do Formulador: `slug`, `label` (sidebar), `nome` (progress), `titulo` + `subtitle` (FormCard). Helpers `findEtapaBySlug` e `findEtapaIndex`.
- Ícones `Check`, `Circle`, `CircleDot`, `Plus` exportados de `components/icons`.
- **`FormuladorProgress`** (`components/formulador/FormuladorProgress.tsx`) — Card com `ProgressBar` + labels "X% concluído" e "Y/10 etapas • Etapa Atual: …". Deriva o nome da etapa de `formulador-etapas.ts`.
- **`AIAssistant`** (`components/formulador/AIAssistant.tsx`) — sidebar direita do Formulador (`Card surface="secondary"`). Exibe descrição, exemplos com divider e lista de ações. Ações disparam `onAction(label)` — no-op por padrão.
- **`FormCard`** (`components/formulador/FormCard.tsx`) — card central. Header título/subtítulo, slot para o form, footer com Anterior (oculto na etapa 1), "X/10 etapas" e Próxima/Finalizar (primary preto na última etapa).
- **`formulador-ai.ts`** (`data/`) — conteúdo do AIAssistant por etapa. Placeholder v1: mesma descrição/exemplos/ações para todas; no futuro gerado por LLM.
- **`FormuladorContext` + `FormuladorProvider` + `useFormulador`** (`hooks/`) — estado global do rascunho de projeto. Um rascunho por município (chave `formulador:${ibgeId}` em `localStorage`), hidratação no mount, persistência automática a cada mudança. Helpers `setSlice(key, value)`, `markVisited(slug)`, `reset()`. A troca de município recarrega o rascunho correspondente via render-phase state update (sem `useEffect` para evitar cascading renders).
- **`types/formulador.ts`** — tipos de cada etapa (`IdentificacaoData`, `JustificativaData`, etc.) + `FormuladorState` + `EMPTY_FORMULADOR_STATE`.
- **Rota `/formulador`** — nova página do formulador com rotas aninhadas (`:stepSlug` e `conclusao`, index redireciona para `identificacao`). Layout: Header + hero + `FormuladorProgress` + grid 3 colunas (`ProjectSteps` | `FormCard` | `AIAssistant`) + Footer. Slug inválido redireciona para a primeira etapa.
- **`FormuladorProvider`** agora envolve `App` (via `main.tsx`/`App.tsx`) — disponível em toda a árvore para integração futura entre seções da Home e o Formulador.
- **10 componentes de etapa** (`components/formulador/steps/`): `StepIdentificacao`, `StepJustificativa`, `StepObjetivos`, `StepPublicoAlvo`, `StepPlanoAcao`, `StepCronograma`, `StepIndicadores`, `StepOrcamento`, `StepSustentabilidade`, `StepGovernanca`. Cada um é um wrapper fino que lê/escreve um slice do `FormuladorContext` usando `TextInput`. Objetivos e Orçamento têm listas dinâmicas (+ Adicionar). Orçamento calcula Valor Total via `useMemo` (parse pt-BR + `Intl` para formatação).

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
