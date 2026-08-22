# CLAUDE.md — Plataforma OPP

Guia de desenvolvimento para a Plataforma OPP (Observatório de Políticas Públicas).
Leia este arquivo inteiro antes de começar qualquer tarefa.

> **Status atual (1.0.0 em produção):** Redesign "Jornada do Município Empreendedor" no ar no servidor Sebrae (`10.1.100.99`), servido pelo Nginx com a API de leitura (`server/`) sobre o MongoDB `DadosOPP`. A Home tem uma `SideNav` com **4 pilares** (Ambiente de negócio, Mapeamento de recursos, Cursos e boas práticas, Formulador de projetos); cada pilar alterna **modos de visualização** via `ModeToggle`. Todos os dados de indicadores vêm da **API** (`/api/*`) — **223 municípios da PB**, default Campina Grande. O **Formulador** virou um modo (`ModeFormulator`), não mais uma rota. Rotas: `/` (Login), `/home`, `/trilhas`, `/oportunidades`. Viewport desktop 1440px. Dark mode via tokens, sem toggle na UI.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript 6 |
| Estilização | Tailwind CSS v3 + CSS Variables (design tokens) |
| Roteamento | React Router v7 |
| Mapa | SVG custom gerado do GeoJSON da Paraíba (IBGE) — `ParaibaOutlineMap`, sem lib de mapa |
| Backend | API de leitura Node/Fastify (`server/`) sobre MongoDB `DadosOPP` |
| Deploy (produção) | Servidor Sebrae `10.1.100.99` — Nginx serve o `dist/` + proxy `/api/*` para o processo Node |

**Não usamos Shadcn/ui.** Componentes vêm do Figma; o que faltar é feito com Tailwind puro.

**Regras para componentes Tailwind puros:**
- Sem libs externas (sem Radix, sem Headless UI). Apenas React + Tailwind.
- Usar CSS vars do design system.
- Props tipadas. Aceitar `className` opcional para extensão.

### Sobre o build

O frontend gera um **build estático** (`vite build` → pasta `dist/`). A partir da fase de backend existe também uma **API de leitura** (`server/`, Node/Fastify) que lê o MongoDB `DadosOPP` e alimenta o frontend via `fetch('/api/...')`. Em produção o Nginx serve o `dist/` **e** faz proxy de `/api/*` para o processo Node (ver [Backend / API](#backend--api)). Os TS/JSON estáticos de dados de indicadores foram removidos — os dados vêm do banco.

> **Nota:** instalar o frontend com `npm install --legacy-peer-deps` (conflitos de peer deps com React 19). O mapa **não** usa mais `react-simple-maps`/Leaflet — é SVG puro a partir do GeoJSON.

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

## Mapa da Paraíba (`ParaibaOutlineMap`)

SVG desenhado **na mão** a partir do GeoJSON — sem lib de mapa. O componente
(`src/components/map/ParaibaOutlineMap.tsx`) projeta lon/lat num viewBox e emite um `<path>`
por município. Usado dentro de `SectionAgendas`.

**Comportamento:**
- **Clicar num município troca a seleção global** (`onSelect` → `setMunicipality(id, name, 'map')`). É a porta de entrada quando ainda não há município selecionado ("ou clique no mapa").
- **Hover** destaca o município (fill/stroke de acento) e mostra tooltip com o nome, posicionado pelo cursor.
- Município selecionado fica com `selectedFillColor`/stroke de acento.
- Props opcionais: `values?` (`Record<IBGE, número 0–1>`) para colorir por indicador, `onHover`, cores customizáveis (`fillColor`, `hoverFillColor`, etc.).

**GeoJSON fonte:** `src/data/geo/paraiba.json` (IBGE) — carregado estático (não é dado de indicador; geometria é editorial).

---

## Riscos Estratégicos (dinâmico)

O modo Riscos (`ModeRisks`) **não usa dados estáticos**. Ele extrai automaticamente os indicadores com status `alert` e `warning` das agendas do município selecionado (lógica em `src/utils/risks.ts`):

1. Filtra indicadores com `status === 'alert'` ou `'warning'`
2. Prioriza alertas sobre atenções
3. Exibe os top como cards (`RisksCard`)
4. Cada card mostra: label + valor, descrição do risco, contexto

As descrições e contextos de risco estão em `src/data/indicators/descriptions/risks.ts` (chave = label do indicador). No futuro, esses textos serão gerados por LLM.

---

## Formulador de Projetos

É o **modo `ModeFormulator`** do pilar "Formulador de projetos" da Jornada (não é mais uma rota). Fluxo em 10 etapas + revisão, num layout de colunas:

- **Esquerda:** `<FormulatorProjectSteps>` — sidebar com as 10 etapas. Cada `<FormulatorStepIndicator>` deriva status (`unchecked`/`current`/`checked`) de `currentSlug` + etapas visitadas.
- **Centro:** `<FormulatorForm>` — título + subtítulo da etapa + form (`<StepForm slug={…} />`) + footer (Anterior/Próxima/Finalizar). `<FormulatorProgress>` mostra o avanço.
- **Direita:** `<AIAssistant>` — painel com descrição, exemplos e botões pílula (no-op v1).
- **Revisão:** `<FormulatorReview>` — tela final com cards resumo (sem AIAssistant).

**Estado:** `FormulatorContext` via `FormulatorProvider` (envolve o App). Um rascunho por município em `localStorage` (`formulator:${municipalityId}`). Troca de município recarrega o rascunho correspondente. Forma do estado em `src/types/formulator.ts` (`FormulatorState` + `EMPTY_FORMULATOR_STATE`).

**Fonte de verdade das etapas:** `src/data/formulator/steps.ts` — array de `{ slug, label, name, title, subtitle }` consumido pela sidebar, progress e form. Helpers `findStepBySlug`, `findStepIndex`.

**"Etapa concluída" é heurística:** uma etapa é marcada como `checked` quando o usuário clica Próxima/Finalizar (via `markVisited(slug)`). Não há validação de campos preenchidos na v1.

**AIAssistant:** conteúdo em `src/data/formulator/ai-assistant.ts`. Placeholder estático v1 (mesma descrição/exemplos/ações para as 10 etapas) — no futuro gerado por LLM.

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
| `indicators/status-labels.ts` | `StatusType` → texto (`statusLabels`: Bom/Atenção/Alerta + `none` "Sem classificação") |
| `home/sections.ts` | Títulos e subtítulos: os **4 pilares da Jornada** (`jornadas`), Hero e headers de cada modo |
| `home/{training,case-studies,economics,resources,economic-base}.ts` | Conteúdo dos modos da home |
| `formulator/steps.ts` | Fonte de verdade das 10 etapas do formulador |
| `formulator/ai-assistant.ts` | Conteúdo do AIAssistant por etapa |
| `geo/paraiba.json` | GeoJSON da Paraíba (IBGE) |
| `layout.ts` | navLinks, footerColumns, brandText, copyright |

**Interfaces:** ver `src/types/indicators.ts` para `IndicatorsData`, `Agenda`, `Indicator`, `IndicatorThreshold`, `EconomicBaseItem`, etc.

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

## Integração de IA (OpenRouter)

Quatro superfícies de IA, todas via `POST /api/ai` (modelo **gratuito** do OpenRouter, fetch puro — sem SDK):

1. **Modal do indicador** (`IndicatorModal`, aberto pelo label no `AgendaCard`): explicação + perguntas sugeridas **pré-gravadas** em `src/data/indicators/descriptions/indicator-ai.ts` (tokens `{municipio}/{valor}/{status}`), exibidas com typewriter; só a **pergunta livre** chama o LLM.
2. **Formulador**: `AiField` ("Aprimorar com IA") em 17 campos de texto das etapas 1–10 (allowlist `AI_FIELD_IDS` em `src/types/ai.ts`), "Gerar objetivos específicos" (etapa 3), "Gerar com IA" por grupo de indicadores (etapa 7, `generate-indicators`), "Sugerir rubricas com IA" (etapa 8, `suggest-budget-items` — só nomes, sem valores) e painel `AIAssistant` (ações reais nas 3 primeiras etapas via `useFormulatorAi`).
3. **Análise do Panorâma** (`EconomicsAnalysis`, modo "Panorâma Sócioeconômico"): botão "Gerar análise com IA" chama a task `economic-analysis` com os cards da base econômica (estruturados) e o resumo dos indicadores de agenda; o prompt proíbe citar qualquer número fora desse contexto. Era um texto fixo por município — 8 dos 223 tinham texto próprio e os valores citados estavam defasados em relação aos cards.
4. **Chat global** (`ChatButton`/`ChatPanel` na Home): FAB no gutter direito (180px) → painel lateral multi-turno com resumo dos indicadores do município no system prompt.

**Arquitetura:** contrato em `src/types/ai.ts` (união `AiTaskRequest`: `indicator-question` | `improve-field` | `generate-specific-objectives` | `generate-indicators` | `suggest-budget-items` | `economic-analysis` | `chat`); lógica server em `api/_lib/` (`openrouter.ts` cliente, `prompts.ts` templates pt-BR, `handler.ts` validação/erros). Dois transportes com a **mesma fonte**: function Vercel (`api/ai.ts`) e middleware de dev no `vite.config.ts` (registrado antes do proxy `/api → :3000`). Client: `src/data/ai.ts` + `useAiTask` (mensagens de erro amigáveis; 429 do free tier → aviso de limite).

**Env:** `OPENROUTER_API_KEY` (obrigatória; `.env.local` na raiz em dev, env vars do projeto na Vercel — **nunca** prefixo `VITE_`) e `OPENROUTER_MODEL` (opcional; default em `api/_lib/openrouter.ts`). Catálogo `:free` rotaciona — conferir em `https://openrouter.ai/api/v1/models` antes de trocar o default. Free tier: ~50 req/dia.

**Regras:** novas capacidades de IA = novo literal na união + prompt em `prompts.ts` (não criar endpoints paralelos). Prompts não inventam cortes de classificação — status/threshold continuam vindo do banco. O servidor Fastify (`server/`) **não** tem rota de IA: em produção Sebrae (fase futura) a function precisa ser portada ou o Nginx apontado para outro processo.

---

## Regras de Desenvolvimento

### Testes
- A infra (Vitest + Testing Library + jsdom) segue nos scripts (`npm run test`, `npm run test:run`), mas a **suíte foi retirada no redesign** (`src/test/` não existe) e ainda será reescrita para a arquitetura da Jornada.
- Ao reintroduzir testes: `MunicipalityProvider` faz `fetch('/api/...')` — mockar a camada `src/data/api.ts` (ou o `fetch`) em vez de dados estáticos.

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
npm install --legacy-peer-deps  # Conflitos de peer deps com React 19
cp .env.example .env.local      # IA em dev: preencher OPENROUTER_API_KEY (sem ela, /api/ai devolve missing_key)
npm run dev                     # Desenvolvimento local (http://localhost:5173; /api → :3000 via proxy; /api/ai atendido pelo próprio Vite)
npm run build                   # Build de produção (gera /dist)
npm run preview                 # Preview do build local
npm run lint                    # ESLint
npm run test / test:run         # Vitest (watch / single run) — suíte a reescrever
```

API (`server/`) — precisa da API rodando para o frontend carregar dados em dev:

```bash
cd server
npm install
cp .env.example .env            # preencher MONGO_URI (DadosOPP em 10.1.141.23)
npm run dev                     # tsx watch, porta 3000
npm run build && npm start      # produção: tsc → dist/, node dist/index.js
```