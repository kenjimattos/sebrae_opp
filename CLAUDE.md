# CLAUDE.md — Plataforma OPP

Guia de desenvolvimento para a Plataforma OPP (Observatório de Políticas Públicas).
Leia este arquivo inteiro antes de começar qualquer tarefa.

> **Status atual:** Protótipo funcional com 8 seções implementadas, mapa interativo da Paraíba, estado global por município, e dados mock para 3 municípios (João Pessoa, Campina Grande, Patos). Viewport desktop 1440px. Dark mode configurado via tokens mas sem toggle na UI.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript 6 |
| Estilização | Tailwind CSS v3 + CSS Variables (design tokens) |
| Mapa | React Simple Maps + GeoJSON da Paraíba (IBGE) |
| Roteamento | React Router v7 |
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
Typography: --font-size-{display-large|display|display-small|h1|h2|h3|h4|body-lg|body|body-sm|button-lg|button|button-sm}
Spacing:    --spacing-{2xs|xs|sm|md|lg|xl|2xl|3xl|margin}
Radius:     --radius-{sm|md|lg|xl|full}
Colors:     --primitives-{gray|blue|green|yellow|red}-{100..900}
Semantic:   --semantic-{background-primary|surface-primary|surface-secondary|text-primary|text-inactive|...}
Status:     --semantic-{success|warning|alert}{|-surface}
```

> **Regra:** sempre usar CSS variables. Nunca hardcodar cores, tamanhos ou espaçamentos.
> Correto: `className="rounded-[var(--radius-md)] p-[var(--spacing-md)] bg-[var(--semantic-surface-primary)]"`
> Errado: `className="rounded-3xl p-6 bg-white"`

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
│   ├── courses/                       # ⬜ Pendente — diretório vazio
│   ├── case-studies/                  # ⬜ Pendente — diretório vazio
│   ├── formulador/                    # ⬜ Pendente — diretório vazio
│   ├── sections/
│   │   ├── SectionAgendas.tsx        # Figma: 390:567
│   │   ├── SectionPanorama.tsx       # Figma: 390:578
│   │   ├── SectionBaseEconomica.tsx  # Figma: 390:581
│   │   ├── SectionRiscos.tsx         # Figma: 390:594 — dinâmico: extrai alert/warning das agendas
│   │   ├── SectionRecursos.tsx       # Figma: 390:600
│   │   ├── SectionCapacitacao.tsx    # Figma: 390:611
│   │   ├── SectionCasosSucesso.tsx   # Figma: 390:623
│   │   └── SectionAIAssistant.tsx    # Figma: 390:635
│   ├── ui/
│   │   ├── SectionContainer.tsx      # Wrapper 1440px + padding lateral
│   │   ├── Grid.tsx                  # Grid configurável (cols, gap)
│   │   ├── Button.tsx                # primary/secondary/tertiary + tamanhos
│   │   └── Dropdown.tsx              # Select estilizado (button + ul)
│   ├── SectionHeader.tsx             # Figma: SectionHeader (set 327:1963)
│   ├── TitleSubtitle.tsx             # Figma: TitleSubtitle (set 405:1388)
│   ├── CitySelector.tsx              # Figma: CitySelector (509:3274)
│   ├── User.tsx                      # Figma: User (405:2038)
│   └── ParaibaMap.tsx                # Mapa SVG interativo com zoom, tooltip, cores por indicador
├── data/
│   ├── municipios.json               # Lista dos 3 municípios (id IBGE, nome, slug)
│   ├── sections.ts                   # Títulos e descrições centralizados de todas as seções
│   ├── mapa-indicadores.ts           # Dados de indicadores por município para coloração do mapa
│   ├── riscos-contexto.ts            # Descrições e contextos de risco por indicador (futuro: LLM)
│   └── indicadores/
│       ├── joao-pessoa.json
│       ├── campina-grande.json       # Município default — dados extraídos do Figma
│       └── patos.json
├── hooks/
│   ├── useMunicipio.ts               # Hook + Context type + MunicipioState interface
│   └── MunicipioProvider.tsx          # Provider que carrega JSON por município
├── types/
│   └── indicadores.ts                # IndicadoresData, Agenda, Indicador, etc.
├── pages/
│   └── Home.tsx                      # Página principal com todas as seções
├── App.tsx                           # BrowserRouter + MunicipioProvider
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
| User | `405:2038` | `User.tsx` |
| CitySelector | `509:3274` | `CitySelector.tsx` |
| SectionHeader | `327:1963` | `SectionHeader.tsx` |
| TitleSubtitle | `405:1388` | `TitleSubtitle.tsx` |
| Buttons | `378:477` | `ui/Button.tsx` |
| Agenda/Card | `603:1874` | `agenda/AgendaCard.tsx` |
| Agenda/Indicator | `300:32` | `agenda/AgendaIndicator.tsx` |
| Agenda/Badge | `563:3818` | `agenda/AgendaBadge.tsx` |
| Agenda/Stats | `518:3311` | `agenda/AgendaStats.tsx` |
| Economics/Card | `563:4015` | `economics/EconomicsCard.tsx` |
| Economics/Analysis | `368:834` | `economics/EconomicsAnalysis.tsx` |
| Risks/Card | `563:4445` | `risks/RisksCard.tsx` |
| Resources/Card | `287:12` | `resources/ResourcesCard.tsx` |

### ⬜ Pendentes (existem no Figma, não implementados)

| Nome no Figma | Node ID | Notas |
|---|---|---|
| Agenda/Tooltip | `498:1024` | Tooltip de análise |
| Icons | `380:482` | Biblioteca de ícones (usamos SVGs inline por enquanto) |
| TextInput | `603:2011` | Input de texto com variantes |
| Courses/CardRow | `297:8` | Linha de curso |
| Courses/Card | `298:8` | Card de trilha |
| CaseStudies/Card | `288:8` | Card de caso de sucesso |
| Formulador/Card | `296:8` | Card principal do formulador |
| Formulador/FormCard | `696:2665` | Card de formulário |
| Formulador/Progress | `620:4417` | Barra de progresso |
| Formulador/ProjectSteps | `603:2135` | Lista de etapas |
| Formulador/AIAssistant | `603:1803` | Bloco assistente IA |
| Formulador/StepIndicator | `603:1560` | Indicador de passo |

### Componentes Tailwind puros (sem Figma)

| Componente | Status | Notas |
|---|---|---|
| `SectionContainer.tsx` | ✅ | Wrapper 1440px + margin |
| `Grid.tsx` | ✅ | Grid configurável |
| `Button.tsx` | ✅ | primary/secondary/tertiary |
| `Dropdown.tsx` | ✅ | Seletor de indicador do mapa |
| `Tabs.tsx` | ⬜ | Se necessário para alternar visualizações |
| `ScrollRow.tsx` | ⬜ | Scroll horizontal com snap |
| `ProgressBar.tsx` | ⬜ | Para Formulador/Progress |
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
| 3 | Base Econômica | `390:581` | ✅ | 10 cards com ícones + bloco Análise |
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
| `indicadores/*.json` | Dados completos por município (agendas, baseEconomica, panorama) |
| `municipios.json` | Lista dos 3 municípios (id, nome, slug) |
| `sections.ts` | Títulos e descrições de todas as seções (centralizado) |
| `mapa-indicadores.ts` | Valores de indicadores por município para coloração do mapa |
| `riscos-contexto.ts` | Descrições de risco por indicador (futuro: LLM) |

**Interfaces:** ver `src/types/indicadores.ts` para `IndicadoresData`, `Agenda`, `Indicador`, `BaseEconomicaItem`, `Panorama`, etc.

**Regra:** no protótipo, dados vêm de JSON/TS importados. Nunca fetch de API.

---

## Regras de Desenvolvimento

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
- Commits granulares — um commit por mudança lógica
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
```

---

## Checklist antes de PR

- [ ] Componente segue o design do Figma (node referenciado no comentário)
- [ ] CSS variables usadas corretamente (sem valores hardcoded)
- [ ] Props tipadas com TypeScript
- [ ] Sem `console.log` no código
- [ ] Build passa sem erros (`npm run build`)
- [ ] Funciona no viewport 1440px
- [ ] CHANGELOG.md atualizado

---

## Links úteis

- Figma: `https://www.figma.com/design/kcntOAen2AiyqvPUVbnsJh/Plataforma?node-id=257-3`
- GeoJSON Paraíba (IBGE): `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-25-mun.json`
- React Simple Maps: `https://www.react-simple-maps.io`
