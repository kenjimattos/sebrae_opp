# CLAUDE.md — PIPPA

Plataforma de Inteligência de Políticas Públicas Aplicada, do Sebrae PB (até
setembro de 2026 chamada "Plataforma OPP" — o banco segue `DadosOPP` e a pasta
segue `sebrae_opp`; só a marca mudou). Este arquivo traz as **regras e
armadilhas** do projeto; o resto se lê no código. Prefira `grep` a suposição.

> **Esta é a branch `preview/snapshot`** — deploy de aprovação na Vercel, que não
> alcança a rede Sebrae. Aqui `/api/*` é servido por **JSON estático**, não pela API
> Node. A branch de produção é a `main`; ao portar mudanças, ver
> [Backend nesta branch](#backend-nesta-branch).

**Estado:** 1.4.2, espelhando a `main`. **17 dos 22 indicadores de agenda
classificam** (6 por faixa oficial da fonte, 11 por tercil relativo aos 223 municípios
da PB) e o farol por agenda voltou a acender. Home = `SideNav` com 4 pilares (Ambiente
de negócio, Mapeamento de recursos, Cursos e boas práticas, Formulador de projetos);
cada pilar alterna modos via `ModeToggle`. **223 municípios da PB**, default Campina Grande (`2504009`).
Rotas: `/` (Login), `/home`, `/trilhas`. Desktop 1440px; o layout se sustenta até
1000px, e abaixo disso `ui/NarrowScreenNotice` avisa **sem bloquear** (zoom alto num
notebook também cai ali). **Tema claro e escuro**
pelo `ThemeToggle` (automático → claro → escuro; automático é o default e segue o
sistema). **Instância única** — `useTheme` é estado local, dois consumidores
montados teriam preferências independentes; o `Layout` monta um só em qualquer rota.

**Header do app (`layout/SiteHeader`)** em `/home` e `/trilhas`: logotipo à esquerda,
`CitySelector` ao centro (**só em `/home`** — nada em `/trilhas` depende do município)
e `ThemeToggle` à direita. É `sticky` e está no fluxo, então o conteúdo começa abaixo
dele. Compacta ao rolar (barra de 96 → 64px, logo de 80 → 56px, o seletor perde o
rótulo "Meu município"), detectado por um marcador no topo com `IntersectionObserver`.
**Na `/` não há header**: o hero já traz a marca em 270px, e o tema fica solto no canto.

> **A caixa do header tem altura FIXA (`--header-h`, 64px); só a barra visual cresce
> no topo** (`--header-h-expanded`), por cima do `padding-block` do conteúdo. Se a
> caixa encolhesse ao compactar, o conteúdo pularia 32px e o scroll anchoring do
> navegador devolveria o pulo ao scroll — que podia voltar para cima do limiar e
> expandir de novo, em laço.

> **Todo `sticky` e todo destino de rolagem desconta `--header-h`.** A `SideNav` gruda
> em `--nav-top` (header + `md`), e o `pb` da `SectionJornada` deriva dele; a barra de
> eixos de `/trilhas` usa `top-header`; e `html { scroll-padding-top: var(--header-h) }`
> cobre `scrollIntoView` e âncoras de hash, somando com o `scroll-margin-top` do alvo.
> `sticky top-0` novo fica atrás do header sem erro nenhum.

O logotipo é um `<Link>` para `/home` — **não** um `onClick` no `<svg>`, que não
recebe foco de teclado, não responde a Enter e não abre em nova aba. O
`PippaWordmark` dentro dele vai com `decorative`, senão o leitor de tela anuncia
"PIPPA" duas vezes. O clique rola ao topo além de navegar: o `ScrollToTop` só reage
a *mudança* de rota, então não cobre clicar no logotipo já estando em `/home`.

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
.catalog*, .poster* (/trilhas)
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
`IndicatorThreshold`, `EconomicBaseItem`), `src/types/emendas.ts` e
`src/types/estado.ts`.

**Há dois grãos, em coleções separadas.** O municipal em `indicatorValues` (223 docs por
indicador) e o **estadual** em `stateValues` (1 doc por UF × indicador × ano, servido por
`GET /api/estado`). São coleções distintas, e não um campo `escopo` numa só, porque a chave
é `uf` e não `municipalityId` — a separação é o que impede a Paraíba de aparecer como uma
224ª linha na lista de municípios, nas opções do mapa e no cálculo dos tercis. O catálogo
dos dois fica em `indicators`; o que distingue é o `placements.section`, e `'estadual'` é
uma seção que `indicadores/catalog.ts` **não** monta em agenda nenhuma.

> **O grão estadual não classifica, e a ausência é o contrato** — `StateIndicator` não tem
> `status` nem `threshold`. Não há faixa oficial para nenhum dos 8 indicadores, e a régua
> relativa não se transplanta: com um documento por indicador não existe distribuição para
> tercilar. Tercilar contra as 27 UFs foi medido antes de decidir e **7 dos 8 caem na faixa
> do meio** — semáforo constante não informa, que é o modo de falha que já desligou o farol
> de agenda. No lugar da cor vai `breakdown.posicao` (entre as 27 UFs e as 9 do Nordeste):
> é **comparação, não classificação**, e a UI não deve derivar cor dela. `aplicar_tercis.py`
> não precisa de guarda: a tabela dele (`_tercis.catalogo_derivados`) é allowlist revisada,
> e nenhum `uf-*` está nela. Tabela dos 8 em `database/MAPEAMENTO_BASE_DOS_DADOS.md`, §1-A.

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
| `/api/estado` | `public/api-snapshot/estado.json` (grão estadual) |
| Roteamento em produção (Vercel) | `rewrites` do `vercel.json` |
| Roteamento em dev | `bypass` do proxy no `vite.config.ts` (espelha os rewrites) |
| `/api/ai` | function serverless `api/ai.ts` (essa sim é real) |

> **Regra:** os dois roteamentos são espelho um do outro. Rota nova servida por
> snapshot = entrada no `vercel.json` **e** no bypass do `vite.config.ts`, senão
> funciona no preview e quebra em dev (ou o contrário).

O snapshot é gerado pelos scripts em `database/scripts/`; o shape é o mesmo que a API
Node devolve, para o frontend não saber a diferença. Ao mudar um contrato, regerar o
snapshot — `gerar_api_snapshot_municipios.py` (os 223 + índice) e
`gerar_api_snapshot_emendas.py`.

> Os dois leem os **seeds**, não o banco: o Mongo do Sebrae não é alcançável daqui, e
> até set/2026 os 223 JSONs não tinham gerador nenhum (eram dump da API Node em
> `ccec545`). O de municípios reimplementa ~40 linhas de `server/src/indicadores/`
> (ano, supressão, régua), então rode **`--conferir` antes de `--escrever`**: ele
> agrupa as diferenças por indicador, e indicador que você não mexeu tem de sair
> idêntico. Diferença fora do esperado = a reimplementação divergiu do servidor.

A API Node existe em `server/` e o código é **o mesmo da `main`** — inclusive
`/api/emendas` e `POST /api/ai`. Ela não atende esta branch (quem atende é o
snapshot), mas fica em dia de propósito: a suíte de testes é compartilhada e
`tests/server/` compila contra `server/src/`, então um `server/` atrasado quebra o
`tsc` e o build aqui. Ao mexer no `server/`, mexer nas duas branches.

`server/src/` se organiza **por domínio**, não por camada — cada pilar traz repo +
service + regra própria, e assim o trabalho de um cabe numa pasta:

```
server/src/
  index.ts · app.ts · routes.ts · config.ts    ← boot, instância + erro, controller, env
  infra/        db.ts · payload-cache.ts
  types/        docs.ts (o que o ETL grava) · api.ts (o que o front consome) · index.ts
  indicadores/  catalog.ts · catalog-cache.ts · status.ts · values.ts
  municipios/   repo.ts · service.ts
  mapa/         service.ts
  emendas/      repo.ts · service.ts
```

> **Corpo de erro nunca leva bastidor; o detalhe vai para o log.** O handler padrão do
> Fastify devolve `err.message` também em 5xx, e a mensagem do driver traz host e porta
> do Mongo interno — por isso `createApp` (`app.ts`) registra um `setErrorHandler` que
> loga e responde `{ error: 'Erro interno.' }`. Resposta montada à mão segue a mesma
> regra: o 503 de emendas nomeava a coleção e o caminho dos seeds. Sem nome de coleção,
> IP, caminho, variável de ambiente nem fornecedor. `index.ts` sobe o servidor ao ser
> importado; teste de rota usa `createApp(false)` + `registerRoutes` + `inject`.

> **`indicadores/` é regra compartilhada, não um quinto domínio.** `status.ts` (a
> régua) e `values.ts` (qual ano servir, quando suprimir) valem para a ficha do
> município **e** para a cor do mapa. Duplicar num dos dois faz o mapa discordar da
> ficha que ele abre — e a discordância aparece na tela, não no teste.

> **`types/` está partido por motivo de mudança:** `docs.ts` acompanha o ETL,
> `api.ts` acompanha o frontend (espelho de `src/types/indicators.ts` e
> `src/types/emendas.ts` — **e é o que o gerador do snapshot precisa respeitar**).
> Importar sempre de `types/index.js`.

> **O cache de resposta do `server/` não vale para o deploy desta branch.**
> `server/src/infra/payload-cache.ts` (TTL 5 min, `PAYLOAD_CACHE_TTL_MS`), o
> `Cache-Control` das rotas e o `@fastify/compress` são do processo Node, que aqui
> não atende ninguém — quem serve `/api/*` é o snapshot estático, com o cache da
> Vercel. Está no repositório porque o `server/` acompanha a `main`; para o que ele
> significa em produção, ver o `CLAUDE.md` de lá.

**DB-driven:** o status de cada indicador vem do `threshold` no banco, tanto na API
quanto no snapshot. **A régua tem duas procedências** (`threshold.provenance`), e elas
pintam a mesma cor sem querer dizer a mesma coisa:

- `fonte` (ou ausente) — faixa publicada pela fonte. São 6 indicadores de agenda.
- `relativo-pb` — tercis p33/p67 entre os 223 municípios da PB, calculados por
  `database/scripts/aplicar_tercis.py`. São 11. Um `Bom` aqui é "no terço de cima da
  Paraíba", **não** "atende a um padrão".

> **Regra:** segue proibido inventar um corte e apresentá-lo como padrão da fonte. O
> tercil só é admissível porque viaja rotulado (`provenance`) até o `IndicatorModal` e
> até o prompt da IA. Mexeu na régua, mexa no rótulo. Tabela em
> `database/MAPEAMENTO_BASE_DOS_DADOS.md`, §Semáforo.

> **`normalizedValue` é o número que a régua relativa lê — e `null` nele significa
> SEM BASE DE COMPARAÇÃO, não zero.** Contagem bruta não compara municípios (mede o
> tamanho deles), então 6 dos 11 classificam per capita enquanto o card exibe o bruto;
> `classifiedNumber` (servidor) e `classifiedValue` (cliente) escolhem qual número vale
> e **nunca** caem no bruto quando falta o normalizado. O mesmo campo tira do semáforo
> quem não tem o que comparar — é assim que os 109 municípios sem emissão de alvará
> saem sem sumir da tela.

> **Zero medido ≠ zero que é ausência, e os dois chegam como `numericValue: 0`.** Só o
> `breakdown` distingue: `semEmissaoAlvara` no `tempo-licenciamento` (109 zeros = não
> houve processo → sem base) e `vinculosTotal` no `trabalhadores-tic` (todo zero tem
> emprego formal, nenhum em TIC → é piso, e os tercis se calculam sobre os positivos).
> Trocar um pelo outro pinta metade do estado de vermelho, ou apaga a faixa de alerta
> inteira. Quem decide é o gerador; o servidor não vê `breakdown`.

> **Rodar um `gerar_seed_*.py` APAGA o threshold derivado, em silêncio.** O bloco de
> catálogo usa `replaceOne` e nenhum gerador conhece os tercis: o seed roda, imprime
> `ok`, e o indicador volta a `'none'` sem que nada avise. Depois de qualquer gerador
> dos 11, rodar `aplicar_tercis.py --escrever` (e, nesta branch, regerar o snapshot).
> Ver `database/RUNBOOK_ETL.md` §4.

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
3. **Análise do município** — task `economic-analysis`, que recebe os cards da base
   econômica **estruturados** e o resumo dos indicadores com a faixa oficial; o prompt
   proíbe citar número fora desse contexto e proíbe classificar o que não vem com
   status. Mora em `analysis/AIAnalysis` e sai num lugar só: o modo *Análise do
   município*. O Panorâma, que antes a trazia abaixo dos cards, hoje é só os cards —
   as duas cópias do componente viraram uma.
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
- **Sigilo do modelo tem duas camadas, e só a segunda garante.** O `SYSTEM_PROMPT` pede
  para não revelar modelo, fornecedor nem bastidor; `revealsModelIdentity`
  (`api/_lib/guardrails.ts`) confere a saída no handler e troca a resposta inteira pela
  frase fixa `IDENTITY_REPLY`. Só o prompt não segurou: o modelo gratuito respondeu
  "NVIDIA". Nome novo na lista não pode ser palavra comum em pt-BR — `meta` e `google`
  ficam de fora de propósito (meta do projeto, Google Trends), porque o falso positivo
  apaga uma resposta boa sem aviso.
- **Corpo de erro é genérico; o detalhe vai para o log.** O que o handler devolve chega
  ao navegador — nada de fornecedor, id de modelo, nome de variável de ambiente nem
  "cota gratuita" (ensina a esgotá-la). Já vazou os três. O código de chave ausente é
  `unavailable`, não `missing_key`, pelo mesmo motivo.
- **Escopo (`SCOPE_NOTE`) só nas entradas de texto livre** (chat e pergunta do modal).
  No Formulador a recusa cairia dentro do campo de formulário como se fosse conteúdo.
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
  dos 223 municípios em `alert` — e alimentando o então modo Riscos com um risco falso.
  Nada avisa: o seed roda, imprime `ok`, e o campo velho fica. Ao mexer em gerador,
  conferir se ele continua com `replaceOne`: os 26 já foram convertidos.
- **Denominador vazio já virou ranking bruto em silêncio.** `_tesseract.posicao()` usava
  `if (denominador)` para decidir se normalizava; dicionário vazio é falso, então quando o
  ano pedido estava fora da série de população (o caso real: `uf-empresas-ativas` coletado em
  2026, série do IBGE até 2025) a função **pulava a normalização** e devolvia a posição bruta
  rotulada `normalizado: false` — 17º de 27 em vez dos 15º per capita, sem erro, com cara de
  intencional. É a mesma classe de degradação que `classifiedNumber` evita no grão municipal.
  Hoje denominador pedido e vazio **levanta**, e `populacoes_uf_recente()` dá o ano mais
  recente disponível. Ao mexer em normalização, o teste é "o que acontece quando o
  denominador falta", não "o que acontece quando ele existe".
- **A Tesseract devolve 28 UFs no cubo da RAIS, não 27** — há um `State ID 99 = "Não
  informado"` (4.113 vínculos em 2025) que desloca todo ranking em uma casa.
  `_tesseract.ufs_validas()` filtra pela lista canônica do IBGE. E **`Workers` sem o corte
  `Active worker indicator = 1` mede fluxo, não estoque**: sobe ~28% (1.268.617 contra
  914.955), porque soma os vínculos encerrados durante o ano.
- **`--offline` de gerador pode não ser offline.** Os três geradores estaduais que calculam
  posição per capita buscavam a população das 27 UFs na hora: o modo passava enquanto havia
  rede e quebraria exatamente quando ela faltasse, que é quando ele serve para algo. Hoje a
  população vai **dentro** do snapshot. Ao mexer em `--offline`, o teste é rodar com
  `urllib.request.urlopen` substituído por uma função que levanta — não basta o comando
  terminar com zero.
- **Formulador:** dois estados diferentes na sidebar. *Concluída* (check) sai de
  `isStepComplete` em `src/utils/formulatorCompleteness.ts` — campos obrigatórios da
  etapa preenchidos; é ela também que alimenta o "X% concluído". *Em andamento* sai de
  `visitedSteps`, marcado ao clicar Próxima/Finalizar, sem validar nada. O PDF não
  depende de nenhum dos dois: `FormulatorReview` imprime todo campo com texto.
  Rascunho por município em `localStorage` (`formulator:${id}`).
  Fonte de verdade das 10 etapas: `src/data/formulator/steps.ts`.
- **O modo Riscos foi removido.** No lugar dele a aba Ambiente tem *Análise do
  município* (`analysis/ModeAnalysis`), que serve a análise por IA sozinha. Saíram
  junto `ModeRisks`, `RisksCard`, `data/indicators/descriptions/risks.ts` e
  `utils/risks.ts` — este último levou consigo o resumo de indicadores que o campo
  "Evidências e Dados" do Formulador mandava à IA, que hoje recebe só o problema
  central. Sobrou no `index.css` o bloco `.risk-card*` (mais o `@keyframes
  risk-pulse` e os tokens
  `--semantic-{alert,warning}-glow`), que já não tem consumidor — ao limpar, atenção:
  `--semantic-{alert,warning}-vivid` **não** são órfãos, `IndicatorBar` e os pontos
  de status leem os dois.
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
- **Testes ficam fora do `npm run build`.** São 198 casos em `tests/`, dois projetos
  do Vitest (client/jsdom, server/node), e `tests/server/` importa `server/src/` —
  que importa `mongodb` e `dotenv`, pacotes de `server/node_modules`, instalado à
  parte. Enquanto os testes estavam no `tsc -b` do build, todo ambiente que só
  instala a raiz quebrava em `Cannot find module 'mongodb'` antes do `vite build`:
  derrubou os deploys da Vercel nas duas branches. Hoje o build compila `src` +
  `api` e os testes têm `tsconfig.tests.json`, rodado por **`npm run typecheck`** —
  que é o comando a usar antes de commitar, não o `build`.
- **`ranking-redesim` e `tempo-licenciamento` exibem PONTUAÇÃO — o rótulo mente, e por
  isso os dois são `higher-better`.** O primeiro serve o total 0–600 (não a posição
  entre 223); o segundo serve o Índice de Tempo 0–120, onde **mais pontos = menos
  horas**, porque a Redesim só publica horas brutas de alvará no nível estadual. Ler o
  nome e inferir a direção inverte o mapa inteiro sem quebrar nada: já aconteceu duas
  vezes numa semana, uma delas comigo. O tooltip é o único lugar onde a escala aparece
  na tela — ele dizia "Dias para emissão", fazendo o card afirmar que Campina leva "57
  dias" com farol verde. Mexeu na escala de um indicador, confira
  `src/data/indicators/descriptions/indicators.ts`.
- **O farol da agenda ignora `'none'` no denominador — e é isso que o mantém honesto.**
  `agendaStatus` (`src/utils/statusStyles.ts`) é a média por gravidade (success 2,
  warning 1, alert 0; ≥1,5 verde, ≥0,5 amarelo) **só sobre os indicadores que
  classificam**. Ficou desligado (`return 'none'`) de jul a set/2026 porque contava
  todos: com a maioria em `'none'`, quase toda agenda ia a vermelho — um agregado
  dominado por ausência de dado, não por desempenho. Agenda sem nenhum classificável
  devolve `'none'` (glow vazio), e hoje é o caso real de *Acesso a crédito*.
- **A barra é posicionada pelo número da régua, não pelo exibido.** Quem monta usa
  `classifiedValue(ind)`, nunca `ind.numericValue` direto: numa faixa per capita o
  `value` é "70.626" e o corte é 44,5/1k hab., então o bruto grudaria o marcador no
  extremo direito de toda barra normalizada — sem erro, sem aviso, e com cara de que
  todo município do estado vai bem. `markerFraction` é geometria pura e não sabe nada
  disso; não é lá que se resolve.
- **Comentário citando componente não é uso.** Numa varredura, três componentes mortos
  (`ui/Grid`, `agenda/AgendaStats`, `formulator/useFormulatorAi`) sobreviveram só porque
  comentários os mencionavam. Ao caçar código morto, procurar `import`, não o nome. E o
  escopo da busca precisa incluir **`api/`**: o handler serverless importa de `src/`
  (ex.: `AI_FIELD_IDS`), então varrer só `src/` produz falso positivo perigoso.
- **`<hr>` não tem borda: o preflight do Tailwind zera a de todo elemento.** O
  filete do eyebrow do hero era um `<hr className="w-[4rem]">` e nunca chegou a
  aparecer na tela — uma caixa de altura zero, sem erro nenhum. Filete se faz com
  `.divider` (que pinta com `--semantic-divider`) e a largura por utility; `<hr>`
  só serve com `border-t` explícito.
- **O logotipo é vetor, não fonte** (`components/brand/PippaWordmark.tsx`). A
  Norfolk Narrow do desenho é licenciada só para uso pessoal, então o `.otf` está
  no `.gitignore` e o que vive no repo é o contorno das cinco letras, extraído com
  fontTools. Precisando do nome em outro corpo ou outra palavra, **não** adicione a
  fonte: regenere o `path` pelo método descrito no cabeçalho do componente. O
  `fill="currentColor"` é o que faz o logo atravessar os dois temas — quem monta
  escolhe a cor pela classe de texto.
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
