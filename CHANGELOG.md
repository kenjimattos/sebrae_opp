# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Added
- Header sticky com scroll-spy: nav links acompanham a seção visível com pill de acento
- CitySelector digitável: campo de busca com dropdown filtrado por nome de município
- Hook `useActiveSection`: IntersectionObserver para detectar seção ativa na viewport
- Logo clicável no header: scroll suave de volta ao topo
- IDs de ancoragem em todas as seções da Home para scroll-to e scroll-spy

### Changed
- Header: max-width 1440px, padding vertical simétrico, gap entre CitySelector e nav
- Nav links reduzidos para 3 itens originais (Agenda prioritária, Acesso a recursos, Formulador)
- CitySelector: ícone de busca usa classe `text-inactive`, largura removida (auto-size)
- UserAvatar: tamanho via token `--radius-xl`, prop `size` removida
- User: padding horizontal removido, tipografia reduzida para `typo-body`

- Setup de testes: Vitest + React Testing Library + jsdom (`npm run test` / `npm run test:run`)
- Smoke tests: 33 testes cobrindo 9 seções + 18 componentes individuais (mocks de Leaflet e MunicipioProvider)
- Snapshot tests: 13 snapshots dos componentes mais afetados pelo refactor CSS
- Seção Formulador (`SectionFormulador`, Figma 390:635) com dois `FormuladorCard` lado a lado
- Componente `SectionCard` para padronizar blocos de conteúdo dentro de seções
- Componente `UserAvatar` extraído do Figma + barrel file `src/components/icons/`
- Imagens de case study para 5 municípios
- Dados reais de cursos na seção Capacitação: 4 trilhas com 37 cursos (substituindo dados mock)

### Fixed
- Cores de status (success/warning/alert) agora usam tons 500 (mais vibrantes) ao invés de 800/900
- Dot de status no AgendaBadge reduzido de 12px para 8px
- EconomicsCard e ResourcesCard usam largura relativa ao viewport (dvh) ao invés de px fixo

### Changed
- Tipografia: classes `.typo-*` agora incluem `color: var(--semantic-text-primary)` por default — removidas ~47 ocorrências redundantes nos componentes
- Novas classes `.text-inactive` e `.text-accent` para overrides de cor
- Classes `.gap-2xs` a `.gap-3xl` no design system — substituídas ~60 ocorrências de `gap-[var(--spacing-*)]`
- Classes de padding `.p-*`, `.px-*`, `.py-*`, `.pt-*`, `.pb-*`, `.pl-*`, `.pr-*` mapeadas aos tokens de spacing
- Classes flex compostas: `.flex-center`, `.flex-between`, `.flex-col-start`
- Classes compostas: `.section-container`, `.card-surface`, `.grid-2`, `.grid-3`, `.divider`, `.divider-primary`
- Corrigido `bg-[#ccc]` hardcoded em CoursesCard para usar `.divider`
- Classes de status: `.status-{success,warning,alert}-{bg,dot}` + `src/utils/statusStyles.ts` compartilhado
- Componentes `PanoramaLegend` e `PanoramaMediaInfo` extraídos de `SectionPanorama`
- Hooks `usePanoramaIndicadores` e `usePanoramaMedia` extraídos de `SectionPanorama`
- `ValueBadges` extraído para `src/components/map/`, helpers do mapa para `src/utils/mapHelpers.ts`
- `ScrollArrowButton` extraído de `SectionCasosSucesso` para `src/components/ui/`
- `src/data/labels.ts` — labels compartilhados (status, CTAs, panorama, user default)
- `src/data/capacitacao.ts` — trilhas e cursos extraídos de SectionCapacitacao
- `src/data/recursos.ts` — cards, URLs e textos extraídos de SectionRecursos
- `src/data/formulador.ts` — cards do formulador
- `src/data/ai-assistant.ts` — placeholder e botões do assistente IA
- `src/data/layout.ts` — navLinks, footerColumns, brandText, copyright
- `src/data/economics.ts` — texto de análise econômica
- `SectionAIAssistant` comentada para uso futuro (seção removida da Home)
- TitleSubtitle: refatorado com 3 tamanhos (`lg`/`md`/`sm`) alinhados ao Figma (H1/H2/H3), tags HTML semânticas corretas, e prop `as` para override
- `SectionContainer`: absorveu layout default (padding + max-width), simplificando uso nas seções
- Layout compactado para conforto visual a 100% zoom:
  - `--spacing-margin` de 120px → 180px (conteúdo efetivo: 1200px → 1080px)
  - Gap entre seções de `spacing-3xl` (96px) → `spacing-2xl` (64px)
  - `.typo-body-sm` line-height corrigido para `lh-auto`
  - AgendaCard: `min-w` → `min-h`, gaps e tipografia reduzidos
  - AgendaIndicator/Badge: tipografia reduzida para `body-sm`
  - SectionAgendas: stats + grid agrupados em wrapper
  - EconomicsCard: width de 230px → 209px, gap entre cards reduzido, variação para `body-sm-bold`
  - `--font-size-display-small` de 32px → 24px
  - ResourcesCard: width fixo 190px, justify-between
  - SectionRecursos: gap reduzido, texto descritivo de `body-lg` → `body`
- CaseStudiesCard e SectionCasosSucesso: ajustes de espaçamento, dimensões e reorganização do layout

### Fixed
- FormuladorCard: altura mínima ajustada para 600px
- CTA button alinhado na mesma altura em todos os CaseStudiesCard
- Gap entre SectionCards em Recursos reduzido para `spacing-md`
- Border radius do EconomicsAnalysis corrigido para consistência
- Margin desnecessária removida de SectionHeader e SectionRecursos
- UserAvatar: tamanho e padding visual corrigidos

### Added (anterior)
- Arquivo de dados `src/data/casos-sucesso.ts` com 5 cases de municípios brasileiros (interface tipada `CasoSucesso`)
- Componente `CaseStudiesCard` (Figma 288:8): card com imagem, cidade, título, descrição e link CTA com seta
- Botões de navegação (setas esquerda/direita) na seção Casos de Sucesso com scroll programático

### Changed
- Seção Casos de Sucesso reescrita conforme Figma (390:623): cards com imagem, estrutura TitleSubtitle, link "Ver estudo de caso"
- Título da seção alterado para "Municípios que transformaram seu ambiente de negócios" (sem descrição)
- Cards: width 375px, radius-sm, padding px-lg/py-md (match Figma)
- Gap da seção aumentado para spacing-2xl (64px)

### Added
- Lucide React como biblioteca de ícones (tree-shakeable, ~2.5KB para 8 ícones)
- Componente `CoursesCardRow` (Figma 297:8): linha de curso com título uppercase + carga horária + botão "Ver curso"
- Componente `CoursesCard` (Figma 298:8): card de trilha com TitleSubtitle, cursos com separadores e PillButton CTA
- Seção Capacitação reescrita conforme Figma: grid 2x2 de cards de trilha + ícone capelo centralizado
- 4 trilhas mock: Políticas Públicas, Captação de Recursos, Liderança, Indicadores

### Changed
- Ícones inline SVG substituídos por imports Lucide React: EconomicsCard, CitySelector, Dropdown, PillButton, CoursesCardRow
- Título da seção Capacitação atualizado para "Capacitação para estruturar projetos e acessar recursos" (sem descrição)
- Layout da seção Capacitação: lista plana substituída por CSS Grid 2 colunas com cards de altura igual

### Removed
- Lista plana de cursos da seção Capacitação (substituída por cards de trilha)

### Added
- Tokens de tipografia composta: `--typo-weight-*` e `--typo-lh-*` em `index.css`
- 16 classes `.typo-*` via `@layer components` espelhando os Text Styles do Figma (Display, Heading, Body, UI)
- Tokens `--semantic-accent`, `--semantic-accent-hover`, `--semantic-accent-surface` para estados interativos (light + dark)
- Estados de interação no `Button`: hover (opacity), focus (ring accent), active (scale), disabled
- Prop `disabled` no `Button`
- Estados hover/focus/active no `PillButton`
- Hover accent nos links de navegação do Header e Footer
- Estado selecionado com accent-surface no Dropdown

### Changed
- Todos os componentes migrados de combinações ad-hoc (font-bold + text-[length:...] + leading-*) para classes `.typo-*`
- Button: size `sm` corrigido de 40px para 24px, default mudado de `sm` para `md`
- Dropdown: item selecionado agora usa `accent-surface`/`accent` em vez de `surface-secondary`
- SectionAgendas: highlight unificado de `--semantic-info-text-info` para `--semantic-accent`

### Fixed
- `SectionRecursos`: `py-[var(--radius-full)]` corrigido para `py-[var(--spacing-3xl)]` (token de categoria errada)
- `EconomicsAnalysis`: `leading-[25px]` corrigido para 24px via `.typo-body`
- `RisksCard`: `font-bold` (700) corrigido para semibold (600) conforme Figma
- Valores hardcoded substituídos por spacing tokens: `gap-[10px]`, `gap-[8px]`, `gap-[12px]`, `py-[4px]`, `py-[10px]`, `mt-[36px]`

### Added
- Componente `PillButton` para CTAs pill-shaped com ícone seta (Explorar emendas, Ver oportunidades)
- Seção Recursos reescrita conforme Figma: 5 cards de emendas, mapa Datapedia (iframe), bloco editais
- Integração Datapedia: iframe embed com link externo no hover
- Pill indicador "Onde encontrar recursos para o município" no topo da seção
- Ícone decorativo $ entre blocos da seção Recursos

### Changed
- Título da seção Recursos atualizado para "Recursos e Capacitação para o Desenvolvimento do Município"
- Mapa da Paraíba substituído: react-simple-maps → react-leaflet + Carto Positron (tile map estilo QuintoAndar)
- GeoJSON dos municípios agora é local (não depende de URL do GitHub)
- Badges de valor exibidos diretamente no mapa sobre cada município com dados
- Seção Panorama: dropdown agora lista os 16 indicadores das agendas (com labels abreviados)
- Seção Panorama: mapa usa cores semânticas de status (success-surface, warning-surface, alert-surface) em vez de gradiente RGB
- Seção Panorama: hover mostra cor de status forte (success, warning, alert); municípios sem dados não mudam cor nem mostram tooltip
- Seção Panorama: município selecionado usa `surface-tertiary` em vez de azul
- Seção Panorama: média estadual do indicador exibida acima do mapa
- Seção Panorama: legenda discreta com 3 cores (Bom, Atenção, Crítico)
- JSONs de João Pessoa e Patos normalizados para usar mesmas 6 agendas e 16 indicadores de Campina Grande
- `mapa-indicadores.ts` reestruturado com 16 indicadores, status por município, shortLabel e valorNumerico

### Removed
- Painel de ranking à direita da seção Panorama
- Gradiente de cores (vermelho → amarelo → verde) no mapa
- Interfaces `Panorama` e `RankingItem` de `indicadores.ts`
- Campo `panorama` dos JSONs de municípios
- `indicadorRanges` de `mapa-indicadores.ts`

### Added
- Gráfico comparativo econômico com Recharts (`EconomicsAnalysis`, `ChartWrapper`)
- Mapa interativo da Paraíba com React Simple Maps (`ParaibaMap`)
- Seções completas: Agendas, Panorama, BaseEconomica, Riscos, Recursos, Capacitação, Casos de Sucesso, Assistente IA
- Componentes de card: `AgendaCard`, `AgendaBadge`, `AgendaIndicator`, `AgendaStats`, `EconomicsCard`, `RisksCard`, `ResourcesCard`
- Estado global com `MunicipioContext` + `useMunicipio` hook
- Mock data JSON para 3 municípios: João Pessoa, Campina Grande, Patos
- Layout: `Header` (405:2044), `Footer` (419:917), `User` (405:2038), `CitySelector` (509:3274)
- Página `Home` com React Router
- Componentes primitivos do Figma: `SectionHeader`, `TitleSubtitle`, `Button`
- Componentes Tailwind puros: `SectionContainer`, `Grid`, `ChartWrapper`
- Estrutura de pastas espelhando grupos do Figma (`agenda/`, `economics/`, `risks/`, etc.)
- Interfaces TypeScript para dados de indicadores municipais (`src/types/indicadores.ts`)
- Design tokens (typography, spacing, radius, colors) em `src/index.css` extraídos das Figma Variables
- Fonte Inter via Google Fonts
- Path alias `@/` configurado em Vite e TypeScript
- Suporte a dark mode via classe `.dark` com tokens semânticos
- Logo Sebrae em `public/assets/`

### Changed
- Títulos e descrições de seções centralizados em `src/data/sections.ts`
- Dados de agenda de Campina Grande substituídos por valores reais do Figma (6 agendas, 16 indicadores)
- `AgendaIndicator`: adicionado separador horizontal entre indicadores
- `AgendaCard`: border-radius corrigido para `radius-sm`
- `SectionAgendas`: cor do destaque usa token semântico `--semantic-info-text-info`
- Espaçamento entre seções: gap 96px (`--spacing-3xl`) + padding top/bottom no `<main>`
- `index.html`: lang `pt-BR`, título atualizado para "OPP — Observatório de Políticas Públicas"
- `App.tsx`: React Router com MunicipioProvider
- `main.tsx`: removida importação de `.tsx` extensão desnecessária

### Removed
- Boilerplate Vite: `App.css`, `hero.png`, `react.svg`, `vite.svg`
- CSS legado do template Vite em `index.css`
