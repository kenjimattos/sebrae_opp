# Plataforma OPP — Observatório de Politicas Publicas

Plataforma de dados municipais para o Sebrae Paraiba. Consolida indicadores socioeconomicos, agendas prioritarias, riscos estrategicos e oportunidades de recursos em uma interface unificada para gestores publicos.

## Screenshot

> *Em breve*

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript 6 |
| Estilizacao | Tailwind CSS v3 + CSS Variables (design tokens) |
| Roteamento | React Router v7 |
| Mapa | SVG custom gerado do GeoJSON da Paraiba (IBGE) — sem lib de mapa |
| Backend | API de leitura Node/Fastify (`server/`) sobre MongoDB `DadosOPP` |
| Dados / ETL | MongoDB `DadosOPP` alimentado pelo ETL em `database/` (lake -> seeds) |
| Analytics | Microsoft Clarity (opt-in LGPD, somente producao) |
| Deploy | Nginx serve `dist/` + proxy `/api/*` para o processo Node |

O frontend gera um **build estatico** (`vite build` -> `dist/`) e consome uma **API de
leitura** (`server/`, Node/Fastify) que le o MongoDB `DadosOPP` e alimenta as secoes via
`fetch('/api/...')`. Nao ha dados de indicadores estaticos no frontend — tudo vem do banco.
Ver [Deploy (producao)](#deploy-producao) e [`server/README.md`](server/README.md).

## Funcionalidades

A Home organiza tudo como uma **Jornada do Municipio Empreendedor**: uma `SideNav` com **4
pilares**, e cada pilar alterna **modos de visualizacao** via `ModeToggle`. Todos os dados de
indicadores vem da API (`/api/*`), com o municipio ativo em estado global.

- **Login** (`/`) — porta de entrada do prototipo (autenticacao em memoria; reload desloga).
- **Agendas prioritarias** — 6 eixos com indicadores por municipio. O semaforo (bom/atencao/alerta) so aparece nos indicadores com **faixa oficial** publicada pela fonte; o corte e derivado do `threshold` de cada indicador **no banco** (sem tabela hardcoded). Indicadores sem faixa nao mostram a barra.
- **Pilar Ambiente de negocio** — 3 modos:
  - *Eixos prioritarios* — cards dos 6 eixos com as barras de indicador (zonas rotuladas pelos cortes oficiais, ex.: IGM-CFA `< 5,01 · 5,01–7,51 · ≥ 7,51`).
  - *Panorama socioeconomico* — cards de base economica (IDH-M, IDEB, GINI, PIB per capita, MEIs/MEs/EPPs, etc.) + analise simulada por IA (efeito typewriter, unica por municipio).
  - *Riscos estrategicos* — extracao automatica dos top indicadores em alerta / atencao.
- **Pilar Mapeamento de recursos** — modos *Emendas* e *Editais*.
- **Pilar Cursos e boas praticas** — modos *Cursos* (carrossel ligado a Escola Virtual do Governo; pagina `/trilhas` dedicada) e *Boas praticas* (casos de sucesso).
- **Pilar Formulador de projetos** — painel unico: fluxo em 10 etapas + revisao, rascunho por municipio em `localStorage`.
- **Mapa da Paraiba** — SVG gerado do GeoJSON do IBGE (`ParaibaOutlineMap`), sem lib de mapa.
- **Seletor de municipio** — lista os 223 municipios da PB vinda da API; troca sem "piscar" de volta ao mapa (stale-while-revalidate no provider).
- **Paginas** — `/home`, `/trilhas`, `/oportunidades` (Login em `/`).
- **Analytics opt-in (Microsoft Clarity)** — banner de consentimento LGPD (Aceitar / Recusar), ativo apenas em build de producao com `VITE_CLARITY_ID` preenchido. Heatmaps, gravacoes de sessao e 13 eventos customizados (navegacao, troca de municipio, mapa, funil do Formulador, tooltips, CTAs externos). Identificacao de sessao via `?participante=XX` para etiquetar maquinas em testes moderados.

## Municipios

Os **223 municipios da Paraiba** sao servidos pela API a partir do MongoDB `DadosOPP`
(`GET /api/municipalities`). O municipio default e **Campina Grande** (IBGE `2504009`). A
cobertura de indicadores por municipio depende dos seeds ja aplicados pelo ETL (`database/`);
indicador sem documento no banco simplesmente nao e retornado.

## Desenvolvimento

O frontend consome a API, entao em dev voce precisa dos **dois processos** rodando: o Vite
(`:5173`) faz proxy de `/api` para o Node (`:3000`).

```bash
# 1) API (em outro terminal) — precisa alcancar o MongoDB DadosOPP
cd server
npm install
cp .env.example .env          # preencher MONGO_URI
npm run dev                   # tsx watch, porta 3000

# 2) Frontend (na raiz)
npm install --legacy-peer-deps
npm run dev                   # http://localhost:5173 (/api -> :3000 via proxy)

# Build de producao
npm run build

# Lint
npm run lint
```

> A infra de testes (Vitest + Testing Library) segue configurada nos scripts (`npm run test:run`),
> mas a suite foi retirada no redesign e ainda sera reescrita para a nova arquitetura.

### Variaveis de ambiente

**Frontend** — copie `.env.example` para `.env`:

| Variavel | Descricao |
|---|---|
| `VITE_CLARITY_ID` | ID do projeto Microsoft Clarity (obtido em https://clarity.microsoft.com). Deixe em branco para desabilitar Clarity em dev/preview — so e lido em build de producao (`import.meta.env.PROD`) |

**API** (`server/.env`) — ver [`server/README.md`](server/README.md):

| Variavel | Descricao |
|---|---|
| `MONGO_URI` | Conexao com o MongoDB `DadosOPP` (usuario/senha, host `10.1.141.23`) |
| `MONGO_DB` | Nome do banco (default `DadosOPP`) |
| `PORT` / `HOST` | Porta/host da API (default `3000` / `0.0.0.0`) |

## Estrutura

O repositorio tem tres camadas: o **frontend** (`src/`), a **API de leitura** (`server/`) e o
**ETL + seeds** do banco (`database/`).

```
src/                          # Frontend React
├── components/               # Componentes por grupo do Figma
│   ├── agenda/               # AgendaCard, AgendaIndicator, IndicatorBar, ModeEixos
│   ├── economics/            # EconomicsCard, EconomicsAnalysis, ModeEconomics
│   ├── risks/                # RisksCard, ModeRisks
│   ├── resources/            # ModeResources (Emendas), ModeEditais
│   ├── training/             # TrainingCard, ModeTraining
│   ├── case-studies/         # ModeCaseStudies
│   ├── trilhas/              # Conteudo da pagina /trilhas
│   ├── formulator/           # ModeFormulator + FormulatorForm + 10 steps + revisao
│   ├── sections/             # SectionHero, SectionAgendas, SectionJornada
│   ├── layout/               # Header, Footer, SideNav, CitySelector, Layout
│   ├── map/                  # ParaibaOutlineMap (SVG do GeoJSON)
│   ├── ui/                   # Button, ModeToggle, DropdownMenu, ConsentBanner, etc.
│   ├── icons/                # Re-exports Lucide
│   └── AnalyticsTracker.tsx  # Bootstrap do Clarity + tracking de rota
├── data/                     # api.ts (client) + indicators/, home/, formulator/, geo/, layout.ts
│                             #   (conteudo editorial; valores de indicador vem da API)
├── hooks/                    # MunicipalityProvider, FormulatorProvider, AuthProvider + hooks
├── types/                    # Interfaces TypeScript (indicators.ts, formulator.ts)
├── pages/                    # Login, Home, Trails, Opportunities, Community
├── utils/                    # analytics, segmentLabels, statusStyles, risks, etc.
└── index.css                 # Design tokens (integrados ao Tailwind config)

server/                       # API de leitura (Node/Fastify) — ver server/README.md
└── src/                      # routes, repo, services, status (threshold), db, config

database/                     # ETL lake -> OPP: seeds MongoDB, geradores Python,
                              #   MAPEAMENTO_BASE_DOS_DADOS.md, RUNBOOK_ETL.md
```

## Design

Tokens extraidos das Figma Variables (Colors, Typography, Spacing). Componentes seguem fielmente o layout do Figma com referencia ao Node ID de cada elemento.

## Deploy (producao)

A plataforma roda no servidor Sebrae **10.1.100.99** (`NASRVOPPDL01`) e le o MongoDB
`DadosOPP` em **10.1.141.23**. Dois artefatos, um so deploy:

- **Frontend** — build estatico (`vite build` -> `dist/`) copiado para `/var/www/sebrae_opp/dist`, servido pelo Nginx.
- **API de leitura** (`server/`) — processo Node/Fastify na porta `3000`, gerenciado pelo systemd (`opp-api.service`). Le o banco; o Nginx faz proxy de `/api/*` para ela. Ver [`server/README.md`](server/README.md).

```
Navegador -> Nginx (:80) --+-- /            -> /var/www/sebrae_opp/dist  (SPA)
                           +-- /api/*        -> 127.0.0.1:3000 (opp-api)  -> MongoDB DadosOPP
```

### Primeiro deploy (uma vez)

1. **Nginx** — `server` block em `/etc/nginx/sites-enabled/sebrae_opp`: `root /var/www/sebrae_opp/dist`, SPA fallback (`try_files $uri $uri/ /index.html`), proxy `location /api/ { proxy_pass http://127.0.0.1:3000; }` (**sem barra no final** — preserva o `/api` no path) e `location /assets/` com `Access-Control-Allow-Origin "*"` (replay do Clarity).
2. **API via systemd** — unit `/etc/systemd/system/opp-api.service` executando `node dist/index.js` com `WorkingDirectory` = `server/` (o `dotenv` le o `server/.env`, que precisa do `MONGO_URI`). Depois: `sudo systemctl enable --now opp-api`.

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
| Codigo React/CSS (`src/`) | sim | -- |
| Codigo da API (`server/src/`) | -- | sim |
| **So dados no banco** (seeds/migracao do ETL) | -- | **so restart** (o catalogo e cacheado em memoria) |

> **Importante:** a API cacheia o catalogo em memoria no boot. Qualquer alteracao no banco
> (novos seeds, migracao de id, ajuste de `threshold`/labels) so aparece no frontend **apos
> `sudo systemctl restart opp-api`**.

### Verificacao pos-deploy

```bash
curl -s http://localhost/api/health          # {"ok":true,"db":"up"}
curl -s http://localhost/api/municipalities  # array dos 223 municipios da PB
```

## Licenca

Uso interno Sebrae Paraiba.
