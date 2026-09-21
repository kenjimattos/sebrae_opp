# OPP API

API de leitura da Plataforma OPP sobre o MongoDB `DadosOPP`. Processo Node
(Fastify) que roda na máquina da app (`10.1.100.99`) e lê o banco (`10.1.141.23`).
O Nginx serve o build estático do frontend **e** faz proxy de `/api/*` para cá.

> **Só leitura.** Quem escreve no banco é o ETL (`database/`). A API nunca muta dados.

> **Nesta branch (`preview/snapshot`) esta API não é usada.** O deploy de aprovação roda
> na Vercel, que não alcança o Mongo do Sebrae, então `/api/*` vem de JSON estático
> (`public/api-snapshot/`) e o `/api/ai` de uma function serverless — ver o README da
> raiz. O código aqui é o **mesmo da `main`**, e é assim que deve ficar: mantê-lo
> atrasado não protegia nada e quebrava o `tsc` da suíte de testes, que é compartilhada.
> Só é preciso subir este processo se você for mexer no `server/` (e aí é preciso a VPN
> do Sebrae).

## Stack

Node ≥20 · Fastify 5 · driver `mongodb` 6 · TypeScript. Sem framework de ORM — o
schema já é validado no próprio Mongo (`database/setup.mongodb.js`).

## Contrato

| Método | Rota | Devolve |
|---|---|---|
| GET | `/api/health` | `{ ok, db }` — ping no banco |
| GET | `/api/municipalities` | `[{ id, name, slug }]` — seletor |
| GET | `/api/municipalities/:id` | `IndicatorsData` — agendas + base econômica, **status já calculado** |
| GET | `/api/map` | `{ options, municipalities }` — valores por município p/ colorir o mapa |
| GET | `/api/emendas` | `EmendasData` — emendas parlamentares (federal + estadual) dos 223 municípios |
| POST | `/api/ai` | resposta do LLM para uma task de IA (`AiTaskRequest` → `{ text, items? }`) |

O shape das respostas espelha `src/types/indicators.ts` do frontend: a API devolve
exatamente o que o `MunicipalityProvider` montava a partir dos TS estáticos.

**Fonte da régua:** o status (`success`/`warning`/`alert`/`none`) é derivado do
campo `threshold` de cada `indicators._id` no banco — não há tabela hardcoded.
Indicador sem `threshold` → `'none'` (sem semáforo). Indicador sem documento no
banco (ex.: ainda não implementado) simplesmente não é retornado.

## Estrutura

Organizada **por domínio**, não por camada MVC: pilar novo chega com repo, service,
tipos e regra própria — como `emendas` chegou —, e num MVC clássico esse trabalho se
espalharia por quatro pastas.

```
src/
  index.ts · routes.ts · config.ts    boot · controller (todas as rotas) · env
  infra/        db.ts (cliente Mongo único) · payload-cache.ts
  types/        docs.ts · api.ts · index.ts
  indicadores/  catalog.ts · catalog-cache.ts · status.ts · values.ts
  municipios/   repo.ts (queries) · service.ts (doc → resposta)
  mapa/         service.ts
  emendas/      repo.ts · service.ts
```

`repo.ts` só faz query; `service.ts` só transforma (função pura — é o que os testes
em `tests/server/` exercitam, sem banco); `routes.ts` costura os dois e cuida de
status HTTP e cache.

**`indicadores/`** guarda o que as duas leituras do mesmo dado compartilham: a régua
(`status.ts`) e a escolha/supressão de valor (`values.ts`). Ficha do município e cor
do mapa passam pelos dois — regra duplicada num deles faz o mapa discordar da ficha.

**`types/`** está partido por motivo de mudança: `docs.ts` acompanha o ETL, `api.ts`
acompanha o frontend. Importe sempre de `types/index.js`.

## Cache

As rotas de leitura são as mesmas para todo visitante — não há sessão nem dado por
usuário —, então a resposta pronta fica em memória do processo
(`src/payload-cache.ts`), com TTL de 5 min (`PAYLOAD_CACHE_TTL_MS`). O mesmo número
vai no `Cache-Control: public, max-age=...` da resposta, para o navegador não repetir
a chamada ao voltar para um município já visto. `/api/health` e `/api/ai` são
`no-store`.

O que o cache evita é a rota `/api/map` ler `indicatorValues` **inteira** (todos os
municípios × todos os indicadores × toda a série) uma vez por visitante. Como ele
guarda a `Promise` e não o valor, N requisições simultâneas com o cache frio
compartilham uma leitura só — o pico de acesso não vira pico de query.

> **O ETL não avisa a API.** Carga nova leva até um TTL para aparecer; `systemctl
> restart` zera na hora. Erro nunca fica cacheado (é o que faz o 503 de `/api/emendas`
> voltar a 200 assim que os seeds rodam).

As respostas saem comprimidas (`@fastify/compress`, threshold 1 KB) — JSON repetitivo
encolhe muito: medido 21 KB → 1,8 KB numa lista no formato de `/api/municipalities`.

## Rodar

```bash
cd server
npm install
cp .env.example .env      # preencher MONGO_URI (usuário/senha do DadosOPP)
npm run dev               # tsx watch, porta 3000
```

Produção:

```bash
npm run build && npm start   # tsc → dist/, node dist/index.js
```

## IA (`POST /api/ai`)

Terceiro transporte do **mesmo núcleo** de `api/_lib/handler.ts`, ao lado da function
da Vercel (`api/ai.ts`) e do middleware de dev do Vite. Nada de lógica de IA vive em
`server/src/` — a rota só repassa o body e devolve `{ status, body }`. Nova capacidade
de IA = novo literal na união de `src/types/ai.ts` + prompt em `api/_lib/prompts.ts`;
os três transportes ganham de graça.

Para compilar esse núcleo compartilhado o `tsconfig.json` usa `rootDir: ".."`, o que
move o entrypoint emitido para `dist/server/src/index.js`. O `postbuild`
(`scripts/emit-entry-shim.mjs`) gera um `dist/index.js` que só importa o real, para o
`ExecStart` da unit systemd (`node dist/index.js`) continuar valendo.

`OPENROUTER_API_KEY` é **opcional**: sem ela a API sobe e só o `/api/ai` responde
`missing_key`, que o frontend mostra como "O serviço de IA não está configurado neste
ambiente". Exige saída de rede para `https://openrouter.ai` — ver `.env.example`.

## Deploy (10.1.100.99)

1. `npm ci && npm run build` no servidor.
2. Serviço `systemd` executando `node dist/index.js` (env via `.env` ou `EnvironmentFile`).
3. Nginx: `location /api/ { proxy_pass http://127.0.0.1:3000; }` e `location / { root <dist>; try_files ... }`.

Variáveis: ver `.env.example` (`MONGO_URI`, `MONGO_DB`, `PORT`, `HOST`).
