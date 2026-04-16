# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Added
- Design tokens: `--icon-size-xs/sm/md/lg/xl` em `index.css` e constantes `ICON_SIZES` em `src/constants/icons.ts` — paridade com spacing/radius/typography para uso em props `size={...}` de ícones
- `components/icons/index.ts`: novos re-exports `ArrowLeft`, `ChevronUp` e tipo `LucideIcon` — cobertura completa dos ícones usados no projeto
- `useDropdownState` hook (`src/components/ui/useDropdownState.ts`): open/setOpen/ref + listener click-outside extraído de Dropdown — compartilhado com CitySelector
- `DropdownMenu` componente (`src/components/ui/DropdownMenu.tsx`): lista UL reutilizável com auto-sizing (`width: max-content; min-width: 100%`) — acomoda a opção mais larga sem distorcer quando o trigger hugs content de opção curta
- InsetBar: novo componente de design system (`ui/InsetBar.tsx`) — barra encaixada no topo de SectionCard com label + controle
- PanoramaMediaInfo: exibe valor do município selecionado (com destaque accent) e maior valor do estado, além da média estadual
- Design system: classe `.grid-5` em `index.css` (5 colunas, gap-xs), seguindo padrão de `.grid-2` e `.grid-3`

### Changed
- Todos os imports de `lucide-react` migrados para `@/components/icons` (9 arquivos) — único ponto de entrada para ícones
- Props `size={N}` hardcoded substituídas por `ICON_SIZES.xs/sm/md/lg/xl` em todos os consumidores (CitySelector, CaseStudiesCard, CoursesCardRow, Dropdown, EconomicsCard, PillButton, ScrollArrowButton, SectionCapacitacao)
- ESLint: regra `no-restricted-imports` bloqueia imports de `lucide-react` fora de `components/icons/index.ts` — previne regressões
- Dropdown: refatorado para consumir `useDropdownState` + `DropdownMenu`; trigger hugs content (sem `w-full`)
- SectionPanorama: removido `className="w-[240px]"` do Dropdown — menu agora auto-sizes pela opção mais larga
- CitySelector: refatorado para consumir `useDropdownState` + `DropdownMenu` — dedupe da lista vs Dropdown, comportamento idêntico
- Pasta `src/components/ui/buttons/` criada; `Button.tsx` e `PillButton.tsx` movidos para lá (agrupa variações de botão separadas dos primitivos de layout)
- `Button`: API nova — `label: string` (obrigatório) substitui `children`, nova variant `ghost`, props opcionais `icon: LucideIcon` + `iconPosition: 'left' | 'right'` (default `'right'`). Tamanho do ícone derivado automaticamente do `size` do botão. Callsites migrados (SectionAIAssistant, SectionCapacitacao)
- `IconButton` componente (`src/components/ui/buttons/IconButton.tsx`): botão circular icon-only com 4 variants × 3 sizes (sm 24×24, md 40×40, lg 48×48). `aria-label` obrigatório. Reutilizado em ScrollArrowButton (removido) e dentro de PillButton

### Fixed
- EconomicsCard e ResourcesCard: removida largura fixa dos cards; layout controlado pelo pai via `.grid-5`
- SectionBaseEconomica e SectionRecursos: trocado `flex flex-wrap` com calc por `grid-5`
- ParaibaMap: removido `z-[1000]` desnecessário do overlay de ativação do mapa
- SectionPanorama: removido `padding="md"` do SectionCard; header do dropdown agora encaixado como inset-bar no topo
- Dropdown: cor de fundo do botão trocada de `bg-surface-secondary` para `bg-surface`
- SectionBaseEconomica: gap vertical ajustado de `gap-lg` para `gap-md`
- Tipografia: `--font-size-display-small` ajustado de 24px para 28px

### Changed
- Design system: classes `.radius-sm/md/lg/xl/full` e `.bg-primary/surface/surface-secondary/accent` extraídas para `index.css`
- ~45 ocorrências de `rounded-[var(--radius-*)]` e `bg-[var(--semantic-*)]` substituídas pelas novas classes em 20 componentes
- Nomes `.radius-*` (não `.rounded-*`) para evitar colisão com utilities nativas do Tailwind
- SectionCard: wrapper trocado de `<div>` para `<section>` para HTML semântico

## [0.1.0] — 2026-04-15

Primeiro release do protótipo funcional da Plataforma OPP.

### Funcionalidades

- **8 seções completas:** Agendas, Panorama, Base Econômica, Riscos, Recursos, Capacitação, Casos de Sucesso, Formulador
- **Mapa interativo da Paraíba:** Leaflet + Carto Positron + GeoJSON local, polígonos coloridos por status, badges de valor, overlay click-to-interact
- **Estado global por município:** Context API com dados mock para João Pessoa, Campina Grande e Patos
- **Header sticky com scroll-spy:** nav links acompanham a seção visível com pill de acento, logo scroll-to-top
- **CitySelector digitável:** campo de busca com dropdown filtrado por nome de município
- **Riscos dinâmicos:** seção extrai automaticamente top 3 indicadores em alert/warning das agendas
- **Design system completo:** tokens de cor, tipografia (16 classes `.typo-*`), spacing, radius — extraídos das Figma Variables
- **Dark mode:** tokens semânticos configurados via classe `.dark` (sem toggle na UI)

### Componentes

- Layout: Header, Footer, User, UserAvatar, CitySelector
- Agenda: AgendaCard, AgendaBadge, AgendaIndicator, AgendaStats
- Economics: EconomicsCard, EconomicsAnalysis
- Risks: RisksCard
- Resources: ResourcesCard
- Courses: CoursesCard, CoursesCardRow
- Case Studies: CaseStudiesCard
- Formulador: FormuladorCard
- UI primitivos: Button, PillButton, Dropdown, SectionContainer, SectionCard, Grid, ScrollArrowButton
- Compartilhados: SectionHeader, TitleSubtitle
- Mapa: ParaibaMap, ValueBadges, PanoramaLegend, PanoramaMediaInfo

### Infraestrutura

- React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v3
- Testes: Vitest + React Testing Library — 46 testes (smoke + snapshots)
- Deploy estático via Vercel (protótipo)
- Dados em JSON/TS locais (sem API)
- Fonte Inter via Google Fonts
- Lucide React para ícones
