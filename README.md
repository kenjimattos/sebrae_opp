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
| Deploy | Vercel (prototipo) / Nginx (producao) |

## Funcionalidades

- **Agendas prioritarias** — 6 eixos com 16 indicadores por municipio, status semaforo (bom/atencao/critico)
- **Panorama territorial** — mapa interativo da Paraiba com poligonos coloridos por indicador
- **Base economica** — 10 cards com indicadores economicos e bloco de analise textual
- **Riscos estrategicos** — extracao automatica dos top 3 indicadores em alerta
- **Recursos** — emendas parlamentares, convenios e mapa Datapedia
- **Capacitacao** — 4 trilhas com 37 cursos do Sebrae
- **Casos de sucesso** — scroll horizontal de cases municipais
- **Header sticky** — scroll-spy com pill de acento, seletor de cidade digitavel

## Municipios com dados

| Municipio | Codigo IBGE |
|---|---|
| Joao Pessoa | 2507507 |
| Campina Grande | 2504009 |
| Patos | 2510808 |

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

## Estrutura

```
src/
├── components/     # Componentes organizados por grupo do Figma
│   ├── agenda/     # AgendaCard, AgendaBadge, AgendaIndicator, AgendaStats
│   ├── economics/  # EconomicsCard, EconomicsAnalysis
│   ├── risks/      # RisksCard
│   ├── resources/  # ResourcesCard
│   ├── courses/    # CoursesCard, CoursesCardRow
│   ├── case-studies/ # CaseStudiesCard
│   ├── formulador/ # FormuladorCard
│   ├── sections/   # 8 secoes da pagina principal
│   ├── layout/     # Header, Footer
│   ├── ui/         # Button, Dropdown, SectionContainer, etc.
│   ├── map/        # ValueBadges
│   └── panorama/   # PanoramaLegend, PanoramaMediaInfo
├── data/           # JSON e TS com dados mock
├── hooks/          # useMunicipio, useActiveSection, usePanorama*
├── types/          # Interfaces TypeScript
├── pages/          # Home
├── utils/          # Helpers compartilhados
└── index.css       # Design tokens
```

## Design

Tokens extraidos das Figma Variables (Colors, Typography, Spacing). Componentes seguem fielmente o layout do Figma com referencia ao Node ID de cada elemento.

## Licenca

Uso interno Sebrae Paraiba.
