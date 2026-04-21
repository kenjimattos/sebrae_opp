# CLAUDE.md — Plataforma OPP

Guia de desenvolvimento para a Plataforma OPP (Observatório de Políticas Públicas).
Leia este arquivo inteiro antes de começar qualquer tarefa.

> **Status atual:** Protótipo funcional com Hero + 8 seções implementadas, mapa interativo da Paraíba, estado global por município, e dados para 8 municípios (João Pessoa, Campina Grande, Queimadas, Conde, Caaporã, Pitimbu, Monteiro, Cabaceiras). Viewport desktop 1440px. Dark mode configurado via tokens mas sem toggle na UI. **Rota `/formulador` implementada** — fluxo em 10 etapas + tela de conclusão com exportação PDF, persistência por município em `localStorage`. **Páginas `/trilhas`, `/oportunidades` e `/comunidade` implementadas.**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript 6 |
| Estilização | Tailwind CSS v3 + CSS Variables (design tokens) |
| Mapa | Leaflet + React Leaflet + GeoJSON da Paraíba (IBGE) |
| Roteamento | React Router v7 |
| Testes | Vitest + React Testing Library + jsdom |
| Deploy (protótipo) | Vercel |
| Deploy (produção) | Servidor Sebrae — build estático servido via Nginx/Apache |

**Não usamos Shadcn/ui.** Componentes vêm do Figma; o que faltar é feito com Tailwind puro.

### Sobre o build

O projeto gera um **build estático** (`vite build` → pasta `dist/`). Não há servidor Node.js em produção. Toda lógica de dados no protótipo usa arquivos JSON e TS em `/src/data/`.

> **Nota:** `react-simple-maps@3` + `prop-types` requerem `npm install --legacy-peer-deps` com React 19.

---

## Figma

- **Arquivo:** `https://www.figma.com/design/kcntOAen2AiyqvPUVbnsJh/Plataforma`
- **Page principal:** `Page 2 - Prototipo` (node `257:3`)
- **Frame de referência:** Desktop 1440px (node `390:565`)

O Figma usa **Variables** organizadas em 3 collections (Colors, Typography, Spacing). Sempre use as variáveis via CSS vars — nunca valores hardcoded.

### Uso do MCP do Figma

Usamos o **MCP nativo do Figma** (não Framelink). Ferramentas principais:
- `mcp__figma__get_design_context` — código + screenshot + hints de um node
- `mcp__figma__get_metadata` — estrutura/hierarquia (use offset/limit, é grande)
- `mcp__figma__get_screenshot` — imagem do node
- `mcp__figma__use_figma` — executa JS via Plugin API (usar p/ extrair variables, listar componentes)
- `mcp__figma__get_variable_defs` — só funciona com seleção ativa no Figma

Para `use_figma`, sempre carregar a skill `figma-use` antes.

---

## Design Tokens

Os tokens estão implementados em `src/index.css`, extraídos das Variables do Figma. **Colors** tem modos `Light` e `Dark`; Typography e Spacing têm um único modo.

Referência rápida dos tokens — consultar `src/index.css` para a lista completa:

```
Font Sizes: --font-size-{display-large|display|display-small|h1|h2|h3|h4|body-lg|body|body-sm|button-lg|button|button-sm}
Weights:    --typo-weight-{regular|semibold|bold|black}
Line-height:--typo-lh-{auto|body}
Spacing:    --spacing-{2xs|xs|sm|md|lg|xl|2xl|3xl|margin}
Radius:     --radius-{sm|md|lg|xl|full}
Icon Sizes: --icon-size-{xs|sm|md|lg|xl}  (12, 16, 20, 24, 32 — paralelo a ICON_SIZES em src/constants/icons.ts)
Colors:     --primitives-{gray|blue|green|yellow|red}-{100..900}
Semantic:   --semantic-{background-primary|surface-primary|surface-secondary|text-primary|text-inactive|...}
Accent:     --semantic-accent{|-hover|-surface}
Status:     --semantic-{success|warning|alert}{|-surface}
Hovers:     --semantic-button-{primary|secondary|tertiary|success}-hover, --semantic-surface-hover
```

### Tipografia composta (classes `.typo-*`)

Os estilos tipográficos do Figma (16 Text Styles) estão implementados como classes CSS compostas via `@layer components`. Cada classe aplica `font-size` + `font-weight` + `line-height` (e `text-transform` quando aplicável):

```
Display:  .typo-display-lg | .typo-display | .typo-display-sm
Heading:  .typo-h1 | .typo-h2 | .typo-h3 | .typo-h4 (inclui uppercase)
Body:     .typo-body-lg | .typo-body-lg-bold | .typo-body | .typo-body-bold | .typo-body-sm | .typo-body-sm-bold
UI:       .typo-button-lg | .typo-button | .typo-button-sm
```

> **Regra:** usar classes `.typo-*` para tipografia. Nunca aplicar `font-bold`, `text-[length:var(...)]`, `leading-*` avulsos.
> Correto: `className="typo-h1 text-[color:var(--semantic-text-primary)]"`
> Errado: `className="font-bold text-[length:var(--font-size-h1)] leading-none"`

> **Regra:** sempre usar CSS variables para cores, espaçamentos e radius. Nunca hardcodar.
> Correto: `className="rounded-md p-md bg-surface"` (classes nativas via tokens do Tailwind config)
> Errado: `className="rounded-3xl p-6 bg-white"` (valores hardcoded do Tailwind default)

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Figma: Header (405:2044)
│   │   └── Footer.tsx                # Figma: Footer (419:917)
│   ├── agenda/
│   │   ├── AgendaCard.tsx            # Figma: Agenda/Card (set 603:1874)
│   │   ├── AgendaIndicator.tsx       # Figma: Agenda/Indicator (300:32)
│   │   ├── AgendaBadge.tsx           # Figma: Agenda/Badge (set 563:3818)
│   │   └── AgendaStats.tsx           # Figma: Agenda/Stats (518:3311)
│   ├── economics/
│   │   ├── EconomicsCard.tsx         # Figma: Economics/Card (563:4015) — ícone em círculo + label + valor + variação
│   │   └── EconomicsAnalysis.tsx     # Figma: Economics/Analysis (368:834) — bloco de análise textual (futuro: LLM)
│   ├── risks/
│   │   └── RisksCard.tsx             # Figma: Risks/Card (set 563:4445) — dinâmico, derivado dos indicadores
│   ├── resources/
│   │   └── ResourcesCard.tsx         # Figma: Resources/Card (287:12)
│   ├── courses/
│   │   ├── CoursesCard.tsx            # Figma: Courses/Card (298:8)
│   │   └── CoursesCardRow.tsx         # Figma: Courses/CardRow (297:8)
│   ├── case-studies/
│   │   └── CaseStudiesCard.tsx        # Figma: CaseStudies/Card (288:8)
│   ├── formulador/
│   │   ├── FormuladorCard.tsx         # Figma: Formulador/Card (296:8) — card de entrada na home
│   │   ├── FormCard.tsx               # Figma: Formulador/FormCard (696:2665) — wrapper do form central (título/subtítulo/slot/footer Anterior+Próxima/Finalizar)
│   │   ├── FormuladorProgress.tsx     # Figma: Formulador/Progress (620:4417) — barra topo "X% concluído"
│   │   ├── ProjectSteps.tsx           # Figma: Formulador/ProjectSteps (603:2135) — sidebar esquerda
│   │   ├── StepIndicator.tsx          # Figma: Formulador/StepIndicator (603:1560) — 3 variantes (unchecked/current/checked)
│   │   ├── AIAssistant.tsx            # Figma: Formulador/AIAssistant (603:1803) — sidebar direita
│   │   └── steps/                     # 10 componentes de etapa + dispatcher (StepForm)
│   ├── icons/
│   │   ├── index.ts                   # Re-export centralizado de ícones Lucide + UserAvatar
│   │   └── UserAvatar.tsx             # SVG custom (não existe no Lucide)
│   ├── map/
│   │   ├── ParaibaMap.tsx             # Mapa Leaflet interativo com zoom, tooltip, cores por indicador
│   │   └── ValueBadges.tsx            # Badge markers (DivIcon) sobre centróides no mapa
│   ├── panorama/
│   │   ├── PanoramaLegend.tsx         # Legenda de status (bom/atenção/crítico)
│   │   └── PanoramaMediaInfo.tsx      # Média estadual do indicador selecionado
│   ├── ScrollToTop.tsx               # Restaura scroll para topo a cada mudança de rota (ignora quando há `hash`)
│   ├── sections/
│   │   ├── SectionAgendas.tsx         # Figma: 390:567
│   │   ├── SectionPanorama.tsx        # Figma: 390:578
│   │   ├── SectionBaseEconomica.tsx   # Figma: 390:581
│   │   ├── SectionRiscos.tsx          # Figma: 390:594 — dinâmico: extrai alert/warning das agendas
│   │   ├── SectionRecursos.tsx        # Figma: 390:600
│   │   ├── SectionCapacitacao.tsx     # Figma: 390:611
│   │   ├── SectionCasosSucesso.tsx    # Figma: 390:623
│   │   ├── SectionFormulador.tsx      # Figma: 390:635
│   │   └── SectionAIAssistant.tsx     # Figma: 390:635
│   └── ui/
│       ├── buttons/
│       │   ├── Button.tsx             # primary/secondary/tertiary/ghost + sm/md/lg + label + icon opcional
│       │   ├── IconButton.tsx         # Circular icon-only + 4 variants × 3 sizes + aria-label obrigatório
│       │   └── PillButton.tsx         # CTA pill + 3 sizes (sm/md/lg) + label + seta em círculo
│       ├── SectionContainer.tsx       # Wrapper 1440px + padding lateral
│       ├── Card.tsx                   # Primitivo unificado: surface (primary/secondary/success/warning/alert) + padding + bordered + radius
│       ├── SectionHeader.tsx          # Figma: SectionHeader (set 327:1963)
│       ├── TitleSubtitle.tsx          # Figma: TitleSubtitle (set 405:1388)
│       ├── InsetBar.tsx               # Barra encaixada no topo de SectionCard
│       ├── Grid.tsx                   # Grid configurável (cols, gap)
│       ├── Dropdown.tsx               # Select estilizado — consome useDropdownState + DropdownMenu
│       ├── DropdownMenu.tsx           # Lista UL reutilizável — max-content + min-w-full (auto-sizing)
│       ├── useDropdownState.ts        # Hook compartilhado: open/setOpen/ref + click-outside
│       ├── TextInput.tsx              # Input/textarea com title/subtitle/hint/disabled/multiline
│       ├── ProgressBar.tsx            # Barra de progresso 0–100 com a11y (role=progressbar)
│       └── HoverOverlay.tsx           # Overlay decorativo: escurece pai no hover + pill com hint (pai precisa de `relative group`)
├── data/
│   ├── municipios.json               # Lista dos 8 municípios (id IBGE, nome, slug)
│   ├── sections.ts                   # Títulos e descrições centralizados de todas as seções
│   ├── mapa-indicadores.ts           # Dados de indicadores por município para coloração do mapa
│   ├── riscos-contexto.ts            # Descrições e contextos de risco por indicador (futuro: LLM)
│   ├── labels.ts                     # Labels compartilhados (status, CTAs, panorama, user)
│   ├── capacitacao.ts                # Trilhas e cursos (SectionCapacitacao)
│   ├── recursos.ts                   # Cards, URLs e textos (SectionRecursos)
│   ├── formulador.ts                 # Cards do formulador (SectionFormulador)
│   ├── formulador-etapas.ts          # Fonte de verdade das 10 etapas (slug/label/titulo/subtitle)
│   ├── formulador-ai.ts              # Conteúdo do AIAssistant por etapa
│   ├── ai-assistant.ts              # Placeholder + botões (SectionAIAssistant)
│   ├── layout.ts                     # navLinks, footerColumns, brandText, copyright
│   ├── economics.ts                  # Texto de análise econômica
│   └── indicadores/
│       ├── joao-pessoa.json
│       ├── campina-grande.json       # Município default — dados extraídos do Figma
│       └── patos.json
├── hooks/
│   ├── useMunicipio.ts               # Hook + Context type + MunicipioState interface
│   ├── MunicipioProvider.tsx          # Provider que carrega JSON por município
│   ├── useFormulador.ts              # Hook + Context type do rascunho de projeto
│   ├── FormuladorProvider.tsx         # Provider do rascunho — persiste por município em localStorage
│   ├── usePanoramaIndicadores.ts     # Dropdown options derivadas das agendas
│   └── usePanoramaMedia.ts           # Cálculo de média estadual do indicador
├── constants/
│   └── icons.ts                     # ICON_SIZES { xs:12, sm:16, md:20, lg:24, xl:32 } — paralelo a --icon-size-* CSS vars
├── utils/
│   ├── statusStyles.ts               # Mapa de classes CSS de status compartilhado
│   └── mapHelpers.ts                 # Helpers do mapa (getCSSVar, getStatus, getCentroid, etc.)
├── test/
│   ├── setup.ts                      # Setup global (@testing-library/jest-dom)
│   ├── sections.test.tsx             # Smoke tests das 9 seções
│   ├── components.test.tsx           # Smoke tests dos componentes individuais
│   ├── snapshots.test.tsx            # Snapshot tests para segurança de refactor CSS
│   └── mocks/                        # Mocks (municipio, leaflet, wrapper)
├── types/
│   ├── indicadores.ts                # IndicadoresData, Agenda, Indicador, etc.
│   └── formulador.ts                 # FormuladorState + tipos de cada etapa + EMPTY_FORMULADOR_STATE
├── pages/
│   ├── Home.tsx                      # Página principal com todas as seções
│   ├── Formulador.tsx                # Layout da rota /formulador (hero + progress + <Outlet>)
│   ├── FormuladorStep.tsx            # /formulador/:stepSlug — sidebar + FormCard + AIAssistant
│   └── FormuladorConclusao.tsx       # /formulador/conclusao — revisão + banner + cards por etapa
├── App.tsx                           # BrowserRouter + MunicipioProvider + FormuladorProvider
├── main.tsx
└── index.css                         # Design tokens (typography, spacing, radius, colors, dark mode)
```

---

## Componentes do Figma — Status de Implementação

### ✅ Implementados

| Nome no Figma | Node ID | Arquivo |
|---|---|---|
| Header | `405:2044` | `layout/Header.tsx` |
| Footer | `419:917` | `layout/Footer.tsx` |
| User | `405:2038` | `layout/User.tsx` |
| CitySelector | `509:3274` | `layout/CitySelector.tsx` |
| SectionHeader | `327:1963` | `ui/SectionHeader.tsx` |
| TitleSubtitle | `405:1388` | `ui/TitleSubtitle.tsx` |
| Buttons | `378:477` | `ui/buttons/Button.tsx` |
| Agenda/Card | `603:1874` | `agenda/AgendaCard.tsx` |
| Agenda/Indicator | `300:32` | `agenda/AgendaIndicator.tsx` |
| Agenda/Badge | `563:3818` | `agenda/AgendaBadge.tsx` |
| Agenda/Stats | `518:3311` | `agenda/AgendaStats.tsx` |
| Economics/Card | `563:4015` | `economics/EconomicsCard.tsx` |
| Economics/Analysis | `368:834` | `economics/EconomicsAnalysis.tsx` |
| Risks/Card | `563:4445` | `risks/RisksCard.tsx` |
| Resources/Card | `287:12` | `resources/ResourcesCard.tsx` |
| Courses/Card | `298:8` | `courses/CoursesCard.tsx` |
| Courses/CardRow | `297:8` | `courses/CoursesCardRow.tsx` |
| CaseStudies/Card | `288:8` | `case-studies/CaseStudiesCard.tsx` |
| Formulador/Card | `296:8` | `formulador/FormuladorCard.tsx` |
| Formulador/FormCard | `696:2665` | `formulador/FormCard.tsx` |
| Formulador/Progress | `620:4417` | `formulador/FormuladorProgress.tsx` |
| Formulador/ProjectSteps | `603:2135` | `formulador/ProjectSteps.tsx` |
| Formulador/AIAssistant | `603:1803` | `formulador/AIAssistant.tsx` |
| Formulador/StepIndicator | `603:1560` | `formulador/StepIndicator.tsx` |
| TextInput | `603:2011` | `ui/TextInput.tsx` |

### ⬜ Pendentes (existem no Figma, não implementados)

| Nome no Figma | Node ID | Notas |
|---|---|---|
| Agenda/Tooltip | `498:1024` | Tooltip de análise |
| Icons | `380:482` | Biblioteca de ícones (usamos SVGs inline por enquanto) |

### Componentes Tailwind puros (sem Figma)

| Componente | Status | Notas |
|---|---|---|
| `ui/SectionContainer.tsx` | ✅ | Wrapper 1440px + margin |
| `ui/Card.tsx` | ✅ | Primitivo unificado: surface (primary/secondary/success/warning/alert) + padding (all ou {x,y}) + bordered + radius |
| `ui/InsetBar.tsx` | ✅ | Barra encaixada no topo de Card |
| `ui/Grid.tsx` | ✅ | Grid configurável |
| `ui/buttons/Button.tsx` | ✅ | primary/secondary/tertiary/ghost + sm/md/lg + label + icon opcional |
| `ui/buttons/IconButton.tsx` | ✅ | Circular icon-only + 4 variants × 3 sizes |
| `ui/buttons/PillButton.tsx` | ✅ | CTA pill + 3 sizes (sm/md/lg) |
| `ui/Dropdown.tsx` | ✅ | Select — consome `useDropdownState` + `DropdownMenu` |
| `ui/DropdownMenu.tsx` | ✅ | Lista UL com auto-sizing (`max-content` + `min-w-full`) |
| `ui/useDropdownState.ts` | ✅ | Hook com open/setOpen/ref + click-outside |
| `ui/ProgressBar.tsx` | ✅ | Barra 0–100 com `role=progressbar` (usada em FormuladorProgress) |
| `ui/HoverOverlay.tsx` | ✅ | Overlay decorativo: escurece pai no hover + pill com hint. Pai precisa de `relative group` |
| `Tabs.tsx` | ⬜ | Se necessário para alternar visualizações |
| `ScrollRow.tsx` | ⬜ | Scroll horizontal com snap |
| `Skeleton.tsx` | ⬜ | Placeholder de loading (opcional) |
| `Modal.tsx` | ⬜ | Se necessário para detalhes |

**Regras para componentes Tailwind puros:**
- Sem libs externas (sem Radix, sem Headless UI). Apenas React + Tailwind.
- Usar CSS vars do design system.
- Props tipadas. Aceitar `className` opcional para extensão.

---

## Seções da Página (ordem de cima para baixo)

| # | Seção | Node | Status | Comportamento |
|---|---|---|---|---|
| — | Header | `405:2044` | ✅ | Logo + nav pill + User |
| 1 | Agendas | `390:567` | ✅ | Stats bar + grid 3 colunas de AgendaCards |
| 2 | Panorama | `390:578` | ✅ | Mapa interativo + ranking IDHM |
| 3 | Base Econômica | `390:581` | ✅ | 12 cards (grid-4) com ícones + bloco Análise gerada por IA (typewriter) |
| 4 | Riscos | `390:594` | ✅ | **Dinâmico** — extrai top 3 alert/warning das agendas |
| 5 | Recursos | `390:600` | ✅ | Emendas + convênios (dados estáticos) |
| 6 | Capacitação | `390:611` | ✅ | Lista de cursos (dados estáticos) |
| 7 | Casos de Sucesso | `390:623` | ✅ | Scroll horizontal de cards |
| 8 | Assistente IA | `390:635` | ✅ | Placeholder com botões de ação |
| — | Footer | `419:917` | ✅ | Brand + links + copyright |

**Layout:** `max-width: 1440px`, `padding: 0 var(--spacing-margin)` (120px). Gap entre seções: `var(--spacing-3xl)` (96px) via `flex-col` + `gap` + `py` no `<main>`.

**Títulos e descrições** de seções estão centralizados em `src/data/sections.ts`.

---

## Mapa Interativo da Paraíba

O mapa fica dentro de `SectionPanorama`. Implementado com React Simple Maps + `ZoomableGroup`.

**Comportamento atual:**
- Mapa é somente visualização — **não altera** o município global ao clicar
- Dropdown seleciona o indicador exibido (IDHM, PIB per capita, urbanização, Gini)
- Municípios coloridos por gradiente **vermelho → amarelo → verde** baseado no desempenho
- Município selecionado (global) destacado em **azul** com borda mais grossa
- **Hover** mostra tooltip com nome + valor do indicador
- **Scroll** para zoom in/out, arrastar para pan
- Dados em `src/data/mapa-indicadores.ts` (12 municípios com dados, demais ficam cinza)

**GeoJSON fonte:** `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-25-mun.json`

---

## Riscos Estratégicos (dinâmico)

A seção de riscos **não usa dados estáticos**. Ela extrai automaticamente os indicadores com status `alert` e `warning` das agendas do município selecionado:

1. Filtra indicadores com `status === 'alert'` ou `'warning'`
2. Prioriza alertas sobre atenções
3. Exibe os top 3 como cards (grid 3 colunas)
4. Cada card mostra: label + valor, descrição do risco, contexto

As descrições e contextos de risco estão em `src/data/riscos-contexto.ts` (chave = label do indicador). No futuro, esses textos serão gerados por LLM.

---

## Formulador de Projetos

Rota `/formulador` com fluxo em 10 etapas + conclusão. Layout 3 colunas:

- **Esquerda:** `<ProjectSteps>` — sidebar com as 10 etapas. Cada `<StepIndicator>` deriva status (`unchecked`/`current`/`checked`) de `currentSlug` + `etapasVisitadas`.
- **Centro:** `<FormCard>` — título + subtítulo da etapa + form (`<StepForm slug={…} />`) + footer (Anterior/Próxima/Finalizar).
- **Direita:** `<AIAssistant>` — painel cinza com descrição, exemplos, 4 botões pílula (no-op v1).

**Rotas:**
- `/formulador` → redireciona para `/formulador/identificacao` (index route)
- `/formulador/:stepSlug` → `<FormuladorStep>` dispatcha para um dos 10 forms
- `/formulador/conclusao` → `<FormuladorConclusao>` (sem AIAssistant; com cards resumo)

**Estado:** `FormuladorContext` via `FormuladorProvider` (envolve o App). Um rascunho por município em `localStorage` (`formulador:${ibgeId}`). Troca de município recarrega o rascunho correspondente via render-phase state update. Forma do estado em `src/types/formulador.ts` (`FormuladorState` + `EMPTY_FORMULADOR_STATE`).

**Fonte de verdade das etapas:** `src/data/formulador-etapas.ts` — array de `{ slug, label, nome, titulo, subtitle }` consumido pela sidebar, progress e FormCard. Helpers `findEtapaBySlug`, `findEtapaIndex`.

**"Etapa concluída" é heurística:** uma etapa é marcada como `checked` quando o usuário clica Próxima/Finalizar (via `markVisited(slug)`). Não há validação de campos preenchidos na v1.

**AIAssistant:** conteúdo em `src/data/formulador-ai.ts`. Placeholder estático v1 (mesma descrição/exemplos/ações para as 10 etapas) — no futuro gerado por LLM.

---

## Estado Global

Context API + `useMunicipio` hook. O município default é **Campina Grande** (código IBGE `2504009`).

```ts
// src/hooks/useMunicipio.ts
interface MunicipioState {
  id: string      // código IBGE
  nome: string
  dados: IndicadoresData | null  // JSON carregado
}
```

`MunicipioProvider` (em `src/hooks/`) importa os 3 JSONs e seleciona pelo `id`. Todas as seções consomem via `useMunicipio()`.

---

## Dados

Toda a estrutura de dados está em `src/data/` e `src/types/indicadores.ts`.

| Arquivo | Descrição |
|---|---|
| `municipios/*.ts` | Valores por município (agendas + baseEconomica). Merge com `catalogo.ts` + `thresholds.ts` no provider |
| `catalogo.ts` | Estrutura/labels/ícones das agendas e base econômica (fonte única) |
| `thresholds.ts` | Régua de classificação por indicador (status derivado do valor) |
| `municipios.json` | Lista dos 8 municípios (id, nome, slug) |
| `sections.ts` | Títulos e descrições de todas as seções (centralizado) |
| `mapa-indicadores.ts` | Valores de indicadores por município para coloração do mapa |
| `riscos-contexto.ts` | Descrições de risco por indicador (futuro: LLM) |
| `labels.ts` | Labels compartilhados (status, CTAs, panorama, user default) |
| `capacitacao.ts` | Trilhas e cursos da seção Capacitação |
| `recursos.ts` | Cards, URLs e textos da seção Recursos |
| `formulador.ts` | Cards do formulador |
| `ai-assistant.ts` | Placeholder e botões do assistente IA |
| `layout.ts` | navLinks, footerColumns, brandText, copyright |
| `economics.ts` | Texto de análise econômica |

**Interfaces:** ver `src/types/indicadores.ts` para `IndicadoresData`, `Agenda`, `Indicador`, `BaseEconomicaItem`, `Panorama`, etc.

**Regra:** no protótipo, dados vêm de JSON/TS importados. Nunca fetch de API.

---

## Regras de Desenvolvimento

### Testes
- **62 testes** cobrindo smoke tests (9 seções + 27 componentes) e snapshot tests (19 componentes)
- Rodar `npm run test:run` antes de commitar
- Se mudanças CSS intencionais quebrarem snapshots: revisar diff → `npx vitest run -u` → commitar snapshots atualizados
- Mocks em `src/test/mocks/` (Leaflet, MunicipioProvider)

### CSS — Design System Classes

A partir da 0.7.0, tokens do design system (spacing, borderRadius, backgroundColor, textColor, fontWeight) estão integrados ao `tailwind.config.js`. Isso significa que classes como `gap-md`, `p-sm`, `rounded-sm`, `bg-surface`, `text-inactive` são **nativas do Tailwind** — não precisam estar declaradas em `@layer components`.

**Convenções:**
- **Border radius:** `rounded-sm/md/lg/xl/full` (Tailwind resolve para as CSS vars `--radius-*`; `rounded-full` preserva `9999px` para círculos perfeitos)
- **Gap / Padding:** `gap-2xs` a `gap-3xl` / `p-sm`, `px-md`, `pt-lg`, etc. (mapeados para `--spacing-*`)
- **Cor de texto:** `text-inactive`, `text-accent` (override; cor default já vem nas `.typo-*`)
- **Backgrounds:** `bg-primary`, `bg-surface`, `bg-surface-secondary`, `bg-accent`

**Classes compostas ainda declaradas em `index.css` (@layer components):**
- `.typo-*` (16 estilos tipográficos)
- `.card-surface`, `.card-surface-secondary`, `.card-hoverable`
- `.flex-center`, `.flex-between`, `.flex-col-start`
- `.grid-2`, `.grid-3`, `.grid-4`, `.grid-5`
- `.status-{success,warning,alert}-{bg,dot}`
- `.divider`, `.scrollbar-hide`, `.section-container`, `.typewriter-caret`

> **Regra:** usar as classes nativas do Tailwind (via tokens) ao invés de arbitrary values. Ex: `gap-md` e não `gap-[var(--spacing-md)]`; `rounded-sm` e não `rounded-[var(--radius-sm)]`.

### Componentes
- Estrutura de pastas espelha os grupos do Figma: `Agenda/Card` → `src/components/agenda/AgendaCard.tsx`
- Sempre incluir o Node ID do Figma como comentário no topo do componente
- Primitivos compartilhados na raiz de `src/components/`
- Componentes Tailwind puros em `src/components/ui/`
- **Nunca use Shadcn/ui**

### TypeScript
- Tipar todas as props explicitamente
- Sem `any`. Use `unknown` se necessário e faça type guard
- Interfaces em `src/types/`

### Commits e Documentação
- **Commitar proativamente** após cada mudança lógica, sem esperar o usuário pedir. Commits são a medida de controle do usuário — ele revisa e aprova os commits conforme o desenvolvimento avança.
- Commits granulares — um commit por mudança lógica (ex: 1 componente novo = 1 commit, 1 fix = 1 commit)
- Sempre atualizar `CHANGELOG.md` a cada commit relevante
- Co-author tag obrigatória

---

## Comandos

```bash
npm install --legacy-peer-deps  # Necessário por react-simple-maps + React 19
npm run dev                     # Desenvolvimento local (http://localhost:5173)
npm run build                   # Build de produção (gera /dist)
npm run preview                 # Preview do build local
npm run lint                    # ESLint
npm run test                    # Vitest em modo watch
npm run test:run                # Vitest single run (CI)
npx vitest run -u               # Atualizar snapshots após mudanças CSS intencionais
```

---

## Checklist antes de PR

- [ ] Componente segue o design do Figma (node referenciado no comentário)
- [ ] CSS variables usadas corretamente (sem valores hardcoded)
- [ ] Props tipadas com TypeScript
- [ ] Sem `console.log` no código
- [ ] Testes passam (`npm run test:run`)
- [ ] Build passa sem erros (`npm run build`)
- [ ] Funciona no viewport 1440px
- [ ] CHANGELOG.md atualizado

---

## Links úteis

- Figma: `https://www.figma.com/design/kcntOAen2AiyqvPUVbnsJh/Plataforma?node-id=257-3`
- GeoJSON Paraíba (IBGE): `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-25-mun.json`
- React Simple Maps: `https://www.react-simple-maps.io`
