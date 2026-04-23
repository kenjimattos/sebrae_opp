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
| Mapa | Leaflet + React Leaflet + GeoJSON (IBGE) |
| Testes | Vitest + React Testing Library |
| Analytics | Microsoft Clarity (opt-in LGPD, somente producao) |
| Deploy | Vercel (prototipo) / Nginx (producao) |

## Funcionalidades

- **Hero** — secao de abertura com 4 pilares clicaveis (Agenda / Recursos / Capacitacao / Formulador)
- **Agendas prioritarias** — 6 eixos com indicadores por municipio, status semaforo (bom/atencao/critico) derivado de thresholds oficiais
- **Panorama territorial** — mapa interativo da Paraiba com poligonos coloridos por indicador; clique em municipio com dados troca a selecao global
- **Base economica** — 12 cards com indicadores (IDSC, IDH-M, IDEB, GINI, PIB per capita, MEIs, MEs, EPPs, etc.) + bloco de Analise simulada por IA (efeito typewriter, unica por municipio)
- **Riscos estrategicos** — extracao automatica dos top 3 indicadores em alerta / atencao
- **Recursos** — emendas parlamentares, convenios e mapa Datapedia
- **Capacitacao** — trilhas com carrossel de cursos ligados a Escola Virtual do Governo, pagina `/trilhas` dedicada
- **Casos de sucesso** — scroll horizontal de cases municipais
- **Formulador de projetos** — rota `/formulador` com fluxo em 10 etapas + tela de Conclusao (exportavel em PDF), rascunho por municipio em `localStorage`
- **Paginas placeholder** — `/oportunidades` e `/comunidade`
- **Header sticky** — scroll-spy com pill de acento, seletor de cidade digitavel, deep-linking via hash
- **Analytics opt-in (Microsoft Clarity)** — banner de consentimento LGPD (Aceitar / Recusar), ativo apenas em build de producao com `VITE_CLARITY_ID` preenchido. Heatmaps, gravacoes de sessao e 13 eventos customizados (navegacao, troca de municipio, mapa, funil do Formulador, tooltips, CTAs externos). Identificacao de sessao via `?participante=XX` para etiquetar maquinas em testes moderados

## Municipios com dados (8)

| Municipio | Codigo IBGE |
|---|---|
| Joao Pessoa | 2507507 |
| Campina Grande | 2504009 |
| Queimadas | 2512507 |
| Conde | 2504603 |
| Caapora | 2503001 |
| Pitimbu | 2511905 |
| Monteiro | 2509701 |
| Cabaceiras | 2503100 |

## Desenvolvimento

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Servidor de desenvolvimento
npm run dev

# Build de producao
npm run build

# Testes
npm run test:run

# Lint
npm run lint
```

### Variaveis de ambiente

Copie `.env.example` para `.env` e preencha conforme necessario.

| Variavel | Descricao |
|---|---|
| `VITE_CLARITY_ID` | ID do projeto Microsoft Clarity (obtido em https://clarity.microsoft.com). Deixe em branco para desabilitar Clarity em dev/preview — so e lido em build de producao (`import.meta.env.PROD`) |

## Estrutura

```
src/
├── components/     # Componentes organizados por grupo do Figma
│   ├── agenda/         # AgendaCard, AgendaBadge, AgendaIndicator, AgendaStats
│   ├── economic-base/  # EconomicBaseCard, EconomicBaseAnalysis
│   ├── risks/          # RisksCard
│   ├── resources/      # ResourcesCard
│   ├── training/       # TrainingCard, TrainingCardRow, TrailCard
│   ├── case-studies/   # CaseStudiesCard
│   ├── formulator/     # FormulatorCard + FormCard + 10 steps + sidebar
│   ├── sections/       # Hero + 8 secoes da pagina principal
│   ├── layout/         # Header, Footer, CitySelector, User
│   ├── ui/             # Button, IconButton, PillButton, Card, Dropdown, ConsentBanner, etc.
│   ├── icons/          # Re-exports Lucide + UserAvatar
│   ├── map/            # ParaibaMap, ValueBadges
│   ├── panorama/       # PanoramaLegend, PanoramaMediaInfo
│   └── AnalyticsTracker.tsx # Bootstrap do Clarity + tracking de rota
├── data/           # indicators/, home/, formulator/, geo/, layout.ts
├── hooks/          # useMunicipality, useFormulator, usePanoramaIndicators, etc.
├── types/          # Interfaces TypeScript
├── pages/          # Home, Formulator, FormulatorStep, FormulatorConclusion, Trails, Opportunities, Community
├── utils/          # Helpers compartilhados (inclui analytics.ts)
└── index.css       # Design tokens (integrados ao Tailwind config)
```

## Design

Tokens extraidos das Figma Variables (Colors, Typography, Spacing). Componentes seguem fielmente o layout do Figma com referencia ao Node ID de cada elemento.

## Licenca

Uso interno Sebrae Paraiba.
