# OPP API

API de leitura da Plataforma OPP sobre o MongoDB `DadosOPP`. Processo Node
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

O shape das respostas espelha `src/types/indicators.ts` do frontend: a API devolve
exatamente o que o `MunicipalityProvider` montava a partir dos TS estáticos.

**Fonte da régua:** o status (`success`/`warning`/`alert`/`none`) é derivado do
campo `threshold` de cada `indicators._id` no banco — não há tabela hardcoded.
Indicador sem `threshold` → `'none'` (sem semáforo). Indicador sem documento no
banco (ex.: ainda não implementado) simplesmente não é retornado.

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

## Deploy (10.1.100.99)

1. `npm ci && npm run build` no servidor.
2. Serviço `systemd` executando `node dist/index.js` (env via `.env` ou `EnvironmentFile`).
3. Nginx: `location /api/ { proxy_pass http://127.0.0.1:3000; }` e `location / { root <dist>; try_files ... }`.

Variáveis: ver `.env.example` (`MONGO_URI`, `MONGO_DB`, `PORT`, `HOST`).
