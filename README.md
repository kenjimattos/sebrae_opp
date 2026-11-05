# PIPPA — Plataforma de Inteligência de Políticas Públicas Aplicada

Plataforma de dados municipais para o Sebrae Paraíba. Consolida indicadores
socioeconômicos, agendas prioritárias, análise por IA e oportunidades de recursos
em uma interface unificada para gestores públicos.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript 6 |
| Estilização | Tailwind CSS v3 + CSS Variables (design tokens) |
| Roteamento | React Router v7 |
| Mapa | SVG custom gerado do GeoJSON da Paraíba (IBGE) — sem lib de mapa |
| IA | Vertex AI (Gemini), por service account, via `POST /api/ai` — fetch puro, sem SDK |
| Backend | API de leitura Node/Fastify (`server/`) sobre MongoDB `DadosOPP` |
| Dados / ETL | MongoDB `DadosOPP` alimentado pelo ETL em `database/` (lake → seeds) |
| Deploy | Nginx serve `dist/` + proxy `/api/*` para o processo Node |

Não há **libs de UI** (Shadcn, Radix, Headless UI): os componentes vêm do Figma e o que
falta é React + Tailwind puro. Também não há dados de indicador estáticos no frontend —
valores vêm sempre de `/api/*`; só o conteúdo editorial (textos, descrições, etapas do
formulador) mora em `src/data/`.

O frontend gera um **build estático** (`vite build` → `dist/`) e consome a **API de
leitura** (`server/`), que lê o MongoDB `DadosOPP`. Ver
[Deploy](#deploy) e [`server/README.md`](server/README.md).

## Funcionalidades

A Home abre com a **visão estadual** e segue para a **Jornada do Município Empreendedor**:
uma `SideNav` com **4 pilares**; os que têm mais de um **modo de visualização** alternam via
`ModeToggle`.

- **Entrada** (`/`) — escolha de UF: escolher a Paraíba leva a `/home`. Não há autenticação
  efetiva: `/home` abre direto.
- **Visão estadual** — indicadores da PB no grão UF (`/api/estado`), com a posição entre as
  27 UFs e as 9 do Nordeste, sem semáforo.
- **Ambiente de negócio** — 3 modos:
  - *Eixos prioritários* — cards das 6 agendas com as barras de indicador, e um
    **farol** por agenda (média da gravidade dos indicadores que classificam; agenda sem
    nenhum fica neutra). O corte sempre vem do `threshold` **no banco**, sem tabela
    hardcoded, mas ele tem **duas procedências** — e a UI é obrigada a dizer qual é:
    **faixa oficial da fonte** (6 indicadores, onde "Bom" quer dizer "atende ao padrão")
    ou **tercil entre os 223 municípios da PB** (11 indicadores, onde "Bom" quer dizer
    só "está no terço de cima do estado"). Os 5 que restam não classificam — a
    distribuição não separa ou a direção é ambígua — e não mostram a barra.
  - *Panorama socioeconômico* — só os cards de base econômica (IDH-M, IDEB, GINI, PIB
    per capita, MEIs/MEs/EPPs, etc.), que por design nunca têm semáforo.
  - *Análise do município* — a análise por IA sozinha. Substituiu o modo
    *Riscos estratégicos*.
- **Mapeamento de recursos** — modo *Emendas*: emendas parlamentares federais e estaduais
  por município (`/api/emendas`), com o mapa da PB.
- **Cursos e boas práticas** — modos *Cursos* (recorte do acervo, com deep link para a
  página `/trilhas`) e *Boas práticas* (casos de sucesso).
- **Formulador de projetos** — painel único: fluxo em 10 etapas + revisão, com campos
  assistidos por IA e rascunho por município em `localStorage`.
- **`/trilhas`** — catálogo full-bleed do acervo da Escola Virtual do Governo: billboard
  de abertura, fileiras por eixo e pôster cuja arte é a **carga horária** do curso. As
  contagens (trilhas, cursos, horas) são derivadas de `catalogLoad`, nunca digitadas.
- **Chat global** — FAB na Home (`ChatButton`/`ChatPanel`), sobre o mesmo `/api/ai`.
- **Mapa da Paraíba** — SVG gerado do GeoJSON do IBGE (`ParaibaOutlineMap`).
- **Seletor de município** — 223 municípios da PB vindos da API; troca sem "piscar"
  (stale-while-revalidate no provider).

> **Não há rota catch-all.** As rotas são exatamente `/`, `/home` e `/trilhas`
> (`src/App.tsx`). Qualquer outra URL renderiza tela em branco — inclusive
> `/oportunidades` e `/comunidade`, que existiram e podem aparecer em links antigos.

## Municípios

Os **223 municípios da Paraíba** vêm de `GET /api/municipalities`. A sessão começa sem
município escolhido. A cobertura de indicadores por município depende dos
seeds já aplicados pelo ETL (`database/`); indicador sem documento no banco simplesmente
não é retornado.

## Desenvolvimento

O frontend consome a API, então em dev são **dois processos**: o Vite (`:5173`) faz proxy
de `/api` para o Node (`:3000`). A API precisa alcançar o MongoDB `DadosOPP` — o que exige
a VPN do Sebrae.

```bash
# 1) API (em outro terminal)
cd server
npm install
cp .env.example .env             # preencher MONGO_URI
npm run dev                      # tsx watch, porta 3000

# 2) Frontend (na raiz)
npm install --legacy-peer-deps   # obrigatório: peer deps do React 19
cp .env.example .env.local       # preencher GOOGLE_SERVICE_ACCOUNT_JSON (IA em dev)
npm run dev                      # http://localhost:5173 (/api → :3000 via proxy)

npm run build                    # build de produção (NÃO compila tests/)
npm run preview                  # serve o dist/
npm run lint
npm run test                     # client/jsdom + server/node
npm run typecheck                # tsc do app E dos testes — é este antes de commitar
```

> Em dev o `/api/ai` é atendido pelo **middleware do Vite**, não pelo Fastify — então a
> chave da IA vai no `.env.local` da raiz, e não no `server/.env`.

> **Testes:** ficam em `tests/`, em dois projetos do Vitest — `tests/client/`
> (jsdom: utilitários e componentes) e `tests/server/` (node: régua do status, rotas,
> cache, guardrails da IA). Eles **não entram no `npm run build`**: `tests/server/`
> importa `server/src/`, que importa `mongodb` e `dotenv` de `server/node_modules` —
> instalado à parte —, e enquanto estavam no `tsc -b` do build derrubavam todo ambiente
> que só instala a raiz. O comando a rodar antes de commitar é **`npm run typecheck`**,
> que cobre o app **e** os testes; o `build` não cobre.

### Variáveis de ambiente

| Arquivo | Variável | Descrição |
|---|---|---|
| `.env.local` (raiz) | `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account da IA: o `.json` inteiro, formato padrão do GCP, numa linha. Traz a **chave privada**: **sem prefixo `VITE_`**, senão vaza no bundle do client. |
| `.env.local` (raiz) | `VERTEX_MODEL` / `VERTEX_LOCATION` | Opcionais (default `gemini-3.8-flash` / `global`, em `api/_lib/vertex.ts`). O que existe é por projeto — conferir com chamada real antes de trocar. |
| `server/.env` | `MONGO_URI` / `MONGO_DB` | Conexão com o MongoDB `DadosOPP` (host `10.1.141.23`, default `DadosOPP`). |
| `server/.env` | `PORT` / `HOST` | Porta/host da API (default `3000` / `0.0.0.0`). |
| `server/.env` | `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account da IA **em produção**, onde o `/api/ai` é servido pelo Fastify. Opcional: sem ela a API sobe e só essa rota responde 503 `unavailable`. |
| `server/.env` | `VERTEX_MODEL` / `VERTEX_LOCATION` | Opcionais, mesmos defaults do `.env.local`. |
| `server/.env` | `AI_RATE_PER_MIN` / `AI_RATE_PER_DAY` / `AI_DAILY_CAP` | Travas de volume do `/api/ai` (default 10/min e 150/dia por IP, 3000/dia no total). |
| `server/.env` | `PAYLOAD_CACHE_TTL_MS` | TTL do cache das rotas de leitura (default 5 min). |

## API de leitura

`server/` (Node ≥20 + Fastify) só **lê** — quem escreve é o ETL em `database/`.

| Rota | Devolve |
|---|---|
| `GET /api/health` | `{ ok, db }` |
| `GET /api/municipalities` | `[{ id, name, slug }]` |
| `GET /api/municipalities/:id` | `IndicatorsData` — status já calculado |
| `GET /api/map` | `{ options, municipalities }` — valores para colorir o mapa |
| `GET /api/emendas` | `EmendasData` — as duas esferas de uma vez |
| `GET /api/estado` | `StateData` — os 8 indicadores da PB no grão UF, com série |
| `POST /api/ai` | resposta do LLM para uma task de IA |

Agendas e base econômica são montadas de `agendas` + `indicators.placements`; o status vem
do `threshold` de cada indicador no banco. **Nunca inventar cortes de classificação** — a
régua vive no banco e em `server/src/indicadores/status.ts`, documentada em
[`database/MAPEAMENTO_BASE_DOS_DADOS.md`](database/MAPEAMENTO_BASE_DOS_DADOS.md).

Nas **emendas**, zero no estadual vira `null` (o município é inferido de texto livre, então
zero significa "não atribuímos"); no federal continua `0`, porque lá a origem é censo por
código IBGE. Coleção vazia responde **503**, nunca payload zerado.

## Integração de IA

Quatro superfícies, todas sobre `POST /api/ai`:

1. **Modal do indicador** — a explicação e as perguntas sugeridas são **pré-gravadas**
   (`src/data/indicators/descriptions/indicator-ai.ts`); só a pergunta livre chama o LLM.
2. **Formulador** — `AiField` nos campos da allowlist `AI_FIELD_IDS`, geração de objetivos
   (etapa 3), indicadores (etapa 7) e rubricas (etapa 8, só nomes) + o painel `AIAssistant`.
3. **Análise do município** — a task `economic-analysis` recebe os cards da base econômica
   estruturados e o resumo dos indicadores com a régua **e a procedência dela**; o
   prompt proíbe citar
   número fora desse contexto e proíbe classificar o que não vem com status. Mora em
   `analysis/AIAnalysis` e sai num lugar só: o modo *Análise do município*.
4. **Chat global** (`ChatButton`/`ChatPanel`), com os indicadores e as emendas do município.

Contrato em `src/types/ai.ts` (união `AiTaskRequest`); núcleo em `api/_lib/`
(`vertex.ts`, `llm.ts`, `prompts.ts`, `handler.ts`). **Dois transportes sobre a mesma fonte**:
o middleware de dev do Vite e o `POST /api/ai` no
Fastify (`server/src/routes.ts`) — este é o que atende o servidor Sebrae. Client:
`src/data/ai.ts` + `useAiTask`.

> Capacidade nova = novo literal na união + prompt em `prompts.ts`. **Nunca** um endpoint
> paralelo. Tamanho de resposta se controla pedindo no prompt, e o layout absorve a
> sobra: teto por task (`MAX_TOKENS_BY_TASK`, hoje vazio) só trunca.

## Estrutura

Três camadas: o **frontend** (`src/` + `api/`), a **API de leitura** (`server/`) e o
**ETL + seeds** do banco (`database/`).

```
src/                          # Frontend React
├── components/               # Componentes por grupo do Figma
│   ├── agenda/               # AgendaExpandable, IndicatorBar, IndicatorModal, ModeEixos
│   ├── economics/            # EconomicsCard, ModeEconomics
│   ├── analysis/             # ModeAnalysis, AIAnalysis
│   ├── resources/            # ModeResources, EmendasEsferaCard, EmendasFuncaoTable
│   ├── estado/               # StateHeader, StateIndicatorCard, BreakdownBars
│   ├── brand/                # PippaWordmark
│   ├── training/             # ModeTraining + catálogo de /trilhas
│   │                         #   (CatalogBillboard, CatalogRow, CoursePoster, TrailNav)
│   ├── case-studies/         # ModeCaseStudies, CaseStudiesCard
│   ├── formulator/           # ModeFormulator + FormulatorForm + 10 steps + revisão
│   ├── chat/                 # ChatButton, ChatPanel (chat global da Home)
│   ├── sections/             # SectionHero, SectionEstado, SectionJornada
│   ├── layout/               # Layout, SiteHeader, SideNav, CitySelector, StateSelector
│   ├── map/                  # OutlineMap, ParaibaOutlineMap, BrasilOutlineMap, MunicipalityMap
│   ├── ui/                   # Primitivos Tailwind: Card, Modal, ModeToggle,
│   │                         #   ThemeToggle, Tooltip, buttons/ (Button, Chip…)
│   └── icons/                # Re-exports Lucide
├── data/                     # api.ts + ai.ts (clients) e conteúdo editorial:
│                             #   indicators/, home/, formulator/, chat/, geo/, layout.ts
├── hooks/                    # MunicipalityProvider, FormulatorProvider, AuthProvider,
│                             #   useEmendas, useEstado, useAiTask, useTheme, useTypewriter…
├── types/                    # indicators.ts, emendas.ts, estado.ts, formulator.ts, ai.ts
├── pages/                    # Login (/), Home (/home), Trails (/trilhas)
├── utils/                    # emendas, economics, courseLoad, statusStyles…
└── index.css                 # Design tokens + classes compostas (@layer components)

api/                          # Núcleo de IA compartilhado
└── _lib/                     # handler, prompts, vertex, llm, guardrails (fonte única)

server/                       # API de leitura (Node/Fastify) — ver server/README.md
└── src/                      # por DOMÍNIO, não por camada: indicadores/ (a régua),
                              #   municipios/, mapa/, emendas/, estado/, ia/, infra/, types/

database/                     # ETL lake → OPP: seeds MongoDB, geradores Python,
                              #   MAPEAMENTO_BASE_DOS_DADOS.md, RUNBOOK_ETL.md
```

## Design

Tokens extraídos das Figma Variables (Colors, Typography, Spacing), declarados em
`src/index.css` e integrados ao `tailwind.config.js` — usar as classes nativas
(`gap-md`, `rounded`, `text-primary`), nunca arbitrary values. Cor em arbitrary
value é **erro de lint**.

A cor tem três camadas: primitivas (`--primitives-*`, único lugar com hex),
semânticos (`--semantic-*`, o que os componentes consomem) e as classes do
`tailwind.config.js`. Componente nunca lê primitiva direto.

**Tema claro e escuro**, alternados pelo `ThemeToggle` no header (na `/`, solto no canto):
automático (segue o sistema, é o default) → claro → escuro. O tema mora inteiramente
no CSS — nenhum componente tem variante `dark:`; `useTheme` só liga a classe `dark`
no `<html>`. Token novo no `:root` **precisa** entrar no `.dark` também: sem par ele
herda o valor do claro em silêncio, e não há erro que denuncie. Desktop 1440px.

## Deploy

A plataforma é implantada no servidor Sebrae **10.1.100.99** (`NASRVOPPDL01`) e lê o
MongoDB `DadosOPP` em **10.1.141.23**. Dois artefatos, um só deploy:

- **Frontend** — build estático (`vite build` → `dist/`) copiado para
  `/var/www/sebrae_opp/dist`, servido pelo Nginx.
- **API de leitura** (`server/`) — processo Node/Fastify na porta `3000`, gerenciado pelo
  systemd (`opp-api.service`). O Nginx faz proxy de `/api/*` para ela.
  Ver [`server/README.md`](server/README.md).

```
Navegador -> Nginx (:80) --+-- /            -> /var/www/sebrae_opp/dist  (SPA)
                           +-- /api/*        -> 127.0.0.1:3000 (opp-api)  -> MongoDB DadosOPP
```

### Primeiro deploy (uma vez)

1. **Nginx** — `server` block em `/etc/nginx/sites-enabled/sebrae_opp`: `root
   /var/www/sebrae_opp/dist`, SPA fallback (`try_files $uri $uri/ /index.html`) e proxy
   `location /api/ { proxy_pass http://127.0.0.1:3000; proxy_set_header X-Forwarded-For
   $proxy_add_x_forwarded_for; }` (**sem barra no final** no `proxy_pass` — preserva o
   `/api` no path). O `X-Forwarded-For` é **obrigatório**: sem ele o limite por IP do
   `/api/ai` vira limite do site inteiro.
2. **API via systemd** — unit `/etc/systemd/system/opp-api.service` executando
   `node dist/index.js` com `WorkingDirectory` = `server/` (o `dotenv` lê o `server/.env`,
   que precisa do `MONGO_URI`). Depois: `sudo systemctl enable --now opp-api`.
   > `dist/index.js` é um shim gerado no `postbuild`: o entrypoint real é
   > `dist/server/src/index.js` (o tsconfig usa `rootDir: ".."` para compilar o núcleo de
   > IA compartilhado em `api/_lib`). O shim existe justamente para o `ExecStart` acima
   > não precisar mudar.

### Atualizar (a cada release)

```bash
# no servidor, dentro de ~/sebrae_opp
git pull

# frontend
npm install --legacy-peer-deps && npm run build
sudo rsync -a --delete ~/sebrae_opp/dist/ /var/www/sebrae_opp/dist/

# API
cd server && npm install && npm run build
sudo systemctl restart opp-api
```

### Quando reconstruir o que

| Mudou... | Frontend (build + rsync) | API (build + restart) |
|---|---|---|
| Código React/CSS (`src/`) | sim | -- |
| Código da API (`server/src/`) | -- | sim |
| **Só valores no banco** (carga do ETL) | -- | nada: aparecem em até 5 min (TTL do cache) |
| **Catálogo no banco** (`threshold`, rótulos, indicador novo) | -- | **só restart** (o catálogo fica em memória, sem TTL) |

> **Importante:** a API guarda o catálogo em memória desde a primeira requisição, sem TTL.
> Indicador novo, migração de id e ajuste de `threshold`/labels só aparecem **após
> `sudo systemctl restart opp-api`**.

### Verificação pós-deploy

```bash
curl -s http://localhost/api/health          # {"ok":true,"db":"up"}
curl -s http://localhost/api/municipalities  # array dos 223 municípios da PB
```

## Licença

Uso interno Sebrae Paraíba.
