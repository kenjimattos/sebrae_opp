# CLAUDE.md — Plataforma OPP

Observatório de Políticas Públicas do Sebrae PB. Este arquivo traz as **regras e
armadilhas** do projeto; o resto se lê no código. Prefira `grep` a suposição.

> **Esta é a branch `preview/snapshot`** — deploy de aprovação na Vercel, que não
> alcança a rede Sebrae. Aqui `/api/*` é servido por **JSON estático**, não pela API
> Node. A branch de produção é a `main`; ao portar mudanças, ver
> [Backend nesta branch](#backend-nesta-branch).

**Estado:** 1.0.0 em produção no servidor Sebrae a partir da `main`. Home = `SideNav` com 4 pilares (Ambiente de negócio, Mapeamento de
recursos, Cursos e boas práticas, Formulador de projetos); cada pilar alterna modos
via `ModeToggle`. **223 municípios da PB**, default Campina Grande (`2504009`).
Rotas: `/` (Login), `/home`, `/trilhas`, `/oportunidades`. Desktop 1440px. Dark mode
por tokens, sem toggle na UI.

---

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind v3 + CSS vars · React Router v7 ·
Fastify + driver `mongodb` no `server/`.

- **Sem libs de UI.** Nada de Shadcn, Radix ou Headless UI — componentes vêm do
  Figma e o que faltar é React + Tailwind puro. O mapa é SVG próprio, sem lib de mapa.
- Props sempre tipadas; aceitar `className` opcional para extensão.
- Sem `any` — use `unknown` + type guard. Interfaces em `src/types/`.
- Pastas espelham os grupos do Figma (`Agenda/Card` → `src/components/agenda/AgendaCard.tsx`).
  Primitivos Tailwind puros em `src/components/ui/`.

---

## CSS e tokens

Tokens (`--spacing-*`, `--radius-*`, `--semantic-*`, `--primitives-*`…) estão em
`src/index.css` e integrados ao `tailwind.config.js`.

> **Regra:** usar as classes nativas, nunca arbitrary values. `gap-md`, não
> `gap-[var(--spacing-md)]`. `rounded-sm`, não `rounded-[var(--radius-sm)]`.

Classes compostas declaradas em `@layer components` (não são geradas pelo Tailwind —
consultar `index.css` antes de inventar equivalente):

```
.typo-display-lg|display|display-sm · .typo-h1..h4 (h4 inclui uppercase)
.typo-body-lg|body|body-sm (+ variantes -bold) · .typo-button-lg|button|button-sm
.card-surface(-secondary) · .card-hoverable · .flex-center|between|col-start
.grid-2..5 · .status-{success,warning,alert}-{bg,dot}
.divider · .scrollbar-hide · .section-container · .typewriter-caret
```

---

## Dados

**Regra central:** dados de indicadores (agendas, valores, base econômica, lista de
municípios, emendas) vêm da **API** (`src/data/api.ts` → `server/`). Conteúdo
**editorial** (descrições de tooltip, textos de seção, etapas do formulador) fica
estático em `src/data/`. Não reintroduzir dados de indicador em arquivo.

Exceção: `src/data/geo/paraiba.json` (GeoJSON do IBGE) é estático — geometria é
editorial, não indicador.

Contratos em `src/types/indicators.ts` (`IndicatorsData`, `Agenda`, `Indicator`,
`IndicatorThreshold`, `EconomicBaseItem`) e `src/types/emendas.ts`.

**Estado global:** `MunicipalityProvider` + `useMunicipality()` — busca a lista no
boot e os dados do município sob demanda, com `loading`/`error`.

---

## Backend nesta branch

O deploy de aprovação roda na **Vercel**, que não alcança o MongoDB do Sebrae
(`10.1.141.23`). Então `/api/*` **não** passa pela API Node aqui: é servido por um
snapshot estático do banco.

| O que | Onde |
|---|---|
| `/api/municipalities` e `/api/municipalities/:id` | `public/api-snapshot/` (223 JSONs + índice) |
| `/api/emendas` | `public/api-snapshot/emendas.json` |
| Roteamento em produção (Vercel) | `rewrites` do `vercel.json` |
| Roteamento em dev | `bypass` do proxy no `vite.config.ts` (espelha os rewrites) |
| `/api/ai` | function serverless `api/ai.ts` (essa sim é real) |

> **Regra:** os dois roteamentos são espelho um do outro. Rota nova servida por
> snapshot = entrada no `vercel.json` **e** no bypass do `vite.config.ts`, senão
> funciona no preview e quebra em dev (ou o contrário).

O snapshot é gerado do banco pelos scripts em `database/scripts/`; o shape é o mesmo
que a API Node devolve, para o frontend não saber a diferença. Ao mudar um contrato,
regerar o snapshot.

A API Node existe em `server/` e é a de produção (`main`), mas nesta branch está
**atrás**: só `health`, `municipalities`, `municipalities/:id` e `map` — sem
`/api/emendas` e sem `/api/ai`. **Não** documentar aqui rota que só existe na `main`.

**DB-driven:** o status de cada indicador vem do `threshold` no banco, tanto na API
quanto no snapshot.

> **Regra:** nunca inventar cortes de classificação — ver
> `database/MAPEAMENTO_BASE_DOS_DADOS.md`.

**Emendas:** zero no **estadual** é `null` (município inferido de texto livre: zero =
"não atribuímos"); no **federal** é `0` de verdade (censo por código IBGE).

---

## Integração de IA (OpenRouter)

Quatro superfícies, todas via `POST /api/ai` (modelo gratuito, fetch puro — sem SDK):

1. **Modal do indicador** (`IndicatorModal`) — explicação e perguntas sugeridas são
   **pré-gravadas** (`descriptions/indicator-ai.ts`); só a pergunta livre chama o LLM.
2. **Formulador** — `AiField` em 17 campos (allowlist `AI_FIELD_IDS`), gerar objetivos
   (etapa 3), indicadores (etapa 7), rubricas (etapa 8, só nomes, sem valores) e o
   painel `AIAssistant`.
3. **Análise do Panorâma** (`EconomicsAnalysis`) — task `economic-analysis` recebe os
   cards da base econômica **estruturados** e o resumo dos indicadores com a faixa
   oficial; o prompt proíbe citar número fora desse contexto e proíbe classificar o
   que não vem com status.
4. **Chat global** (`ChatButton`/`ChatPanel` na Home).

**Arquitetura:** contrato em `src/types/ai.ts` (união `AiTaskRequest`); núcleo em
`api/_lib/` (`openrouter.ts`, `prompts.ts`, `handler.ts`). **Dois transportes sobre a
mesma fonte** (`handler.ts`) nesta branch: function da Vercel (`api/ai.ts`) e
middleware de dev do Vite. A `main` tem um terceiro, `POST /api/ai` no Fastify, que
atende a produção Sebrae. Client: `src/data/ai.ts` + `useAiTask`.

**Regras:**
- Nova capacidade = novo literal na união + prompt em `prompts.ts`. **Nunca** um
  endpoint paralelo.
- Limite de tamanho de resposta se impõe em `maxTokens` (`MAX_TOKENS_BY_TASK` no
  handler), não pedindo no prompt — o modelo ignora o pedido de forma imprevisível.
- `OPENROUTER_API_KEY` fica **só no servidor**; prefixo `VITE_` vazaria no bundle.
  Em dev vai no `.env.local`; no preview, nas env vars do projeto na Vercel.
- O catálogo `:free` rotaciona — conferir `https://openrouter.ai/api/v1/models` antes
  de trocar o default. Free tier ~50 req/dia.

---

## Armadilhas conhecidas

- **Snapshot desatualizado é a falha silenciosa desta branch:** o preview mostra
  números velhos sem erro nenhum. Regerar após qualquer mudança de contrato ou carga
  no banco.
- **Formulador:** "etapa concluída" é heurística — marca ao clicar Próxima/Finalizar,
  sem validar campos. Rascunho por município em `localStorage` (`formulator:${id}`).
  Fonte de verdade das 10 etapas: `src/data/formulator/steps.ts`.
- **Modo Riscos** (`ModeRisks`) não tem dados estáticos: deriva dos indicadores em
  `alert`/`warning` do município (`src/utils/risks.ts`).
- **Testes:** a infra (Vitest + jsdom) segue nos scripts, mas a suíte foi retirada no
  redesign (`src/test/` não existe). Ao reescrever, mockar `src/data/api.ts` — o
  provider faz `fetch`.

---

## Commits

- **Commitar proativamente** após cada mudança lógica, sem esperar o usuário pedir —
  os commits são a medida de controle dele.
- Um commit por mudança lógica. Atualizar `CHANGELOG.md` a cada commit relevante.

---

## Comandos

```bash
npm install --legacy-peer-deps  # obrigatório: peer deps do React 19
cp .env.example .env.local      # IA em dev: OPENROUTER_API_KEY
npm run dev                     # :5173 — /api/* do snapshot; /api/ai atendido pelo Vite
npm run build | preview | lint | test

# A API Node NÃO é necessária em dev nesta branch — o snapshot cobre /api/*.
# Só rodar se for mexer no server/ (e aí é preciso a VPN do Sebrae):
cd server && npm install && cp .env.example .env && npm run dev
```
