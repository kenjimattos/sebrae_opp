# RUNBOOK — ETL Sebrae (data lake) → Banco OPP

Como puxar indicadores das bases brutas do Sebrae (data lake) para o banco da OPP,
de forma automatizada. Piloto validado em jun/2026: indicadores de escolaridade da
RAIS (`gerar_seed_escolaridade.py`). Este documento consolida a topologia, os
parâmetros calibrados, o passo a passo e o cron — para operar, repetir e estender.

> **Princípio:** nunca replicamos os microdados crus (RAIS ~0.22 TB, CAGED ~37 GB). A
> agregação roda **na origem** (aggregation pipeline server-side) e só o resultado
> pequeno (≈223 linhas, 1 por município) desce para virar `indicatorValues` no OPP.

---

## 1. Topologia (3 máquinas)

```
  10.19.4.174:27018          10.1.141.23                    10.1.100.99
  Mongo DATA LAKE    ──────► Linux (RDP)            ──────► host do APP
  RAIS / CAGED              Mongo OPP (DadosOPP)            frontend (build)
  read-only                 + roda o JOB ETL (cron)         só fala c/ .141.23
  (microdados crus)         única máquina que vê o lake      NÃO alcança o lake
```

- A **10.1.141.23** é a **única** máquina que enxerga o lake **e** hospeda o Mongo OPP
  → é onde o ETL roda. A conexão lake→OPP é Mongo↔Mongo na mesma rede, **sem túnel SSH**.
- A **10.1.100.99** (app) **não** alcança o lake → não pode rodar o ETL. Recebe só o
  build do frontend.

## 2. Parâmetros calibrados

| Alvo | Host:porta | Banco | authSource | Usuário |
|---|---|---|---|---|
| **Lake Sebrae** | `10.19.4.174:27018` ⚠️ não 27017 | `RAIS` (coleção `2024_VINC`) | `admin` | `usr_RAIS` (senha = usuário) |
| **Mongo OPP** | `127.0.0.1:27017` | **`DadosOPP`** ⚠️ não `opp` | `DadosOPP` | `usrdadosopp` |

Todos já são **default** no `gerar_seed_escolaridade.py` (porta 27018, authSource do lake
= admin, banco OPP = DadosOPP, authSource OPP = nome do banco). Só usuário/senha precisam
ser passados (via env, ver §5).

**Schema da RAIS crua** (≠ basedosdados): `MUNICIPIO` é 6 dígitos (IBGE sem DV → casa pelos
6 primeiros com os 223 canônicos; PB = prefixo `25`); `ESCOLARIDADE_APOS_2005` é código
1–11 (**7** = médio completo, **9** = superior completo, 10/11 = mestrado/doutorado);
`VINCULO_ATIVO_31_12` = 1 para o estoque ativo em 31/12.

## 3. Pré-requisitos na 10.1.141.23

- **Python 3.6** (só tem essa versão). Os scripts do lake são escritos compatíveis com
  3.6 — sem `from __future__ import annotations`, sem `list[...]`/`str | None`.
- **pymongo < 4** (a 4.x exige 3.7+):
  ```bash
  pip3 install --user 'pymongo<4'
  ```
- **Repositório** (sparse checkout só de `database/`, sem os arquivos da raiz, branch
  `database`). Usar **non-cone mode** — o cone mode sempre traz a raiz junto:
  ```bash
  git clone --no-checkout --filter=blob:none \
    https://github.com/kenjimattos/sebrae_opp.git ~/sebrae_opp
  cd ~/sebrae_opp
  git sparse-checkout set --no-cone '/database/'   # só database/ no working tree
  git checkout database
  ```
  (Para converter um checkout que já existe em cone mode: `git sparse-checkout set
  --no-cone '/database/'`. O git pode avisar que non-cone é "deprecated" — inofensivo
  para uma pasta só.)
- **Banco OPP montado** (coleções + validadores + índices) no `DadosOPP`:
  ```bash
  mongosh "mongodb://usrdadosopp@127.0.0.1:27017/DadosOPP?authSource=DadosOPP" \
    database/setup.mongodb.js
  mongosh "mongodb://usrdadosopp@127.0.0.1:27017/DadosOPP?authSource=DadosOPP" \
    database/seed/municipios.mongodb.js   # 223 municípios canônicos
  mongosh "mongodb://usrdadosopp@127.0.0.1:27017/DadosOPP?authSource=DadosOPP" \
    database/seed/agendas.mongodb.js      # 6 agendas
  ```
- **Credenciais via `.env`** (não digitar senha na linha de comando). Copie o template
  versionado e preencha as senhas — o `.env` real fica fora do git (`database/.gitignore`):
  ```bash
  cp database/.env.example database/.env   # depois edite OPP_MONGO_PASS etc.
  chmod 600 database/.env
  ```
  Os geradores que tocam lake/OPP leem os defaults de conexão de `os.environ`
  (`RAIS_MONGO_*`, `RFB_MONGO_*`, `PNCP_MONGO_*`, `OPP_MONGO_*`); o template cobre os
  quatro grupos — preencha só os das fontes que for rodar. Carregue antes de rodar:
  ```bash
  set -a; source database/.env; set +a   # `set -a` faz cada atribuição virar export
  ```
  Com isso os flags `--rfb-user/--rfb-pass/--opp-user/--opp-pass/--mongo-host` ficam
  opcionais (só passe para sobrescrever pontualmente). É a mesma fonte que o cron usa (§5).

> **Atualização jun/2026 (geradores `*_lake.py`):** dois ganhos deixam a operação quase sem
> argumentos. (a) **Auto-load:** os scripts carregam `database/.env` sozinhos no início —
> **não precisa mais `source`** (em nenhum terminal nem no cron). Precedência: flag de CLI >
> variável exportada > `.env` > default do script. (b) **Defaults do lake:** host
> `10.19.4.174:27018`, authSource `admin` e credencial `usr_<BASE>:usr_<BASE>` (usr_REDESIM,
> usr_RAIS, usr_RECEITA_FEDERAL, usr_PNCP) são derivados no script → **não precisa passar
> `--mongo-host/--mongo-user/--mongo-pass`**. Na prática o `.env` só precisa do
> `OPP_MONGO_USER`/`OPP_MONGO_PASS` (o user do OPP, `usrdadosopp`, não segue o padrão `usr_`),
> e a rodada mínima vira `python3 …_lake.py --write-mongo`. Os comandos com flags explícitas
> abaixo continuam válidos (sobrescrevem), mas hoje são opcionais.

## 4. Operação manual (passo a passo)

```bash
# 1) CALIBRAR (1ª vez / coleção de ano novo): confere nomes de campo + distribuição
python3 database/scripts/gerar_seed_escolaridade.py --inspect \
  --mongo-host 10.19.4.174 --mongo-user usr_RAIS --mongo-pass usr_RAIS \
  --mongo-db RAIS --collection 2024_VINC

# 2) RODAR + ESCREVER no OPP (lê lake, agrega, valida, upsert em DadosOPP)
python3 database/scripts/gerar_seed_escolaridade.py \
  --mongo-host 10.19.4.174 --mongo-user usr_RAIS --mongo-pass usr_RAIS \
  --mongo-db RAIS --collection 2024_VINC \
  --opp-user usrdadosopp --opp-pass 'SENHA' --write-mongo

# 3) CONFERIR (deve dar 446 = 223 × 2 indicadores)
mongosh "mongodb://usrdadosopp@127.0.0.1:27017/?authSource=DadosOPP" \
  --eval "db.getSiblingDB('DadosOPP').indicatorValues.countDocuments({indicatorId:/completo/})"
```

Modos úteis:
- `--inspect` — conecta, mostra 1 doc + distribuição de escolaridade; não escreve.
- `--offline` — regenera a partir do snapshot (`database/data/escolaridade_pb_2024.json`),
  **sem** reconsultar o lake. Bom para iterar na escrita sem o scan lento.
- `--write-mongo` — além dos seeds `.js`, faz upsert direto em `indicators` +
  `indicatorValues`. Sem ele, só gera os seeds versionados.
- `validate()` roda sempre antes de escrever: aborta se a cobertura (< 200 munis) ou os
  totais cheirarem a erro (pegou um export truncado em 100 linhas no GUI).

## 5. O cron

Segredos **fora** do crontab — no `database/.env` (modelo: `database/.env.example`, §3).
O `.env` não vai pro git; fica só na 10.1.141.23 com `chmod 600`. O wrapper do cron dá
`source` nele antes de chamar o gerador, então nenhuma senha aparece no crontab nem no log.

`crontab -e` (RAIS é anual → roda em fev e ago; não precisa mensal):

```cron
0 3 1 2,8 * cd $HOME/sebrae_opp && git pull -q && \
  set -a && . database/.env && set +a && \
  python3 database/scripts/gerar_seed_escolaridade.py \
    --mongo-db RAIS --collection 2024_VINC \
    --write-mongo >> $HOME/opp_etl.log 2>&1
```

(`--mongo-host` sai do `RFB_MONGO_HOST`/`PNCP_MONGO_HOST` do `.env`; só permanece no comando
o que é específico da rodada — coleção/ano.) Para o RF Estabelecimentos (§9), o cron é idêntico
trocando o gerador por `gerar_seed_negocios_rfb_lake.py --ano <ano> --write-mongo`.

Quando sair a RAIS 2025: trocar `--collection 2025_VINC` e a constante `ANO` no script.
(CAGED é mensal → outro script, cron mais frequente.)

## 6. Troubleshooting (gotchas reais desta integração)

| Sintoma | Causa | Correção |
|---|---|---|
| `SyntaxError: future feature annotations` | Python 3.6 no host | script já é 3.6-safe; use `python3` do host, `pymongo<4` |
| `Authentication failed` no lake | authSource errado | lake usa `--auth-db admin` (já é default) |
| `Authentication failed` no OPP | banco/authSource errado | é `DadosOPP`, não `opp` (já é default); confira usuário/senha no GUI (aba Authentication) |
| `Command update requires authentication` | sem `--opp-user/--opp-pass` | passe as credenciais do OPP (ou via env) |
| conexão recusada no lake | porta | lake é **27018**, não 27017 (já é default) |
| export do GUI com 100 linhas | limite de resultado do NoSQLBooster | use o script direto (`--write-mongo`); o GUI manual foi só ponte inicial |
| `git diff` no snapshot após rodar | ordem de chaves do JSON | snapshot canônico já normalizado (muni6 primeiro); valores idênticos |

## 7. Estender para um novo indicador do lake

O `gerar_seed_escolaridade.py` é o molde. Para um indicador novo (RAIS ou CAGED):
1. Copie o script; ajuste `IND_*`, `AGENDA_ID`, os campos `CAMPO_*` e o `$group`/`$match`
   do `_pipeline()`. Rode `--inspect` numa coleção para confirmar os nomes de campo.
2. Mantenha 3.6-compatível (sem sintaxe 3.7+), os defaults de conexão (lake 27018/admin,
   OPP DadosOPP) e o `validate()` com guarda-corpos próprios do indicador.
3. Snapshot versionado em `database/data/`, seeds em `database/seed/`, e `--write-mongo`
   para o `DadosOPP`. Adicione ao cron.

> Maturação futura: extrair `fetch`/`validate`/`write_mongo` para um módulo comum e cada
> indicador virar um arquivo de config — transforma o piloto em plataforma.

---

## 8. PNCP (compras públicas) — `mpe-compras-publicas`

O lake ingere **PNCP** (base `PNCP`) **e Receita Federal** (base `RECEITA_FEDERAL`), ambos no
`10.19.4.174:27018`. Usamos o lake em vez da API pública do PNCP (instável — ver `MAPEAMENTO
§12`). Métrica: % do valor de contratos da **esfera municipal** com fornecedor de pequeno porte
(ME/EPP). Gerador: `database/scripts/gerar_seed_mpe_compras_publicas_lake.py`.

Diferença vs. escolaridade: o PNCP **não traz o porte** do fornecedor → join com a Receita
Federal. Mas como a RF **também está no lake**, o join é um `$in` no Mongo — **sem BigQuery,
uma rodada só** na 10.1.141.23. **Ano-alinhado:** `CONTRATOS_2025` × `RF_EMPRESAS_2025` ×
`RF_SIMPLES_2025` (porte/MEI do mesmo ano do contrato).

| Alvo | Base | Coleção | Usuário (authSource `admin`) |
|---|---|---|---|
| Contratos | `PNCP` | `CONTRATOS_2025` | `usr_PNCP` |
| Porte | `RECEITA_FEDERAL` | `RF_EMPRESAS_2025` | `usr_RECEITA_FEDERAL` |
| MEI | `RECEITA_FEDERAL` | `RF_SIMPLES_2025` | `usr_RECEITA_FEDERAL` |

```bash
# 0) CALIBRAR (1ª vez): PNCP — campos, esfera, distribuição de ANO_CONTRATO e qual VALOR_* usar
#    (creds do lake usr_PNCP / usr_RECEITA_FEDERAL são DERIVADAS de --mongo-db/--rfb-db → não passe --mongo-user/--mongo-pass/--rfb-user/--rfb-pass)
python3 database/scripts/gerar_seed_mpe_compras_publicas_lake.py --inspect \
  --mongo-host 10.19.4.174 --mongo-db PNCP --collection CONTRATOS_2025

#    RF — confere RF_EMPRESAS (porte) e RF_SIMPLES (qual é o campo de MEI)
python3 database/scripts/gerar_seed_mpe_compras_publicas_lake.py --inspect-rfb \
  --mongo-host 10.19.4.174 \
  --rfb-db RECEITA_FEDERAL --rfb-collection RF_EMPRESAS_2025 --rfb-simples-collection RF_SIMPLES_2025
#    -> ajuste as constantes CAMPO_*/RFB_CAMPO_* no topo do script se algo divergir.

# 1) RODAR + ESCREVER no OPP (harvest PNCP + porte RF + agrega + upsert) — tudo numa rodada
python3 database/scripts/gerar_seed_mpe_compras_publicas_lake.py --ano 2025 \
  --mongo-host 10.19.4.174 --mongo-db PNCP --collection CONTRATOS_2025 \
  --rfb-db RECEITA_FEDERAL --rfb-collection RF_EMPRESAS_2025 --rfb-simples-collection RF_SIMPLES_2025 \
  --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

# 2) (opcional) regenerar o seed do snapshot, sem reconsultar o lake
python3 database/scripts/gerar_seed_mpe_compras_publicas_lake.py --offline
```

`validate()` aborta se a cobertura/valores cheirarem a campo errado. **Sem `threshold`** (não há
faixa oficial). `referenceYear` = `--ano`. Flags: `--sem-esfera` (dump sem `ESFERA_ID`),
`--sem-ano` (confia no recorte da coleção em vez de filtrar `ANO_CONTRATO`),
`--rfb-simples-collection ''` (pula o MEI — `PORTE_EMPRESA` '01' conta como ME).

---

## 9. Estoque/fluxo de empresas (RF Estabelecimentos) — abertos / ativas / extintos / crescimento-mpe + base econômica por porte

**Até 8** indicadores saem da **mesma fonte, numa rodada**: a base de **Estabelecimentos da Receita
Federal no lake** (`RF_ESTABELECIMENTOS_<ano>`, ~37,6M docs). Gerador:
`database/scripts/gerar_seed_negocios_rfb_lake.py` (molde do `gerar_seed_escolaridade.py`; 1 script
→ **8 seeds**). **4 de agenda:** três da **Inclusão produtiva** (contagem de estabelecimentos no
ano-ref: abertos/extintos = pequeno porte; ativas = todos os portes) + `crescimento-mpe` (agenda
*Ecossistemas de Inovação*, **var. % a.a.** do mesmo fluxo de aberturas, consolidado em jul/2026). **4
da base econômica** (`socialeconomic`): `empresas-ativas-total` (estoque total) + `meis`/`mes`/`epps`
(estoque ativo por porte). **Todos sem threshold.** Agregação no lake — sem BigQuery, sem API. O porte
vem da `RF_EMPRESAS` por `$in`, o MEI da `RF_SIMPLES`.

> Aberturas agregadas na janela `2016..ano-ref` (série do crescimento-mpe); abertos usa só ref/prev.
> ⚠️ `meis`/`mes`/`epps` exigem resolver o porte de **~todos os CNPJs ativos da PB** (estoque) → só
> saem no **run online**; `--offline` gera os outros 5 seeds e avisa o que pulou. `--write-mongo` grava
> tudo no `DadosOPP` (rodada completa = **1.784 valores**, 223 × 8).

| Alvo | Base | Coleção | Usuário (authSource `admin`) |
|---|---|---|---|
| Estabelecimentos (driver) | `RECEITA_FEDERAL` | `RF_ESTABELECIMENTOS_2025` | `usr_RECEITA_FEDERAL` |
| Porte | `RECEITA_FEDERAL` | `RF_EMPRESAS_2025` | `usr_RECEITA_FEDERAL` |
| MEI | `RECEITA_FEDERAL` | `RF_SIMPLES_2025` | `usr_RECEITA_FEDERAL` |
| De-para município | **`DadosOPP`** | `municipalities` (campo `rfCode`) | `usrdadosopp` |

> ⚠️ **Município = código da RFB, não IBGE.** Diferente da RAIS, o campo `MUNICIPIO` do
> `RF_ESTABELECIMENTOS` é o **código da Receita Federal** (`id_municipio_rf`: 2051=João Pessoa,
> 1981=Campina Grande). O recorte da PB é por **`UF=='PB'`** (campo string); o código é traduzido p/
> IBGE pelo campo **`rfCode` da coleção `municipalities`** do próprio `DadosOPP` (gerado pelo
> `gerar_seed_municipios.py`). Nada de fonte externa em runtime. **Carregue o seed de municípios
> (já com `rfCode`) antes da 1ª rodada.**

```bash
# 0) PRÉ-REQUISITO (1ª vez): carrega municipalities com o campo rfCode no DadosOPP
mongosh "mongodb://usrdadosopp@127.0.0.1:27017/DadosOPP?authSource=DadosOPP" \
  database/seed/municipios.mongodb.js

#    CALIBRAR: estabelecimentos (coleção, UF, situação '2'/'8', datas) + confere a de-para
#    (creds do lake usr_RECEITA_FEDERAL:usr_RECEITA_FEDERAL são DERIVADAS de --rfb-db → não passe --rfb-user/--rfb-pass)
python3 database/scripts/gerar_seed_negocios_rfb_lake.py --inspect --ano 2025 --mongo-host 10.19.4.174
python3 database/scripts/gerar_seed_negocios_rfb_lake.py --inspect-muni --ano 2025 \
  --mongo-host 10.19.4.174 --opp-user usrdadosopp --opp-pass 'SENHA'
#    empresas (porte) + simples (MEI)
python3 database/scripts/gerar_seed_negocios_rfb_lake.py --inspect-rfb --ano 2025 --mongo-host 10.19.4.174
#    -> ajuste as constantes ESTAB_CAMPO_*/RFB_CAMPO_* (ou env) se algo divergir.

# 1) RODAR + ESCREVER no OPP (lê de-para no OPP + 3 agregações no estab + porte na RF + upsert) — uma rodada
python3 database/scripts/gerar_seed_negocios_rfb_lake.py --ano 2025 \
  --mongo-host 10.19.4.174 --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

# 2) (opcional) regenerar os seeds do snapshot, sem reconsultar o lake
python3 database/scripts/gerar_seed_negocios_rfb_lake.py --offline
```

Coleções default = `RF_{ESTABELECIMENTOS,EMPRESAS,SIMPLES}_<ano>` (derivam do `--ano`; override por
`--estab-collection`/`--empresas-collection`/`--simples-collection`, ou `--simples-collection -` p/
pular o MEI). **O online sempre lê a de-para no `DadosOPP` → passe `--opp-user/--opp-pass` mesmo sem
`--write-mongo`.** `--rfb-scan` força varredura única se faltar índice em `CNPJ_BASICO`. O filtro por
PB é um COLLSCAN (coleção nacional ~37,6M) → cada rodada leva minutos, como a RAIS. `validate()`
aborta se a cobertura (< 150 munis) ou o total de ativos (< 50k) cheirarem a erro. RF é anual →
mesmo cron da escolaridade (fev/ago), trocando `--ano`.

---

## 10. Tempo de abertura / viabilidade (Redesim no lake) — `tempo-abertura` / `tempo-viabilidade`

Dois indicadores da agenda **Simplificação e digitalização** saem da base **`REDESIM`** do lake
(coleção `BRASIL_<ano>` = microdados de **solicitações de abertura**, ~0,91M/ano em 2025 — os
mesmos dados que a API pública `estatistica.redesim.gov.br` expõe em XLSX). Gerador:
`database/scripts/gerar_seed_tempo_abertura_lake.py` (molde da escolaridade; **1 script → 2 seeds**).
Substitui a coleta pela API (geradores legados `gerar_seed_tempo_{abertura,viabilidade}.py` seguem
no repo como fallback). Caminho **autocontido**: sem internet/API em runtime (sem cross-check).

**Métrica:** marco de 75% (P75) do tempo em **horas úteis**, por município:
- `tempo-viabilidade` = P75(`QTDE_HH_VIABILIDADE_TOTAL`)
- `tempo-abertura` = P75(`QTDE_HH_VIABILIDADE_TOTAL` + `QTDE_HH_LIBERACAO_DBE` + `QTDE_HORAS_DEFERIMENTO`)

`threshold` lower-better 72/168h (faixas oficiais 🟢≤72h · 🟡🟠 72–168h · 🔴>168h → semáforo de 3).
O **P75 é reimplementado à mão** (host é Python 3.6, sem `statistics.quantiles`) reproduzindo o
método `inclusive` do CPython → idêntico aos seeds da API.

| Alvo | Base | Coleção | Usuário (authSource `admin`) |
|---|---|---|---|
| Solicitações de abertura | `REDESIM` | `BRASIL_2025` | `usr_REDESIM` |
| Destino | **`DadosOPP`** | `indicators` / `indicatorValues` | `usrdadosopp` |

> **Município = NOME** (não IBGE; ex. `'CAMPINA GRANDE'`) → casa por slug com o seed de municípios
> (3 aliases: Joca Claudino, São Vicente do Seridó, Tacima). Recorte da PB por `UF == 'PB'`.

```bash
# 0) CALIBRAR (1ª vez / coleção de ano novo): 1 doc + cobertura PB
python3 database/scripts/gerar_seed_tempo_abertura_lake.py --inspect

# 1) RODAR + ESCREVER no OPP (lê lake, agrega P75, valida, upsert nos 2 indicadores) — uma rodada
python3 database/scripts/gerar_seed_tempo_abertura_lake.py --collection BRASIL_2025 --write-mongo

# 2) CONFERIR (446 = 223 × 2 indicadores)
mongosh "mongodb://usrdadosopp@127.0.0.1:27017/?authSource=DadosOPP" \
  --eval "db.getSiblingDB('DadosOPP').indicatorValues.countDocuments({indicatorId:/^tempo-(abertura|viabilidade)$/})"

# 3) (opcional) regenerar os 2 seeds do snapshot, sem reconsultar o lake
python3 database/scripts/gerar_seed_tempo_abertura_lake.py --offline
```

- **Defaults internos** (§3): host `10.19.4.174`, `usr_REDESIM`, coleção `BRASIL_2025` e auto-load
  do `.env` → a rodada mínima é só `--write-mongo` (com `OPP_*` no `.env`). Override por flag.
- **Cobertura:** ano-calendário (não janela de 12 meses). 2025 = **196/223** municípios; os demais
  entram `numericValue: null`; n<30 → `confiabilidade: "baixa"`. `validate()` aborta se < 150 munis
  ou < 2.000 solicitações PB.
- ⚠️ **`ranking-redesim` e `tempo-licenciamento` NÃO migram** — não estão na base `REDESIM` do lake
  (só o fluxo de abertura; sem alvará/ranking). Seguem na API `redesim.pb.gov.br` (não há gerador
  de lake para eles).
- **Cron** (Redesim é anual; rode sobre o ano-calendário fechado):

```cron
0 3 1 2 * cd $HOME/sebrae_opp && git pull -q && \
  python3 database/scripts/gerar_seed_tempo_abertura_lake.py \
    --collection BRASIL_2025 --write-mongo >> $HOME/opp_etl.log 2>&1
```

---

## 11. Compras públicas de inovação (PNCP × RF) — `compras-publicas-inovacao`

Agenda **Ecossistemas de Inovação**. Métrica = **valor (R$/ano)** — `valorInovPeq[refYear]`, o
valor de contratos da esfera **municipal** firmados com **pequeno negócio** (ME/EPP/MEI) que são
de **inovação**. É **NÍVEL, não crescimento**: a var. a.a. mede a adesão crescente ao PNCP (jun/
2026: total PJ +303% 2024→2025, share de inovação caiu 3,96%→2,86%), não a política — por isso
reportamos o valor do ano. Gerador: `gerar_seed_compras_publicas_inovacao_lake.py` (molde do §8 +
join de CNAE + classificador). **Sem threshold.** Município sem contrato municipal a PJ no PNCP →
`numericValue: null` (cobertura); com contrato e sem inovação → `0`.

**Inovação = união de dois sinais, ambos no lake:** (A) CNAE do fornecedor ∈ {TIC 26/61/62/63 ·
criativa 58/59/60/73/74/90/91 · P&D 72} via `RF_ESTABELECIMENTOS` (prefere a matriz); (B)
`OBJETO_CONTRATO` classificado pela semente de `database/scripts/calibrar_compras_inovacao.py`
(fonte única; veta conteúdo didático). Confiança 'alta' quando A ∩ B. **Harvest de UM ano**
(refYear); o ano−1 entra só como **reserva de CNAE** (`RF_ESTABELECIMENTOS` do ano costuma vir
parcial — ver gotcha abaixo).

| Alvo | Base | Coleção | Usuário (authSource `admin`) |
|---|---|---|---|
| Contratos | `PNCP` | `CONTRATOS_2025` e `CONTRATOS_2024` | `usr_PNCP` |
| Porte | `RECEITA_FEDERAL` | `RF_EMPRESAS_<ano>` | `usr_RECEITA_FEDERAL` |
| MEI | `RECEITA_FEDERAL` | `RF_SIMPLES_<ano>` | `usr_RECEITA_FEDERAL` |
| CNAE | `RECEITA_FEDERAL` | `RF_ESTABELECIMENTOS_<ano>` | `usr_RECEITA_FEDERAL` |

```bash
# 0) CALIBRAR (1ª vez): PNCP (campos/esfera/objeto), RF porte/MEI, e o CNAE em estabelecimentos
python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py --inspect --ano 2025
python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py --inspect-rfb --ano 2025
python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py --inspect-estab --ano 2025
#    -> confirma CNAE_FISCAL_PRINCIPAL + IDENTIFICADOR_MATRIZ_FILIAL (jun/2026: ambos confirmados).
#    Para afinar a semente do objeto: calibrar_compras_inovacao.py --inspect/--score (ver script).

# 1) RODAR + ESCREVER no OPP (harvest 2 anos + porte/CNAE na RF + agrega + crescimento + upsert)
python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py --ano 2025 \
  --mongo-host 10.19.4.174 --write-mongo --opp-user usrdadosopp --opp-pass 'SENHA'

# 2) (opcional) regenerar o seed do snapshot (per-município por ano), sem reconsultar o lake
python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py --offline
```

- **Defaults internos:** host `10.19.4.174:27018`, credenciais `usr_PNCP`/`usr_RECEITA_FEDERAL`,
  coleções derivam do `--ano` (e `--ano−1`), auto-load do `.env` → rodada mínima é só `--ano` +
  `--write-mongo`. `--rfb-scan` força varredura única se faltar índice em `CNPJ_BASICO`.
- ⚠️ **Carga parcial de `RF_ESTABELECIMENTOS` (gotcha real, jun/2026):** `RF_ESTABELECIMENTOS_2025`
  estava a ~59% (37,6M vs 63,7M de 2024) → CNAE só resolvia 59% em 2025 e **quebrava a comparação
  entre os anos**. Mitigação no script: **fallback de CNAE para ano adjacente** — o que não
  resolve no estab do ano cai para o do outro ano da rodada (CNAE é atributo estável). Os logs
  mostram `CNAE via RF_ESTABELECIMENTOS_2024 (fallback): +N`. Se **ambos** os anos vierem parciais,
  passe um ano-base completo em `--cnae-fallback-anos 2023`. Compare os counts antes de confiar:
  `estimatedDocumentCount()` de estab deve ser ≳ empresas do mesmo ano.
- **Reta-calibração (jun/2026):** amostra de 400 contratos municipais PJ da PB deu ~2% pelo sinal
  B (objeto) — número final tende a ser dominado pelo sinal A (CNAE). Re-tunar a semente exige
  re-rodar online (o snapshot guarda só os agregados por município/ano, não os objetos).
- **Cron** (PNCP/RF são anuais; rode sobre o ano-calendário fechado, junto do §8):

```cron
0 4 1 2 * cd $HOME/sebrae_opp && git pull -q && \
  python3 database/scripts/gerar_seed_compras_publicas_inovacao_lake.py \
    --ano 2025 --write-mongo >> $HOME/opp_etl.log 2>&1
```
