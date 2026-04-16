# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Added

- `ui/Card` — primitivo unificado para superfície de card. Variantes tipadas: `surface` (primary/secondary/success/warning/alert), `padding` (all ou `{x, y}`), `bordered`, `radius` (sm/md), `as` (div/section). Consolida 4 padrões que estavam espalhados em 9 cards (`.card-surface` inline, `bg-[var]+rounded-[var]` inline, variantes de status hardcoded no `RisksCard`, e o wrapper `SectionCard`).
- `.card-surface-secondary` em `index.css` — espelha `.card-surface` para surface cinza (background + border-radius num único utility).
- `.typo-button-secondary-{lg,md,sm}` em `index.css` — tipografia de botão com texto escuro (`--semantic-button-label-secondary`) para uso em shells claros (ex: `PillButton` sm/md).
- `PanoramaMediaInfo`: nome do município campeão exibido ao lado do maior valor estadual (ex: `0,745 (Campina Grande)`). `usePanoramaMedia` retorna `maiorMunicipioNome` via lookup por valor do indicador.

### Changed

- 9 cards migrados para `<Card>`: `AgendaCard`, `AgendaStats`, `EconomicsCard`, `EconomicsAnalysis`, `ResourcesCard`, `RisksCard`, `CaseStudiesCard`, `FormuladorCard`, `CoursesCard`. Bloco do `SectionAIAssistant` e wrappers de `SectionPanorama` / `SectionRecursos` também passam a usar `Card`.
- `RisksCard`: mapa `tipoStyles` local (bg+border por variante) eliminado — agora delegado ao `<Card surface={tipo} bordered>`.
- `CoursesCard`: padding `px-xl py-2xl` (que ficava escondido no map interno do antigo `SectionCard`) agora explícito como `padding={{x: 'xl', y: '2xl'}}` no call-site.
- `CoursesCard`: CTA `PillButton` perde `w-[325px]` — PillButton lg agora é auto-sized.
- `TitleSubtitle`: prop `content` renomeada para `subtitle` — mais descritiva. Consumidores atualizados: `CaseStudiesCard`, `CoursesCard`, `SectionRecursos`, `FormuladorCard`.
- `FormuladorCard`: reescrito para usar `Card` + `TitleSubtitle` no lugar de markup inline.
- `EconomicsAnalysis`: wrapper `<div>` → `<section>` (HTML semântico), preservado via nova prop `as` do `Card`.
- **Tokens de botão**: `--semantic-button-primary` preto → `blue-500`; `--font-size-button` 24 → 20px; `--font-size-display-small` 28 → 24px. Classes `.typo-button-*` agora usam `--semantic-button-label-primary` (branco) por default.
- `PillButton`: sm/md adotam `typo-button-secondary-{sm,base}` (texto escuro em shell claro). lg perde `h-[64px] w-[340px]` fixo (auto-sized), shell `bg-surface-secondary` → `bg-accent` (azul primário), círculo 48×48 → 40×40.
- `Dropdown`: trigger inline substituído por `<Button variant="primary" size="md" icon={ChevronDown} iconPosition="right">` — herda tokens de cor de botão automaticamente.
- `CoursesCardRow`: título `typo-h4 uppercase` → `typo-body` (combina com densidade da linha); gap interno `sm` → `xs`.
- `PanoramaMediaInfo`: tipografia achatada para `typo-body` em todos os labels (sem mais `text-inactive`/`text-accent` destacados); remove sufixo `(N municípios)` da média.
- `SectionPanorama`: info da média + mapa agrupados em `<section>` interna com `gap-sm`; gap externo do `Card` `md` → `lg`.
- `.divider` unificado em `--primitives-gray-200` (antes `--semantic-surface-secondary`); `.divider-primary` removido — `Footer` migrado para `.divider`.
- `data/capacitacao.ts`: durações dos cursos expandidas de `Nh` para `N horas` (ex: `36h` → `36 horas`).

### Removed

- `ui/SectionCard` — substituído pelo novo `ui/Card`.
- Borda invisível do `EconomicsCard` (`border` na mesma cor do background — artefato, não feature).
- Card "Modelos de projeto" do formulador — resta apenas o card do assistente IA.
- `.divider-primary` — consolidado em `.divider`.

## [0.2.0] — 2026-04-16

Consolidação do design system, nova taxonomia de botões e reorganização por domínio. 33 commits desde 0.1.0, sem quebra de comportamento do protótipo.

### Added

**Design system**
- Tokens de icon size `iconSizes` (xs 12 / sm 16 / md 20 / lg 24 / xl 32) co-localizados com os re-exports de ícones em `src/components/icons/index.ts`
- Classes utilitárias `.radius-sm/md/lg/xl/full` e `.bg-primary/surface/surface-secondary/accent` em `index.css` — substituem `rounded-[var(--radius-*)]` e `bg-[var(--semantic-*)]` inline
- Classe `.grid-5` (5 colunas, gap-xs) — completa a família `.grid-2` / `.grid-3`

**Primitivas de UI**
- `ui/InsetBar` — barra encaixada no topo de SectionCard com label + controle
- `ui/useDropdownState` — hook compartilhado com open/setOpen/ref + click-outside
- `ui/DropdownMenu` — lista UL reutilizável com auto-sizing (`max-content` + `min-width: 100%`)
- `ui/buttons/IconButton` — botão circular icon-only com 4 variants × 3 sizes (sm 24×24, md 40×40, lg 48×48) e `aria-label` obrigatório
- `components/icons/index.ts` — re-exports `ArrowLeft`, `ChevronUp` e tipo `LucideIcon`

**Seções**
- PanoramaMediaInfo exibe agora valor do município selecionado (destaque accent) e maior valor estadual, além da média

**Qualidade**
- ESLint `no-restricted-imports` bloqueia imports diretos de `lucide-react` fora de `components/icons/index.ts`

### Changed

**API de botões**
- `Button`: `label: string` (obrigatório) substitui `children`; nova variant `ghost`; props opcionais `icon: LucideIcon` + `iconPosition: 'left' | 'right'` (default `right`). Tamanho do ícone derivado automaticamente do `size` do botão.
- `PillButton`: prop `size: 'sm' | 'md' | 'lg'` (default `lg`, retrocompat). Variantes sm/md têm shell transparente + círculo gray 24×24 com seta 12px; lg preserva design original (64×340 + círculo 48×48 + seta 24px).

**Refatorações**
- `Dropdown` e `CitySelector` consomem `useDropdownState` + `DropdownMenu` — dedupe da lógica de open/close e click-outside
- `CitySelector.query` passa a ser estado derivado (`open ? draft : municipio.nome`) — elimina setState-in-effect
- Imports de `lucide-react` migrados para `@/components/icons` em 9 arquivos — único ponto de entrada
- Props `size={N}` hardcoded trocadas por `iconSizes.xs/sm/md/lg/xl` em todos os consumidores
- ~45 ocorrências de `rounded-[var(--radius-*)]` e `bg-[var(--semantic-*)]` substituídas pelas novas classes em 20 componentes

**Reorganização de pastas**
- `src/components/ui/buttons/` criada; `Button.tsx` e `PillButton.tsx` movidos para lá (junto do novo `IconButton`)
- Primitivos da raiz reorganizados por domínio: `ParaibaMap` → `map/`, `CitySelector` + `User` → `layout/`, `TitleSubtitle` + `SectionHeader` → `ui/`
- `SectionCard`: wrapper `<div>` → `<section>` (HTML semântico)

**Docs**
- `CLAUDE.md` atualizado: nova taxonomia de botões (Button / IconButton / PillButton), `ui/buttons/`, primitivas de dropdown (`DropdownMenu`, `useDropdownState`) e tokens de icon size

### Fixed

- CaseStudiesCard CTA: `<div>` estilizado substituído por `PillButton size="sm"` — corrige acessibilidade (agora clicável e focável)
- CoursesCardRow CTA: idem — `<div>` → `PillButton size="md"`
- EconomicsCard e ResourcesCard: largura fixa removida; layout agora controlado pelo pai via `.grid-5`
- SectionBaseEconomica e SectionRecursos: `flex flex-wrap` + calc substituído por `grid-5`
- SectionPanorama: `padding="md"` removido do SectionCard; header do dropdown agora encaixado como `InsetBar`
- SectionBaseEconomica: gap vertical ajustado (`gap-lg` → `gap-md`)
- Dropdown: background do trigger ajustado (`bg-surface-secondary` → `bg-surface`)
- ParaibaMap: `z-[1000]` desnecessário removido do overlay de ativação
- Tipografia: `--font-size-display-small` corrigido de 24px para 28px
- Classes nomeadas `.radius-*` (não `.rounded-*`) para evitar colisão com utilities nativas do Tailwind

### Removed

- `ui/ScrollArrowButton` — substituído por `IconButton variant="secondary" size="lg"` em SectionCasosSucesso
- Pasta `src/constants/` — tokens de icon size consolidados em `components/icons`
- CSS vars `--icon-size-*` não-consumidas descartadas de `index.css` (fonte única passa a ser `iconSizes` em JS)

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
