# API da PIPPA

API de leitura da PIPPA sobre o MongoDB `DadosOPP`. Processo Node
(Fastify) que roda na máquina da app (`10.1.100.99`) e lê o banco (`10.1.141.23`).
O Nginx serve o build estático do frontend **e** faz proxy de `/api/*` para cá.

> **Só leitura.** Quem escreve no banco é o ETL (`database/`). A API nunca muta dados.

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
| GET | `/api/estado` | `StateData` — indicadores da PB no grão UF, sem `status` nem `threshold` |
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
  index.ts · app.ts · routes.ts · config.ts    boot · instância + erro · controller (todas as rotas) · env
  infra/        db.ts (cliente Mongo único) · payload-cache.ts
  types/        docs.ts · api.ts · index.ts
  indicadores/  catalog.ts · catalog-cache.ts · status.ts · values.ts
  municipios/   repo.ts (queries) · service.ts (doc → resposta)
  mapa/         service.ts
  emendas/      repo.ts · service.ts
  estado/       repo.ts · service.ts
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
(`src/infra/payload-cache.ts`), com TTL de 5 min (`PAYLOAD_CACHE_TTL_MS`). O mesmo número
vai no `Cache-Control: public, max-age=...` da resposta, para o navegador não repetir
a chamada ao voltar para um município já visto. `/api/health` e `/api/ai` são
`no-store`.

O que o cache evita é a rota `/api/map` ler `indicatorValues` **inteira** (todos os
municípios × todos os indicadores × toda a série) uma vez por visitante. Como ele
guarda a `Promise` e não o valor, N requisições simultâneas com o cache frio
compartilham uma leitura só — o pico de acesso não vira pico de query.

> **O ETL não avisa a API.** Valor novo leva até um TTL para aparecer; mudança de catálogo
> (`threshold`, rótulos, indicador novo) só com `systemctl restart`, porque o catálogo fica
> em memória sem TTL. Erro nunca fica cacheado (é o que faz o 503 de `/api/emendas`
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
npm run build && npm start   # tsc → dist/, node dist/server/src/index.js
```

## IA (`POST /api/ai`)

Transporte de produção do **mesmo núcleo** de `api/_lib/handler.ts`; o outro é o
middleware de dev do Vite. A lógica de IA (validação,
prompt, modelo) vive lá; em `server/src/` ficam só as travas de volume da rota, que
dependem do processo (ver abaixo), e o repasse do body. Nova capacidade
de IA = novo literal na união de `src/types/ai.ts` + prompt em `api/_lib/prompts.ts`;
os três transportes ganham de graça.

Para compilar esse núcleo compartilhado o `tsconfig.json` usa `rootDir: ".."`, o que
move o entrypoint emitido para `dist/server/src/index.js`. O `postbuild`
(`scripts/emit-entry-shim.mjs`) gera um `dist/index.js` que só importa o real, para o
`ExecStart` da unit systemd (`node dist/index.js`) continuar valendo.

`GOOGLE_SERVICE_ACCOUNT_JSON` (service account do Vertex AI) é **opcional**: sem ela a API sobe e só o `/api/ai` responde
503 `unavailable`, que o frontend mostra como "O assistente está indisponível no
momento". O motivo real fica no log (`journalctl -u opp-api`), não na resposta. Exige saída de rede para `https://oauth2.googleapis.com` e `https://aiplatform.googleapis.com` — ver `.env.example`.

### Travas de volume

O `/api/ai` está na internet sem login e cada chamada ao Vertex custa. Antes do
handler há duas travas, as duas com resposta 429 `rate_limited`:

| Trava | Onde | Env (default) |
|---|---|---|
| Rajada por IP | `@fastify/rate-limit`, só nesta rota | `AI_RATE_PER_MIN` (10/min) |
| Cota diária por IP | `src/ia/quota.ts` | `AI_RATE_PER_DAY` (150/dia) |
| Teto global diário (disjuntor de custo) | `src/ia/quota.ts` | `AI_DAILY_CAP` (3000/dia) |

O dia vira à meia-noite de Fortaleza, e a cota zera também quando o serviço
reinicia. A rota aceita no máximo 128 KB de corpo (o default do Fastify é 1 MB).

> **O limite por IP depende do Nginx.** O Fastify confia só em `127.0.0.1`
> (`trustProxy` em `src/app.ts`) e lê o IP do cliente em `X-Forwarded-For`. Sem
> `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` no `location /api/`,
> todo pedido chega como `127.0.0.1`, e os 10/min por IP viram **10/min para o site
> inteiro**. Se houver outro proxy ou balanceador na frente do Nginx, o IP que chega é
> o dele, e o mesmo efeito aparece: conferir a topologia antes de ligar a IA.

Cada chamada deixa uma linha `[api/ai] uso` no journal, com task, status, tokens,
duração e guarda disparada, sem o texto do pedido: `journalctl -u opp-api | grep
'api/ai] uso'`. É dela que saem os números para ajustar os limites acima.

A última linha de defesa fica fora do código e com o **administrador do projeto GCP**:
alerta de orçamento e cota de requisições do Gemini no projeto
`sebrae-ia-obs-politica-publica`.

## Deploy (10.1.100.99)

1. `npm ci && npm run build` no servidor.
2. Serviço `systemd` executando `node dist/index.js` (env via `.env` ou `EnvironmentFile`).
3. Nginx: `location / { root <dist>; try_files ... }` e
   ```nginx
   location /api/ {
     proxy_pass http://127.0.0.1:3000;
     # Obrigatório: é por ele que o /api/ai limita por cliente (ver Travas de volume).
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

Variáveis: ver `.env.example` (`MONGO_URI`, `MONGO_DB`, `PORT`, `HOST`, a service
account do Vertex e as travas `AI_*`).
