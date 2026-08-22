# Storybook na Plataforma OPP — avaliação

**Data:** 22/08/2026 · **Branch:** `preview/snapshot` · **Situação:** não instalado.

Este documento responde se vale adotar Storybook aqui, o que custaria e o que já está
pronto a favor. É avaliação, não decisão: nada foi instalado.

## Veredito

**É viável e o projeto está bem posicionado para receber**, mas não é urgente — o
saneamento de tokens desta versão resolveu a dor mais aguda (tema escuro herdando
valores do claro) por outros meios: paridade auditável por diff, contraste medido e
regra de lint. O que o Storybook acrescentaria a partir daqui é **regressão visual e
documentação viva**, não correção de bug.

Recomendação: adotar quando houver trabalho de UI em lote (redesign, novo pilar, revisão
de acessibilidade). Adotar agora, sem esse gatilho, entrega uma vitrine que precisa ser
mantida em dia sem ter quem a consulte.

## Viabilidade técnica

| Item | Situação |
|---|---|
| Storybook | 10.5.x (última estável em 08/2026) |
| React 19.2.4 | Suportado |
| Vite 8.0.7 (Rolldown) | Peer dependency estendida até 8.0.0; compatibilidade recente |
| TypeScript 6.0.2 | Sem impedimento conhecido |
| Tailwind 3.4.19 | Sem impedimento |

O ponto de atenção é o **Vite 8**: o suporte é recente e o ecossistema ainda está
assentando sobre o Rolldown. Fixar a versão e validar `storybook dev` **e**
`storybook build` antes de escrever qualquer story — descobrir incompatibilidade depois
de 20 stories é caro.

Instalação exige `--legacy-peer-deps`, como todo install neste projeto (React 19). Vale
criar um `.npmrc` com `legacy-peer-deps=true`: hoje a flag vive só no README e no
`installCommand` do `vercel.json`, e um `npm install` desavisado quebra o lockfile.

## Configuração necessária

Quatro pontos não são opcionais — sem eles o Storybook sobe mas renderiza errado:

1. **`preview.ts` precisa importar `src/index.css`.** As classes `.typo-*`,
   `.card-surface`, `.glass` e as `.status-*` são CSS escrito à mão em
   `@layer components`, não utilitários gerados pelo Tailwind. Sem o import, os
   componentes aparecem sem tipografia e sem superfície — e falham em silêncio.
2. **O alias `@` → `./src`.** Todo o código importa por `@/components/...`.
   O `@storybook/react-vite` lê o `vite.config.ts` do projeto, então o alias vem junto;
   confirmar mesmo assim.
3. **Filtrar o que é do dev server da aplicação.** O `vite.config.ts` registra o plugin
   `aiDevEndpoint` (middleware `/api/ai`, que importa de `api/_lib/handler`) e um proxy
   `/api` apontando para `localhost:3000` com bypass para os snapshots. Nada disso faz
   sentido no servidor do Storybook — filtrar no `viteFinal` ou condicionar o plugin a
   uma variável de ambiente dentro do próprio `vite.config.ts`.
4. **`staticDirs: ['../public']`**, que serve os snapshots da API às stories.

Além disso: incluir `'./.storybook/**/*.{ts,tsx}'` no `content` do `tailwind.config.js`
se decorators usarem classes, senão o JIT não as gera.

**Addons que justificam o investimento:** `@storybook/addon-themes`
(`withThemeByClassName` com `dark`/`light`, casando com o `darkMode: 'class'`) e
`@storybook/addon-a11y`. O primeiro exercita os dois temas lado a lado; o segundo teria
apontado sozinho os contrastes que foram encontrados por medição manual nesta versão.

## O que já está pronto a favor

- **Os 17 primitivos de `src/components/ui/` são puramente presentacionais.** Nenhum
  consome contexto — recebem tudo por props. São stories sem decorator, sem mock, sem
  provider.
- **Variantes são enumeráveis e já exportadas.** `button-styles.ts` exporta
  `ButtonVariant` e `ButtonSize`, que viram `argTypes.options` diretamente. Não há
  `cva`/`clsx` escondendo as combinações.
- **Fixtures reais sem rede.** `public/api-snapshot/` tem os 223 municípios e as emendas
  no mesmo shape que a API devolve. Uma story importa o JSON como fixture estática —
  sem MSW, sem mock de `fetch`.
- **Props já documentadas no código.** As interfaces são locais e não exportadas, mas o
  `react-docgen` as lê para os autodocs. Vários componentes trazem no cabeçalho o nó do
  Figma de origem (`// Figma: Buttons (set 378:477)`), material pronto para a página de
  docs e para um eventual Code Connect.

## Custo estimado

| Etapa | Commits | Observação |
|---|---|---|
| Setup + validação (`dev` e `build`) | 2–3 | inclui `.npmrc` e scripts |
| Página de docs de tokens | 1 | paleta, tipografia, spacing, status nos dois temas |
| Stories dos 17 primitivos | 2–3 | os 4 botões primeiro |
| Presentacionais de feature | 1–2 | com fixtures do snapshot |

Escopo recomendado, em incrementos independentes: **tokens → primitivos → feature**.
Componentes que consomem `useMunicipality()` (os `Mode*`, o Formulador inteiro) ficam
por último e só se houver demanda: exigem decorator com provider ou mock de
`src/data/api.ts`, e o Formulador precisa de dois providers aninhados.

## Um pré-requisito de higiene

Independente do Storybook: `npm test` está quebrado. O `vite.config.ts` aponta
`setupFiles: './src/test/setup.ts'`, arquivo que não existe desde que a suíte foi
retirada no redesign. Vitest, jsdom e Testing Library seguem instalados. Consertar isso
é barato e precede qualquer conversa sobre teste de componente.

## Publicação (se adotado)

`storybook build` gera `storybook-static/`, e esta branch já é um deploy de aprovação na
Vercel — publicar a vitrine seria coerente. Três caminhos, em ordem de preferência:
projeto Vercel separado apontando para o mesmo repositório com `buildCommand` próprio;
copiar para `public/storybook` no build (engorda o deploy da aplicação); ou manter
apenas local. Nenhum deles exige mexer no `vercel.json` atual.
