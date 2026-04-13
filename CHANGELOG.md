# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [Unreleased]

### Changed
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
