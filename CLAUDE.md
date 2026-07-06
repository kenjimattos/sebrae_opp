# CLAUDE.md — Plataforma OPP

Guia de desenvolvimento para a Plataforma OPP (Observatório de Políticas Públicas).
Leia este arquivo inteiro antes de começar qualquer tarefa.

> **Status atual:** Protótipo funcional com Hero + 8 seções implementadas, mapa interativo da Paraíba, estado global por município, e dados para 8 municípios (João Pessoa, Campina Grande, Queimadas, Conde, Caaporã, Pitimbu, Monteiro, Cabaceiras). Viewport desktop 1440px. Dark mode configurado via tokens mas sem toggle na UI. **Rota `/formulador` implementada** — fluxo em 10 etapas + tela de conclusão com exportação PDF, persistência por município em `localStorage`. **Páginas `/trilhas`, `/oportunidades` e `/comunidade` implementadas.** **Microsoft Clarity** integrado (opt-in LGPD, apenas build de produção) com 13 eventos customizados para o teste moderado com usuários.

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
| Analytics | Microsoft Clarity (`@microsoft/clarity`) — opt-in LGPD, só em produção |
| Deploy (protótipo) | Vercel |
| Deploy (produção) | Servidor Sebrae — build estático servido via Nginx/Apache |

**Não usamos Shadcn/ui.** Componentes vêm do Figma; o que faltar é feito com Tailwind puro.

**Regras para componentes Tailwind puros:**
- Sem libs externas (sem Radix, sem Headless UI). Apenas React + Tailwind.
- Usar CSS vars do design system.
- Props tipadas. Aceitar `className` opcional para extensão.

### Sobre o build

O frontend gera um **build estático** (`vite build` → pasta `dist/`). A partir da fase de backend existe também uma **API de leitura** (`server/`, Node/Fastify) que lê o MongoDB `DadosOPP` e alimenta o frontend via `fetch('/api/...')`. Em produção o Nginx serve o `dist/` **e** faz proxy de `/api/*` para o processo Node (ver [Backend / API](#backend--api)). Os TS/JSON estáticos de dados de indicadores foram removidos — os dados vêm do banco.

> **Nota:** `react-simple-maps@3` + `prop-types` requerem `npm install --legacy-peer-deps` com React 19.

---

## Design Tokens

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
- Dados em `src/data/indicadores/mapa.ts` (12 municípios com dados, demais ficam cinza)

**GeoJSON fonte:** `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-25-mun.json`

---

## Riscos Estratégicos (dinâmico)

A seção de riscos **não usa dados estáticos**. Ela extrai automaticamente os indicadores com status `alert` e `warning` das agendas do município selecionado:

1. Filtra indicadores com `status === 'alert'` ou `'warning'`
2. Prioriza alertas sobre atenções
3. Exibe os top 3 como cards (grid 3 colunas)
4. Cada card mostra: label + valor, descrição do risco, contexto

As descrições e contextos de risco estão em `src/data/indicadores/descricoes/riscos.ts` (chave = label do indicador). No futuro, esses textos serão gerados por LLM.

---

## Formulador de Projetos

Rota `/formulador` com fluxo em 10 etapas + conclusão. Layout 3 colunas:

- **Esquerda:** `<ProjectSteps>` — sidebar com as 10 etapas. Cada `<StepIndicator>` deriva status (`unchecked`/`current`/`checked`) de `currentSlug` + `etapasVisitadas`.
- **Centro:** `<FormCard>` — título + subtítulo da etapa + form (`<StepForm slug={…} />`) + footer (Anterior/Próxima/Finalizar).
- **Direita:** `<AIAssistant>` — painel cinza com descrição, exemplos, 4 botões pílula (no-op v1).

**Rotas:**
- `/formulador` → redireciona para `/formulador/identificacao` (index route)
- `/formulador/:stepSlug` → `<FormulatorStep>` dispatcha para um dos 10 forms
- `/formulador/conclusao` → `<FormulatorConclusion>` (sem AIAssistant; com cards resumo)

**Estado:** `FormulatorContext` via `FormulatorProvider` (envolve o App). Um rascunho por município em `localStorage` (`formulator:${municipalityId}`). Troca de município recarrega o rascunho correspondente via render-phase state update. Forma do estado em `src/types/formulator.ts` (`FormulatorState` + `EMPTY_FORMULATOR_STATE`).

**Fonte de verdade das etapas:** `src/data/formulator/steps.ts` — array de `{ slug, label, name, title, subtitle }` consumido pela sidebar, progress e FormCard. Helpers `findStepBySlug`, `findStepIndex`.

**"Etapa concluída" é heurística:** uma etapa é marcada como `checked` quando o usuário clica Próxima/Finalizar (via `markVisited(slug)`). Não há validação de campos preenchidos na v1.

**AIAssistant:** conteúdo em `src/data/formulator/ai-assistant.ts`. Placeholder estático v1 (mesma descrição/exemplos/ações para as 10 etapas) — no futuro gerado por LLM.

---

## Analytics (Microsoft Clarity)

Camada de instrumentação client-side para **teste moderado com 10 participantes em 7 máquinas**. Coleta heatmaps, gravações de sessão e eventos customizados.

**Arquitetura:**
- `src/utils/analytics.ts` — wrapper único. API: `initAnalytics`, `grantConsent`/`denyConsent`, `trackEvent(name, props?)`, `setTag(key, value)`, `identifySession(customId)`. Só efetiva quando `import.meta.env.PROD === true` **e** `VITE_CLARITY_ID` está preenchido **e** o usuário aceitou o consentimento. Em dev/preview é no-op silencioso.
- `src/components/AnalyticsTracker.tsx` — montado dentro do `<BrowserRouter>`. Inicializa Clarity se já houver consentimento, identifica a sessão via `?participante=XX` na URL (etiqueta pra cruzar gravações com as máquinas do teste), e dispara `pagina_visitada` a cada `useLocation()`.
- `src/components/ui/ConsentBanner.tsx` — banner LGPD fixado na base. Só aparece na primeira visita; decisão persiste em `localStorage` (`opp-clarity-consent` = `granted` | `denied`).

**Variável de ambiente:** `VITE_CLARITY_ID` (ver `.env.example`). Deixada em branco em dev/preview. `.env` está no `.gitignore`.

**Eventos customizados (13):**
- Navegação: `pagina_visitada`, `hero_bloco_clicado`, `nav_header_clicado`
- Município: `municipio_alterado` (+ `setTag('municipio')` pra filtrar gravações)
- Mapa: `mapa_ativado`, `indicador_mapa_alterado`
- Formulador: `formulador_iniciado`, `formulador_step_visitado`, `formulador_step_concluido` (com `tempo_ms`), `formulador_abandonado`, `formulador_concluido`
- Descoberta: `tooltip_aberto` (dedupe por instância), `cta_externo_clicado`

**Regras ao instrumentar novo evento:**
- Nome sempre em `snake_case`, em português. Props em `snake_case` também.
- Chamar via `trackEvent('nome', { ... })` — nunca importar `clarity` direto em componentes.
- Se o evento puder disparar em hover/scroll, **dedupe por instância** (ver padrão em tooltip).
- Não logar PII. `?participante=XX` é pseudonimizado (número sorteado para o teste).

**Replay na Vercel:** o replay do Clarity carrega CSS/JS do site num iframe em `clarity.microsoft.com`. `vercel.json` precisa servir `/assets/*` com `Access-Control-Allow-Origin: *`, senão as gravações renderizam sem estilo.

---

## Estado Global

Context API + `useMunicipality` hook. O município default é **Campina Grande** (código IBGE `2504009`).

```ts
// src/hooks/useMunicipality.ts
interface MunicipalityState {
  id: string      // código IBGE
  name: string
  data: IndicatorsData | null  // JSON carregado
}
```

`MunicipalityProvider` (em `src/hooks/`) busca a **lista de municípios** da API no boot e os **dados do município selecionado** sob demanda (`fetch('/api/municipalities/:id')`), com estado `loading`/`error`. Expõe `municipality`, `municipalities` (lista) e `setMunicipality`. Todas as seções consomem via `useMunicipality()`. O client fica em `src/data/api.ts`.

---

## Dados

Toda a estrutura de dados está em `src/data/` e `src/types/indicators.ts`, organizada por domínio:

| Caminho | Descrição |
|---|---|
| `indicators/catalog.ts` | Labels/ícones/unidades usados pelos `descriptions/*` (o banco é a fonte de verdade da estrutura e dos valores — via API) |
| `indicators/descriptions/*.ts` | Conteúdo de InfoTooltip (agendas, economic-base, indicators, risks) — futuro: LLM |
| `indicators/status-labels.ts` | `StatusType` → texto. `statusLabels` (Bom/Atenção/Alerta) + `statusLabelsPanorama` (usa "Crítico") |
| `home/sections.ts` | Títulos, descrições e labels de seção (inclui `agendas.statsLabel`, `panorama.labels.*`) |
| `home/{training,case-studies,economics,resources,formulator,ai-assistant}.ts` | Conteúdo das seções da home |
| `formulator/steps.ts` | Fonte de verdade das 10 etapas do formulador |
| `formulator/ai-assistant.ts` | Conteúdo do AIAssistant por etapa |
| `geo/paraiba.json` | GeoJSON da Paraíba (IBGE) — 386kb |
| `layout.ts` | navLinks, footerColumns, brandText, copyright |

**Interfaces:** ver `src/types/indicators.ts` para `IndicatorsData`, `Agenda`, `Indicator`, `EconomicBaseItem`, `Panorama`, etc.

**Regra:** os dados de indicadores (agendas, valores, base econômica, lista de municípios) vêm da **API** (`src/data/api.ts` → `server/`), não de arquivos estáticos. Conteúdo editorial (descrições, textos de seção, etapas do formulador) continua em `src/data/`.

---

## Backend / API

API de **leitura** sobre o MongoDB `DadosOPP`, em `server/` (Node ≥20 + **Fastify** + driver `mongodb`, TypeScript). Roda como processo na máquina da app (**10.1.100.99**) e lê o banco (**10.1.141.23**); o Nginx serve o `dist/` e faz proxy de `/api/*`. **Só leitura** — quem escreve no banco é o ETL (`database/`).

**Rotas:**

| Rota | Devolve |
|---|---|
| `GET /api/health` | `{ ok, db }` |
| `GET /api/municipalities` | `[{ id, name, slug }]` — seletor |
| `GET /api/municipalities/:id` | `IndicatorsData` (agendas + base econômica, **status já calculado**) |
| `GET /api/map` | `{ options, municipalities }` — valores por município (mapa) |

**DB-driven:** o servidor monta agendas/base econômica de `agendas` + `indicators.placements` e deriva o status do campo `threshold` de cada indicador no banco (sem tabela hardcoded). Indicador sem documento no banco (ex.: ainda não implementado) simplesmente não é retornado. O shape espelha `src/types/indicators.ts`. Detalhes de deploy (systemd + Nginx) em `server/README.md`.

**Regra ao mexer na API:** manter o contrato alinhado a `src/types/indicators.ts`; a lógica de classificação vive no banco (`threshold`) e em `server/src/status.ts` — nunca inventar cortes (ver `database/MAPEAMENTO_BASE_DOS_DADOS.md`).

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
- Primitivos compartilhados na raiz de `src/components/`
- Componentes Tailwind puros em `src/components/ui/`

### TypeScript
- Tipar todas as props explicitamente
- Sem `any`. Use `unknown` se necessário e faça type guard
- Interfaces em `src/types/`

### Commits e Documentação
- **Commitar proativamente** após cada mudança lógica, sem esperar o usuário pedir. Commits são a medida de controle do usuário — ele revisa e aprova os commits conforme o desenvolvimento avança.
- Commits granulares — um commit por mudança lógica (ex: 1 componente novo = 1 commit, 1 fix = 1 commit)
- Sempre atualizar `CHANGELOG.md` a cada commit relevante

---

## Comandos

Frontend (raiz):

```bash
npm install --legacy-peer-deps  # Necessário por react-simple-maps + React 19
npm run dev                     # Desenvolvimento local (http://localhost:5173; /api → :3000 via proxy)
npm run build                   # Build de produção (gera /dist)
npm run preview                 # Preview do build local
npm run lint                    # ESLint
npm run test                    # Vitest em modo watch
npm run test:run                # Vitest single run (CI)
npx vitest run -u               # Atualizar snapshots após mudanças CSS intencionais
```

API (`server/`) — precisa da API rodando para o frontend carregar dados em dev:

```bash
cd server
npm install
cp .env.example .env            # preencher MONGO_URI (DadosOPP em 10.1.141.23)
npm run dev                     # tsx watch, porta 3000
npm run build && npm start      # produção: tsc → dist/, node dist/index.js
```