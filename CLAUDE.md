# CLAUDE.md — Plataforma OPP

Observatório de Políticas Públicas do Sebrae PB. Este arquivo traz as **regras e
armadilhas** do projeto; o resto se lê no código. Prefira `grep` a suposição.

> **Esta é a branch `preview/snapshot`** — deploy de aprovação na Vercel, que não
> alcança a rede Sebrae. Aqui `/api/*` é servido por **JSON estático**, não pela API
> Node. A branch de produção é a `main`; ao portar mudanças, ver
> [Backend nesta branch](#backend-nesta-branch).

**Estado:** 1.4.2, espelhando a `main`. Home = `SideNav` com 4 pilares (Ambiente de negócio, Mapeamento de
recursos, Cursos e boas práticas, Formulador de projetos); cada pilar alterna modos
via `ModeToggle`. **223 municípios da PB**, default Campina Grande (`2504009`).
Rotas: `/` (Login), `/home`, `/trilhas`. Desktop 1440px. **Tema claro e escuro**,
com `ThemeToggle` fixo no topo à direita, montado no `Layout` e portanto presente
em todas as rotas (automático → claro → escuro; automático é o default e segue o
sistema). **Instância única** — `useTheme` é estado local, dois consumidores
montados teriam preferências independentes.

> **Não há rota catch-all.** URL desconhecida renderiza tela em branco — inclusive
> `/oportunidades` e `/comunidade`, que existiram e podem estar em links antigos.

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
- **Três controles parecidos, papéis distintos** — escolher pelo papel, não pelo visual:
  `Button` é ação; `Chip` é seleção entre pares lado a lado (estado vem de dados,
  anunciado por `aria-current`/`aria-pressed`); `ModeToggle` troca painel no lugar
  (`role="tablist"` + pill deslizante). `Chip` e `Button` são idênticos na tela **por
  construção** — dividem shell, variantes e tamanhos em `ui/buttons/button-styles.ts`.
  Mexeu em um, mexeu nos dois; não copiar estilo entre eles.

---

## CSS e tokens

Tokens (`--spacing-*`, `--radius-*`, `--semantic-*`, `--primitives-*`…) estão em
`src/index.css` e integrados ao `tailwind.config.js`.

**A cor tem três camadas, na ordem:** `--primitives-*` (o único lugar do projeto com
hex) → `--semantic-*` (o que a UI consome; só esta camada troca por tema) → classes do
`tailwind.config.js`. Componente nunca lê primitiva direto, e primitiva sem consumidor
não fica no arquivo.

> **Regra:** usar as classes nativas, nunca arbitrary values. `gap-md`, não
> `gap-[var(--spacing-md)]`. `rounded-sm`, não `rounded-[var(--radius-sm)]`.
> Para cor isso é **erro de lint** (`no-restricted-syntax` no `eslint.config.js`):
> classe sem cobertura significa token faltando no `tailwind.config.js` — a saída é
> adicioná-lo lá, não contornar. Seguem legítimos: arbitrary de dimensão (`w-[56px]`)
> e `var()` dentro de gradiente/`color-mix` em `style` inline.

Classes de cor disponíveis além das óbvias: `bg-background|surface-tertiary|accent-hover|
accent-surface|{success,warning,alert}-surface|button-*`, `text-primary|on-accent|
{success,warning,alert}|button-label-*`, `border-surface-secondary|surface-tertiary|
text-primary|{success,warning,alert}`.

> **Label sobre fundo colorido acompanha a cor, não o tema.** `--semantic-text-on-accent`
> e `--semantic-button-label-success` invertem entre claro e escuro porque o fundo deles
> inverte (azul escuro ↔ lime claro; verde escuro ↔ verde claro). Escrever `text-white`
> ali dá 1,7:1 num dos temas — já aconteceu duas vezes (`NumberBullet`, botão `success`).

Classes compostas declaradas em `@layer components` (não são geradas pelo Tailwind —
consultar `index.css` antes de inventar equivalente):

```
.typo-display-lg|display|display-sm · .typo-h1..h4 (h4 inclui uppercase)
.typo-title-lg|title-md|title-sm · .typo-body-lg|body|body-sm (+ variantes -bold)
.typo-button-lg|button|button-sm (+ variantes -secondary-)
.card-surface(-secondary) · .card-hoverable · .flex-center|between|col-start
.grid-2..5 · .status-{success,warning,alert,neutral}-{bg,dot} · .glass(-bevel)
.divider · .scrollbar-hide · .section-container · .typewriter-caret · .journey-cue-chevron
.risk-card* (Riscos) · .catalog*, .poster* (/trilhas)
```

> **Foco de teclado é `outline`, nunca `ring`.** `box-shadow` some em alto contraste
> forçado (`forced-colors`), e o gap do `outline-offset` é transparente — funciona
> sobre qualquer fundo, enquanto `ring-offset` precisaria saber se o controle está
> sobre `background` ou sobre `surface`. A base em `button-styles.ts` já aplica;
> componente solto usa `focus-visible:outline outline-2 outline-offset-2 outline-accent`.

> **`line-clamp` aqui serve a altura uniforme em grade, não a economia de espaço.**
> Os quatro usos estão em cartões que ficam lado a lado (`AgendaIndicatorItem`,
> `AgendaExpandable`, `CoursePoster`, `EconomicsCard`), onde texto de tamanho variável
> deixaria a linha serrilhada; dois deles pareiam com `min-h-[Nlh]`, que fixa o mínimo
> enquanto o clamp fixa o máximo. **Fora de grade, não cortar** — bloco que ocupa a
> largura toda e não tem vizinho para alinhar deve crescer com o texto. Já se cortou
> a análise do Panorâma sem motivo, e o corte foi removido inteiro.
> Nota de quem for usar: `-webkit-line-clamp` conta linhas de texto **direto** na caixa.
> Um `<div>` entre a classe e o texto (típico ao envolver um componente, como
> `AiMessage` → `MarkdownLite` → `<p>`) anula o corte **sem erro nenhum** — nada cai,
> nada avisa, e `scrollHeight === clientHeight` passa a dizer que não há texto escondido.
> Por isso os quatro usos põem a classe no próprio `<p>`/`<h4>`. Precisando cortar em
> volta de um componente, use `max-h-*` + `overflow-hidden`, que não depende do
> aninhamento. E lembre que **nada disso é alcançável por teste**: jsdom não calcula
> layout, então mudança de clamp/overflow se confere no navegador.

> **Tamanho que se repete vira token e mora na classe, não no consumidor.** O ponto de
> status divergiu (7px num lugar, 8px noutro) porque cada chamador declarava o seu;
> hoje `--size-status-dot` fica dentro de `.status-*-dot`.

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

A API Node existe em `server/` e o código é **o mesmo da `main`** — inclusive
`/api/emendas` e `POST /api/ai`. Ela não atende esta branch (quem atende é o
snapshot), mas fica em dia de propósito: a suíte de testes é compartilhada e
`tests/server/` compila contra `server/src/`, então um `server/` atrasado quebra o
`tsc` e o build aqui. Ao mexer no `server/`, mexer nas duas branches.

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
- **Tirar campo de um seed não tira do banco.** Os seeds gravam o catálogo com
  `replaceOne` — o documento vira exatamente o que o seed declara. Nem sempre foi
  assim: com o `updateOne` + `$set` de antes, `$set` só tocava nos campos
  mencionados, então remover um campo do objeto fazia o seed **parar de falar**
  dele, não apagá-lo. Foi assim que o `threshold` do `trabalhadores-ct`, tirado em
  junho por não haver faixa oficial na RAIS, seguiu sete semanas classificando 219
  dos 223 municípios em `alert` — e alimentando o modo Riscos com um risco falso.
  Nada avisa: o seed roda, imprime `ok`, e o campo velho fica. Ao mexer em gerador,
  conferir se ele continua com `replaceOne`: os 26 já foram convertidos.
- **Formulador:** dois estados diferentes na sidebar. *Concluída* (check) sai de
  `isStepComplete` em `src/utils/formulatorCompleteness.ts` — campos obrigatórios da
  etapa preenchidos; é ela também que alimenta o "X% concluído". *Em andamento* sai de
  `visitedSteps`, marcado ao clicar Próxima/Finalizar, sem validar nada. O PDF não
  depende de nenhum dos dois: `FormulatorReview` imprime todo campo com texto.
  Rascunho por município em `localStorage` (`formulator:${id}`).
  Fonte de verdade das 10 etapas: `src/data/formulator/steps.ts`.
- **Modo Riscos** (`ModeRisks`) não tem dados estáticos: deriva dos indicadores em
  `alert`/`warning` do município (`src/utils/risks.ts`).
- **Token novo no `:root` precisa entrar no `.dark` também.** Sem par, ele herda o valor
  do tema claro em silêncio — não há erro de CSS, a var só resolve errado. Já mordeu três
  vezes: `--semantic-accent-hover` (azul no hover do FAB lime), as três surfaces de status
  (pasteis claros sobre o navy) e `--semantic-text-secondary` (1,7:1 no `NumberBullet`).
  Hoje os dois blocos são espelho um do outro, na mesma ordem: a paridade se confere por
  diff, e é assim que se confere — nenhum teste pega isso.
- **O tema claro é novo e menos rodado que o escuro.** Até esta versão a aplicação era
  escura por decreto e o `:root` nunca chegava à tela; mudança visual precisa ser olhada
  nos dois temas pelo `ThemeToggle`. Os pares de contraste foram medidos uma vez (AA em
  ambos), mas a calibragem fina do `.glass`/`.glass-bevel` no claro é recente.
- **`/trilhas`:** catálogo de fileiras full-bleed. Duas coisas parecem enfeite e não são.
  (1) A última fileira tem `min-height` de uma viewport (`.catalog-row:last-child`):
  sem ela não há rolagem para a seção chegar ao topo, e a barra de eixos nunca marca o
  último eixo. (2) `--catalog-offset` é fonte única do `scroll-margin-top` das seções e
  dos pôsteres **e** daquele `min-height` — mudar num lugar só dessincroniza.
  O medidor no pé do pôster compara o curso com o mais pesado **da própria trilha**,
  não do catálogo; a mesma carga rende barras diferentes em fileiras diferentes.
- **`max-w-*` no mesmo elemento que tem gutter espreme o conteúdo.** Com
  `box-sizing: border-box`, os 180px de `padding-inline` entram no `max-width` —
  `max-w-3xl` vira ~400px úteis. Pôr o `max-width` num filho sem padding.
- **Testes ficam fora do `npm run build`.** São 156 casos em `tests/`, dois projetos
  do Vitest (client/jsdom, server/node), e `tests/server/` importa `server/src/` —
  que importa `mongodb` e `dotenv`, pacotes de `server/node_modules`, instalado à
  parte. Enquanto os testes estavam no `tsc -b` do build, todo ambiente que só
  instala a raiz quebrava em `Cannot find module 'mongodb'` antes do `vite build`:
  derrubou os deploys da Vercel nas duas branches. Hoje o build compila `src` +
  `api` e os testes têm `tsconfig.tests.json`, rodado por **`npm run typecheck`** —
  que é o comando a usar antes de commitar, não o `build`.
- **Comentário citando componente não é uso.** Numa varredura, três componentes mortos
  (`ui/Grid`, `agenda/AgendaStats`, `formulator/useFormulatorAi`) sobreviveram só porque
  comentários os mencionavam. Ao caçar código morto, procurar `import`, não o nome. E o
  escopo da busca precisa incluir **`api/`**: o handler serverless importa de `src/`
  (ex.: `AI_FIELD_IDS`), então varrer só `src/` produz falso positivo perigoso.
- **Varredura por `.tsx` esquece os `.ts` — e é neles que mora o design system.** A
  migração dos arbitrary values de cor deu-se por concluída com um grep em `--include='*.tsx'`;
  quem tinha o pior caso era `button-styles.ts`, a fonte de estilo de toda a família
  `Button`/`Chip`/`IconButton`. Só apareceu quando a regra de lint rodou. Ao varrer
  estilo, incluir `.ts`.

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
npm run typecheck               # tsc do app + dos testes (o build não cobre tests/)

# A API Node NÃO é necessária em dev nesta branch — o snapshot cobre /api/*.
# Só rodar se for mexer no server/ (e aí é preciso a VPN do Sebrae):
cd server && npm install && cp .env.example .env && npm run dev
```
