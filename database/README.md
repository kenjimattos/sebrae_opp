# Banco de Dados — Plataforma OPP

Modelagem e povoamento do banco **MongoDB** da OPP (servidor do Sebrae Nacional).
O banco é a **fonte de verdade** dos dados de indicadores. Hoje cobre **15 indicadores**
para os **223 municípios da Paraíba** — **IDH-M** (Censo 2010), **IGM-CFA** (série
histórica 2017–2026), **IGMA** (2026), **IDSC** (Instituto Cidades Sustentáveis, 2025),
**Trabalhadores nas ocupações de C&T**
(RAIS 2024), **Trabalhadores em economia criativa/inovação/TIC** (RAIS 2024),
**as duas dimensões ISDEL** — Governança para o Desenvolvimento e Educação
Empreendedora (Sebrae, série 2015–2023), **Crescimento de MPE nos ELI** (Observatório
Sebrae) e a agenda **Simplificação e digitalização** completa (Tempo de abertura /
viabilidade, Ranking municipal e Tempo de licenciamento, Redesim/PB) e
**Trabalhadores formais com Ensino Médio e Superior Completo** (RAIS 2024, via
acesso direto ao data lake do Sebrae); os
demais entram pelo mesmo padrão (ver
[Adicionar um novo indicador](#adicionar-um-novo-indicador)).

> **Estado atual (handoff):**
> - Banco `DadosOPP` (servidor Sebrae, acesso via VPN/NoSQLBooster) **montado e populado**:
>   4 coleções com validadores + índices, 223 municípios, **IDH-M 2010**,
>   **IGM-CFA 2017–2026**, **IGMA 2026**, **Trabalhadores em C&T 2024**,
>   **Trabalhadores em economia criativa/inovação/TIC 2024**, **as duas dimensões ISDEL
>   2015–2023** (Governança + Educação Empreendedora), os indicadores **Redesim** e o
>   **Crescimento de MPE** e **Trabalhadores formais com Ensino Médio/Superior Completo**
>   (RAIS 2024, via **data lake do Sebrae** — ver `RUNBOOK_ETL.md`) já gerados (rode os
>   seeds no NoSQLBooster — ver montagem).
> - Chave de `indicatorValues` **preparada para histórico** (`{município, indicador, ano}`);
>   o IGM-CFA já exercita isso com **10 anos por município** (2.230 valores) e cada
>   dimensão ISDEL com **9 anos** (2.007 valores).
> - O frontend ainda usa os estáticos de `src/data/`; a integração via **API/backend está
>   adiada** (plano guardado fora do repo) — o schema já suporta sem remodelar.
> - **Próximo passo:** adicionar mais indicadores (mesmo padrão) e/ou a API.

---

## Pré-requisitos

- **MongoDB** do Sebrae, acessível pelo **NoSQLBooster** (você já conectado via VPN).
- Para **regenerar** os dados a partir da fonte oficial (opcional — os scripts já
  vêm prontos no repo):
  - Python 3 + `pip install google-cloud-bigquery`
  - Credenciais GCP (ADC): `gcloud auth application-default login`
  - Um projeto GCP para faturamento das consultas (uso fica no free tier de 1 TB/mês).

---

## Como montar o banco (primeira vez)

No NoSQLBooster, **com o banco da OPP selecionado** na conexão, rode os scripts
nesta ordem (cada um imprime um resumo ao final):

> **Alternativa via terminal (`mongosh`):** em vez do NoSQLBooster, dá pra aplicar
> os seeds pela linha de comando com `database/scripts/aplicar_seeds.sh`, que lê a
> conexão do `database/.env` (bloco OPP) — ex.:
> `database/scripts/aplicar_seeds.sh indicador-idsc indicador-cobertura-atencao-basica`
> ou `--all` para todos. Requer `mongosh` no PATH e o `database/.env` preenchido.

1. `setup.mongodb.js` — cria as 4 coleções (com validadores) e os índices.
2. `seed/municipios.mongodb.js` — 223 municípios da PB.
3. `seed/agendas.mongodb.js` — estrutura das 6 agendas.
4. `seed/indicador-idh-m.mongodb.js` — catálogo do IDH-M + valores dos 223 municípios.
5. `seed/indicador-igm-cfa.mongodb.js` — catálogo do IGM-CFA + 2.230 valores (223 × 2017–2026).
6. `seed/indicador-igma.mongodb.js` — catálogo do IGMA + 223 valores (2026, com 6 pilares).
7. `seed/indicador-trabalhadores-ct.mongodb.js` — catálogo + 223 valores de Trabalhadores em C&T (RAIS 2024).
8. `seed/indicador-trabalhadores-tic.mongodb.js` — catálogo + 223 valores de Trabalhadores em economia criativa/inovação/TIC (RAIS 2024).
9. `seed/indicador-isdel-governanca.mongodb.js` — catálogo + 2.007 valores de Governança para o Desenvolvimento – ISDEL (223 × 2015–2023).
10. `seed/indicador-tempo-abertura.mongodb.js` — catálogo `tempo-abertura` + 223 valores, Redesim (janela de 12 meses).
11. `seed/indicador-tempo-viabilidade.mongodb.js` — catálogo `tempo-viabilidade` + 223 valores, Redesim (janela de 12 meses).
12. `seed/indicador-ranking-redesim.mongodb.js` — catálogo `ranking-redesim` + 223 valores, Ranking Municipal Redesim/PB (janela de 6 meses).
13. `seed/indicador-tempo-licenciamento.mongodb.js` — catálogo `tempo-licenciamento` + 223 valores, Índice de Tempo de alvará Redesim/PB (janela de 6 meses).
14. `seed/indicador-mpe-eli-sebrae.mongodb.js` — catálogo `mpe-eli-sebrae` + 223 valores, Crescimento de MPE formalizadas nos ELI (Observatório Sebrae).
15. `seed/indicador-isdel-educacao-emp.mongodb.js` — catálogo `isdel-educacao-emp` + 2.007 valores, Educação Empreendedora – ISDEL (223 × 2015–2023, **sem semáforo**).
16. `seed/indicador-trabalhadores-medio-completo.mongodb.js` — catálogo `trabalhadores-medio-completo` + 223 valores, Trabalhadores formais com Ensino Médio Completo (RAIS 2024, **data lake do Sebrae**, **sem semáforo**).
17. `seed/indicador-trabalhadores-superior-completo.mongodb.js` — catálogo `trabalhadores-superior-completo` + 223 valores, Trabalhadores formais com Ensino Superior Completo (RAIS 2024, **data lake do Sebrae**, **sem semáforo**).
18. `seed/indicador-idsc.mongodb.js` — catálogo `idsc` + 223 valores, IDSC-BR 2025 (Instituto Cidades Sustentáveis, **API pública**, **sem semáforo**).
19. `seed/indicador-credito-financiamento.mongodb.js` — catálogo `credito-financiamento` + 223 valores, Crédito concedido no município (saldo de Operações de Crédito, ESTBAN/BCB, **data lake do Sebrae**, mês 202011, **sem semáforo**; só 47/223 municípios têm agência, demais `null`).

Todos são **idempotentes** (usam `upsert`): rodar de novo atualiza, não duplica.

> Por padrão os scripts operam no banco atualmente selecionado (`const database = db`).
> Para mirar um banco com nome fixo, troque essa linha por `const database = db.getSiblingDB('opp')`.

### Conferência rápida (no NoSQLBooster)

```js
db.municipalities.countDocuments()      // 223
db.agendas.countDocuments()             // 6
db.indicators.countDocuments()          // 12
db.indicatorValues.countDocuments()     // 8251
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'idh-m' })
// João Pessoa -> rawValue "0,763"  (status/tone derivam do threshold do indicador)
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'igm-cfa', referenceYear: '2026' })
// João Pessoa -> rawValue "6,38"  + breakdown { financas, gestao, desempenho }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'igma', referenceYear: '2026' })
// João Pessoa -> rawValue "58,24"  + breakdown { 6 pilares, posicao, classificacao }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'trabalhadores-ct', referenceYear: '2024' })
// João Pessoa -> rawValue "19.760"  + breakdown { pesquisadores, cienciasEngenharia, tecnicos }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'trabalhadores-tic', referenceYear: '2024' })
// João Pessoa -> rawValue "2,17%"  + breakdown { vinculosSetor, vinculosTotal, tic, criativa, pesquisa }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'isdel-governanca', referenceYear: '2023' })
// João Pessoa -> rawValue "0,431"  (status/tone derivam do threshold; escala ISDEL 0–1)
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'isdel-educacao-emp', referenceYear: '2021' })
// João Pessoa -> rawValue "0,620"  (sem threshold/semáforo; escala ISDEL 0–1; exibe 2021)
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'tempo-abertura', referenceYear: '2026' })
// João Pessoa -> rawValue "18,6h" (marco 75%, horas úteis) + breakdown { n, confiabilidade, marco75Dias, media, mediana, faixaOficial }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'tempo-viabilidade', referenceYear: '2026' })
// João Pessoa -> rawValue "18,0h" (marco 75%, horas úteis) + breakdown { n, confiabilidade, marco75Dias, media, mediana, faixaOficial }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'ranking-redesim', referenceYear: '2026' })
// João Pessoa -> rawValue "350" (total 0–600) + breakdown { posicao, percentual, documentoHabilitado, indiceAtendimento, indiceTempo, regiao }
db.indicatorValues.findOne({ municipalityId: '2507507', indicatorId: 'tempo-licenciamento', referenceYear: '2026' })
// João Pessoa -> rawValue "16" (Índice de Tempo de alvará 0–120) + breakdown { alvaraLocalizacao, alvaraSanitario, semEmissaoAlvara }
```

---

## Schema

Quatro coleções. IDs são strings estáveis (código IBGE / id do catálogo), o que
torna os `upsert` naturais e idempotentes.

### `municipalities`
| campo | tipo | descrição |
|---|---|---|
| `_id` | string | código IBGE (7 dígitos) |
| `name` | string | nome oficial |
| `slug` | string | slug normalizado (índice único) |

### `agendas`
| campo | tipo | descrição |
|---|---|---|
| `_id` | string | id da agenda (`governanca`, …) |
| `name` | string | nome completo |
| `order` | int | ordem de exibição |

### `indicators` (catálogo)
Um mesmo indicador pode ser exibido em mais de uma seção (agenda e/ou socialeconomic)
via `placements` — não há duplicação de documento.

| campo | tipo | descrição |
|---|---|---|
| `_id` | string | id do indicador no catálogo (ex: `idh-m`) |
| `label` | string | rótulo exibido |
| `threshold` | obj\|ausente | régua de classificação (semáforo) — `{ kind, success, warning }`, **das faixas oficiais da fonte**; status deriva dela. **Ausente = indicador sem classificação** (só exibe o valor) — usado quando a fonte não publica faixa oficial (ver [Classificação](#classificação-semáforo)) |
| `updatedAt` | string | ano de referência **exibido por padrão** (ex: `"2010"`); o histórico mora nos valores |
| `description` | string | texto do tooltip |
| `source` / `sourceDataset` | string | fonte legível / chave técnica |
| `placements` | array | seções onde aparece: `[{ section, agendaId?, order }]` |

`placements[].section` ∈ `agenda` \| `socialeconomic`. Para `section='agenda'`, `agendaId`
referencia `agendas._id`. `order` define a posição dentro da seção.

### `indicatorValues` (1 doc por município × indicador × ano)
| campo | tipo | descrição |
|---|---|---|
| `municipalityId` | string | ref `municipalities._id` — parte da chave |
| `indicatorId` | string | ref `indicators._id` — parte da chave |
| `referenceYear` | string | ano do dado (ex: `"2010"`) — **parte da chave** (histórico) |
| `rawValue` | string | valor de exibição em padrão BR (`"0,763"`) |
| `numericValue` | double\|null | valor numérico parseado |
| `variation` | string | variação (cards socialeconomic); opcional |
| `tone` | enum\|null | cor do card; opcional (em geral derivada do threshold) |
| `source` | string | fonte do dado |
| `isFictional` | bool | `true` = dado de demonstração |
| `breakdown` | obj | sub-índices opcionais (IDH-M: `{ educacao, longevidade, renda }`) |
| `updatedAt` | date | timestamp do último upsert |

**Série histórica:** a chave inclui o ano, então o mesmo indicador convive em vários
anos (ex: IDH-M `2010` e `2022`) sem sobrescrever. Qual ano exibir: por padrão o
`indicators.updatedAt`, ou o ano que a UI escolher (ex: o mais recente disponível). O
"de quando é o dado" mostrado no card vem do `referenceYear` do valor exibido.

**Índices:** `municipalities.slug` (único); `indicators {placements.section}`;
`indicatorValues {municipalityId, indicatorId, referenceYear}` (**único**, chave de
upsert) e `indicatorValues {indicatorId, referenceYear}` (mapa: um indicador num ano).

### O caso IDH-M (um indicador, duas seções)
O IDH-M aparece em dois lugares do produto (agenda `governanca` e cards socialeconomic
do Panorama), mas é **um único** documento `idh-m` com dois `placements` — e **um único**
valor por município. Onde for exibido, o status/tone é derivado do `threshold`.

> O **dado é do Censo 2010** (ver nota abaixo); fica em `referenceYear`/`updatedAt` = `2010`.

### Classificação (semáforo)

Cada indicador pode ter um **semáforo** (verde/amarelo/vermelho — `success`/`warning`/
`alert`). A régua (`threshold`) vem **das faixas oficiais da fonte**, não de cortes
inventados por nós:

| Indicador | Faixa oficial | `threshold` (success / warning) |
|---|---|---|
| **IDH-M** (PNUD) | Muito Alto ≥0,800 · Alto 0,700–0,799 · Médio 0,600–0,699 · Baixo 0,500–0,599 · Muito Baixo <0,500 | `0,7 / 0,6` (verde = Alto+; amarelo = Médio; vermelho = Baixo–) |
| **IGM-CFA** (CFA) | Alto >7,51 · Médio 5,01–7,50 · Baixo <5,00 | `7,51 / 5,01` |
| **IGMA** (Áquila) | Excelente 80–100 · Desenvolvido 65–80 · Em desenvolvimento 50–65 · Crítico 0–50 | `65 / 50` (verde = Desenvolvido+; amarelo = Em desenvolvimento; vermelho = Crítico) |
| **ISDEL Governança** (Sebrae) | Muito Alto ≥0,631 · Alto 0,471–0,630 · Médio 0,311–0,470 · Baixo 0,151–0,310 · Muito Baixo <0,150 (faixa do **índice agregado**; nota metodológica 2021, Fig. 4) | `0,471 / 0,311` (verde = Alto+; amarelo = Médio; vermelho = Baixo–). ⚠️ aplicada à **dimensão** Governança — extrapolação razoável (mesma escala 0–1, p.36), Sebrae não publica faixa por dimensão |
| **ISDEL Educação Empreendedora** (Sebrae) | — faixa oficial só p/ o índice agregado, não p/ **subdimensão** — | **ausente** (sem semáforo). É subdimensão de Capital Empreendedor, fortemente zero-inflada (nota p.34; PB 58% zeros, 2022–2023 ~100%); a nota (p.36) estende a faixa às dimensões, **não** a subdimensões → aplicá-la marcaria todos como "Muito Baixo" |
| **Trabalhadores C&T** (RAIS) | — sem faixa oficial — | **ausente** (sem semáforo) |
| **Trabalhadores criativa/TIC** (RAIS) | — sem faixa oficial — | **ausente** (sem semáforo) |
| **Tempo de abertura / viabilidade** (Redesim) | 🟢 até 3 dias · 🟡 3–5 · 🟠 5–7 · 🔴 >7 (1 dia = 24h úteis → 72/120/168h) | `lower-better, 72 / 168` (verde→Bom; amarelo+laranja→Atenção; vermelho→Crítico). Régua de 4 faixas oficiais colapsada no semáforo de 3 níveis, preservando os extremos |
| **Ranking municipal Redesim/PB** | — sem faixa oficial p/ o total — | **ausente** (sem semáforo). A fonte publica posição e pontos, mas não uma classificação bom/atenção/alerta do total |
| **Tempo de licenciamento** (Redesim/PB) | — faixas oficiais por documento/horas; não p/ o score combinado — | **ausente** (sem semáforo). É a pontuação do Índice de Tempo de alvará (0–120, maior = + rápido); horas brutas por município não são publicadas |

**Regra do projeto (jun/2026):** quando a fonte **não publica** uma classificação
oficial (caso dos dados brutos da RAIS), o indicador entra **sem `threshold`** — exibe
só o número, sem cor. Não inventamos cortes. Se no futuro adotarmos um critério próprio
(ex: tercis dos 223 municípios), ele deve ser documentado aqui como decisão do projeto.

---

## Manter atualizado

### Atualizar o IDH-M

A fonte é o **Atlas do Desenvolvimento Humano** (PNUD/Ipea/FJP), via basedosdados
(`basedosdados.mundo_onu_adh.municipio`). Consulta usada:

```sql
SELECT id_municipio, idhm, idhm_e, idhm_l, idhm_r
FROM `basedosdados.mundo_onu_adh.municipio`
WHERE ano = 2010 AND id_municipio LIKE '25%'
ORDER BY id_municipio
```

Para regenerar os scripts de seed e reaplicar:

```bash
# 1) regenera o snapshot + os scripts mongosh (consulta o BigQuery via ADC)
python3 database/scripts/gerar_seed_idh_m.py --project SEU_PROJETO_GCP

# (sem GCP em mãos? regenera a partir do snapshot já versionado:)
python3 database/scripts/gerar_seed_idh_m.py --offline

# 2) no NoSQLBooster, rode de novo: seed/indicador-idh-m.mongodb.js  (idempotente)
```

> Quando sair o **IDH-M do Censo 2022** no Atlas/basedosdados, ajuste o `ano` (e o id do
> dataset, se mudar) em `database/scripts/gerar_seed_idh_m.py` e rode de novo: como o ano
> faz parte da chave, o 2022 **entra ao lado** do 2010 (não sobrescreve). Para passar a
> exibir 2022 por padrão, atualize `indicators.updatedAt`. Hoje o basedosdados só tem o
> ADH até **2010**.

### Atualizar o IGM-CFA

A fonte é o **Índice CFA de Governança Municipal** (Conselho Federal de Administração).
O CFA **não publica microdados** (CSV/BigQuery) — só um dashboard **Power BI "publish to
web"** em [igm.cfa.org.br/bi](https://igm.cfa.org.br/bi). O gerador raspa esse dashboard
pela API pública do Power BI (endpoint `querydata`), filtrando UF=PB, parseia o **DSR**
(formato compactado) e mapeia nome→IBGE via GeoJSON. Cobre os 223 municípios da PB no
painel histórico **2017–2026** (2.230 valores); o `breakdown` guarda as 3 dimensões do
índice (Finanças, Gestão, Desempenho).

```bash
# raspa o CFA, salva o snapshot e gera o seed
python3 database/scripts/gerar_seed_igm_cfa.py

# sem rede / token expirado? regenera a partir do snapshot versionado:
python3 database/scripts/gerar_seed_igm_cfa.py --offline

# depois, no NoSQLBooster: rode seed/indicador-igm-cfa.mongodb.js (idempotente)
```

> ⚠️ **A raspagem é frágil.** O `RESOURCE_KEY` (token anônimo embutido no iframe do
> dashboard) **gira a cada poucos meses**. Quando o modo online quebrar (HTTP 403 /
> erro de schema), reabra o dashboard, capture no DevTools a URL
> `app.powerbi.com/view?r=…`, decodifique o base64 do parâmetro `r`
> (`{"k":<resourceKey>,"t":<tenant>}`) e atualize `RESOURCE_KEY` no gerador. Detalhes do
> protocolo em [MAPEAMENTO_BASE_DOS_DADOS.md](MAPEAMENTO_BASE_DOS_DADOS.md) §6. Os 8
> municípios do protótipo foram validados ponta a ponta contra os valores 2025 do frontend.

### Atualizar o IGMA

A fonte é o **Índice de Gestão Municipal Áquila (IGMA)**, da Áquila, via sua **API
pública** (sem autenticação) — `data-igma-api.aquila.com.br`. O gerador consulta o
endpoint `get_params_indicators_ranking` para os 223 municípios da PB (bloco de ids
1991–2212 + a capital João Pessoa, id 745), extrai o IGMA consolidado (escala 0–100),
a posição no ranking nacional e a classificação (Crítico / Em desenvolvimento /
Desenvolvido), e guarda no `breakdown` os 6 pilares do índice (Governança, Educação,
Saúde, Infraestrutura, Segurança, Socioeconômico). A API só publica a versão **2026**
(sem série histórica), então `referenceYear = "2026"`.

```bash
# consome a API, salva o snapshot e gera o seed
python3 database/scripts/gerar_seed_igma.py

# sem rede? regenera a partir do snapshot versionado:
python3 database/scripts/gerar_seed_igma.py --offline

# depois, no NoSQLBooster: rode seed/indicador-igma.mongodb.js (idempotente)
```

> A API é aberta e estável, mas os `id` Áquila **não são** o código IBGE — são ids
> próprios, organizados em blocos alfabéticos por estado. O gerador valida a cobertura
> contra os 223 códigos IBGE do seed de municípios (aborta se faltar/sobrar algum).
> Quando sair uma nova versão anual, ela **entra ao lado** de 2026 (o ano faz parte da
> chave); para exibi-la por padrão, atualize `indicators.updatedAt`. Detalhes do
> protocolo em [MAPEAMENTO_BASE_DOS_DADOS.md](MAPEAMENTO_BASE_DOS_DADOS.md) §7.

### Atualizar o IDSC

`gerar_seed_idsc.py` consome a **API pública do Instituto Cidades Sustentáveis**
(`cidadessustentaveis.org.br/api/idsc-br`, a mesma que alimenta o mapa oficial),
endpoint `buscarAllPerfilCidadePorSiglaEstado/PB`, e gera o seed `idsc`: pontuação
geral 0–100 dos 223 municípios da PB, com `classificacaoNacional` e `populacao` no
`breakdown`. Edição **2025** (`referenceYear = "2025"`), **sem semáforo** (o índice
composto não tem faixa oficial — só os 17 ODS têm).

```bash
# consome a API, salva o snapshot e gera o seed
python3 database/scripts/gerar_seed_idsc.py

# sem rede? regenera a partir do snapshot versionado:
python3 database/scripts/gerar_seed_idsc.py --offline

# depois, no NoSQLBooster: rode seed/indicador-idsc.mongodb.js (idempotente)
```

> A API recusa requisições **sem `User-Agent` de navegador** (403) — o gerador já manda
> um. O IDSC tem 5 edições (2015/2022/2023/2024/2025); quando sair a próxima, troque
> `ANO_IDSC` no gerador e rode de novo — entra **ao lado** das anteriores (o ano é parte
> da chave). Os endpoints de detalhe (17 ODS, série temporal, 88 indicadores) estão
> catalogados em [MAPEAMENTO_BASE_DOS_DADOS.md](MAPEAMENTO_BASE_DOS_DADOS.md) §15.

### Atualizar os Trabalhadores nas ocupações de C&T

A fonte é a **RAIS** (Relação Anual de Informações Sociais — Ministério do Trabalho),
microdados de vínculos, via basedosdados (`br_me_rais.microdados_vinculos`) no
BigQuery. O indicador conta os **vínculos formais ativos em 31/12** cujo CBO 2002
pertence ao **núcleo de ocupações de C&T** — subgrupos principais (2 primeiros
dígitos) **20** (pesquisadores/policientíficos), **21** (ciências exatas, físicas e
engenharia, inclui TIC) e **31** (técnicos de física/química/engenharia). É o "núcleo
duro" tecnológico: exclui ensino, saúde, direito, ciências sociais, artes e
administração (o conceito HRST amplo da OCDE). O `breakdown` guarda a decomposição
nesses 3 subgrupos. `referenceYear = "2024"` (última RAIS consolidada na basedosdados).

```bash
# consulta o BigQuery (ADC), salva o snapshot e gera o seed
python3 database/scripts/gerar_seed_trabalhadores_ct.py --project SEU_PROJETO_GCP

# sem GCP em mãos? regenera a partir do snapshot já versionado:
python3 database/scripts/gerar_seed_trabalhadores_ct.py --offline

# depois, no NoSQLBooster: rode seed/indicador-trabalhadores-ct.mongodb.js (idempotente)
```

> Municípios sem nenhum vínculo de C&T na RAIS não voltam na consulta e entram com
> **0** (a lista canônica dos 223 vem do seed de municípios; o gerador aborta se a
> consulta trouxer algum código fora dela). Quando sair a RAIS de um novo ano, ajuste
> `ANO` no gerador e rode de novo: como o ano faz parte da chave, ele **entra ao lado**
> de 2024. Para mudar a definição de "C&T", edite `CBO_SUBGRUPOS_CT` no gerador.

### Atualizar os Trabalhadores em economia criativa/inovação/TIC

Mesma fonte (RAIS via basedosdados `br_me_rais.microdados_vinculos`, BigQuery). Aqui o
indicador é a **participação percentual** dos vínculos formais ativos em 31/12 que estão
em **setores intensivos em conhecimento, criatividade e tecnologia**, sobre o total de
vínculos do município. "Setores" = divisões CNAE 2.0 (2 primeiros dígitos de `cnae_2`):
**TIC** 26/61/62/63 · **criativa** 58/59/60/73/74/90/91 · **inovação (P&D)** 72. Não
inclui a divisão 71 (arquitetura/engenharia), que diluiria em serviços técnicos gerais.
O `breakdown` guarda numerador/denominador e o split TIC/criativa/pesquisa.
`referenceYear = "2024"`.

```bash
python3 database/scripts/gerar_seed_trabalhadores_tic.py --project SEU_PROJETO_GCP
python3 database/scripts/gerar_seed_trabalhadores_tic.py --offline   # do snapshot
# depois, no NoSQLBooster: rode seed/indicador-trabalhadores-tic.mongodb.js (idempotente)
```

> **Sem classificação:** não há faixa oficial de bom/atenção/alerta para a participação
> em setores criativos/TIC (a FIRJAN publica a média nacional ~3,6% como referência
> descritiva, com cesta CNAE diferente da nossa — não um semáforo). Por isso o indicador
> entra **sem `threshold`** (só o número). Ver [Classificação](#classificação-semáforo).
> Para mudar a cesta de setores, edite as tuplas `DIV_TIC` / `DIV_CRIATIVA` / `DIV_PD` no gerador.

### Atualizar os indicadores ISDEL (Governança + Educação Empreendedora)

A fonte é o **ISDEL 2.0** (Índice Sebrae de Desenvolvimento Econômico Local), construído
pelo Sebrae com o CEDEPLAR/UFMG (106 variáveis de fontes oficiais → 39 indicadores → 18
subdimensões → 5 dimensões), tudo normalizado na escala **0–1**. O dado foi obtido no
**acervo público do ISDEL** do Sebrae Minas ([inteligencia.sebraemg.com.br/isdel/acervo](https://inteligencia.sebraemg.com.br/isdel/acervo));
a planilha da PB foi salva como **CSV** e versionada no repo em
`database/data/isdel_pb.csv` — o próprio CSV é o snapshot. Ele traz a série histórica da
PB **2015–2023** com as duas colunas do ISDEL que estão no catálogo da OPP. **Um único
gerador** lê o CSV e emite os **dois** seeds (config-driven, uma entrada por coluna):

- **`isdel-governanca`** — dimensão Governança para o Desenvolvimento (1 das 5 dimensões
  DEL). **Com** threshold (faixa oficial). `updatedAt = "2023"`.
- **`isdel-educacao-emp`** — **subdimensão** Educação Empreendedora (de Capital
  Empreendedor; mede penetração de programas Sebrae — Sebraetec + Empreendedor do Futuro).
  **Sem** threshold. `updatedAt = "2021"` (2022–2023 estão ~100% zerados).

```bash
# lê database/data/isdel_pb.csv e gera os DOIS seeds (idempotente, sem rede)
python3 database/scripts/gerar_seed_isdel.py

# depois, no NoSQLBooster: rode seed/indicador-isdel-governanca.mongodb.js
# e seed/indicador-isdel-educacao-emp.mongodb.js (idempotentes)
```

> **Classificação (Governança):** o threshold (`success 0,471` / `warning 0,311`) vem das
> **faixas oficiais do ISDEL** publicadas na nota metodológica do Sebrae (ISDEL 2.0,
> SEBRAE/MG + CEDEPLAR-UFMG, 2021, Figura 4: Muito Baixo <0,150 · Baixo 0,151–0,310 ·
> Médio 0,311–0,470 · Alto 0,471–0,630 · Muito Alto ≥0,631) — ver
> [Classificação](#classificação-semáforo). **Ressalva honesta:** essas faixas são
> definidas para o ISDEL **agregado**; aqui são aplicadas à **dimensão** Governança.
> É extrapolação razoável — a nota (p.36) diz que a pontuação "seja no agregado ou nas
> dimensões" usa o mesmo intervalo 0–1 e a mesma interpretação — mas a Sebrae **não
> publica faixas por dimensão**.
>
> **Classificação (Educação Empreendedora):** entra **sem threshold**. A nota (p.36) só
> estende a faixa às **dimensões**, não a **subdimensões**; e a própria nota (p.34)
> registra "elevado número de municípios com zeros" nessa subdimensão (clientela Sebrae).
> Nos dados da PB são 58% de zeros, com 2022–2023 ~100% zerados — aplicar a faixa marcaria
> todos como "Muito Baixo"/vermelho. Por isso exibe **2021** (último ano com dado real) e
> sem semáforo, como Trabalhadores C&T/TIC.
>
> **Comparabilidade:** a nota (p.17) informa que o ISDEL 2.0 recalculou a série 2015–2019
> e passou a divulgá-la anualmente, então a série 2015–2023 do CSV é toda **2.0**
> (comparável entre si); **não** comparar com o ISDEL 1.0 (p.18). Quando chegar um novo
> ano, acrescente as linhas ao CSV e rode de novo: como o ano faz parte da chave, ele
> **entra ao lado** dos existentes.

### Atualizar o Tempo de abertura / viabilidade (Redesim)

A fonte é a **API pública da Redesim** (Mapa de Empresas), em
`estatistica.redesim.gov.br/tempos-abertura-redesim` (sem autenticação). São **dois
geradores independentes** (um por indicador, padrão "uma fonte → um script → um seed" —
assim, no futuro, mexer em um indicador não toca no outro), mesma mecânica: descobrem os
12 meses mais recentes (`/periodos-disponiveis`), baixam o XLSX dos microdados por UF
(`/exportar/solicitacoes/PB?mes=&ano=`), casam o **nome** do município com o IBGE por slug
(com aliases dos renomeados Joca Claudino / São Vicente do Seridó / Tacima) e calculam o
**marco de 75%** (percentil 75 do tempo em horas úteis) — a métrica que o painel oficial
usa para colorir o ente. Diferem só na coluna somada: `tempo-abertura` = viabilidade +
validação cadastral + registro/inscrição (XLSX 11+17+24); `tempo-viabilidade` = só
viabilidade (XLSX 11). O `breakdown` guarda n, confiabilidade, marco75 (horas/dias),
média, mediana, faixa oficial e a janela. `referenceYear` = ano final da janela. Cada um
tem seu próprio snapshot (`tempo_abertura_pb.json` / `tempo_viabilidade_pb.json`).

```bash
# cada gerador baixa os 12 XLSX, agrega, valida contra o agregado oficial e gera seu seed
python3 database/scripts/gerar_seed_tempo_abertura.py
python3 database/scripts/gerar_seed_tempo_viabilidade.py

# sem rede? regenera a partir do snapshot versionado:
python3 database/scripts/gerar_seed_tempo_abertura.py --offline
python3 database/scripts/gerar_seed_tempo_viabilidade.py --offline

# depois, no NoSQLBooster: rode os dois seeds (idempotentes):
#   seed/indicador-tempo-abertura.mongodb.js  e  seed/indicador-tempo-viabilidade.mongodb.js
```

> **Threshold:** vem das **faixas oficiais da Redesim** (🟢 até 3 dias · 🟡 3–5 · 🟠 5–7 ·
> 🔴 >7, com 1 dia = 24 horas úteis), colapsadas no semáforo de 3 níveis da OPP
> (`lower-better, success 72 / warning 168`) — ver [Classificação](#classificação-semáforo).
> Validado contra os endpoints de agregado da própria Redesim (o gerador imprime o
> cross-check do último mês).
>
> **Cobertura:** 1 mês cobre só ~43% dos 223 municípios; 12 meses acumulados sobem para
> ~84% (187/223). Municípios sem nenhuma abertura na janela entram com `numericValue: null`
> / `rawValue: "—"`; municípios com n<30 entram com o valor + `confiabilidade: "baixa"`
> (decisão jun/2026: publicar todos, marcar confiabilidade). Janela atual: **jun/2025–
> mai/2026** — rodar de novo no mês seguinte desloca a janela (upsert sobre o mesmo ano).
>
> **Só estes 2 dos 4** indicadores da agenda vêm desta base. `ranking-redesim` e
> `tempo-licenciamento` são de **outra** fonte (ranking municipal da Redesim/PB, base de
> alvarás/documentos habilitados) — ver `MAPEAMENTO_BASE_DOS_DADOS.md` §9. Os cortes
> antigos em `src/data/indicators/thresholds.ts` (`tempo-abertura` 14/24, `tempo-viabilidade`
> 12/24) eram inventados; recomenda-se alinhá-los às faixas oficiais acima.

### Atualizar o Ranking municipal Redesim/PB

A fonte é o **Ranking Municipal do Ambiente de Negócios da Redesim/PB**, via a **API
pública** do portal Mapa de Empresas/PB (`redesim.pb.gov.br/api/mapa-empresas-service`,
sem autenticação). O gerador descobre a janela de **6 meses** mais recente
(`/ranking-periodo`) e consulta `/ranking-municipal`, que já devolve os **223 municípios
com código IBGE** e a pontuação. `numericValue` = `total` (0–600, soma dos 6 meses);
o `breakdown` guarda posição (1–223), percentual (0–100) e as 3 componentes
(Documentos Habilitados, Índice de Atendimento, Índice de Tempo) + região.

```bash
python3 database/scripts/gerar_seed_ranking_redesim.py            # consulta a API
python3 database/scripts/gerar_seed_ranking_redesim.py --offline  # do snapshot
# depois, no NoSQLBooster: rode seed/indicador-ranking-redesim.mongodb.js (idempotente)
```

> **Sem threshold:** o ranking publica posição e pontos, mas **não** uma faixa oficial de
> bom/atenção/alerta para o total — então entra sem semáforo (ver
> [Classificação](#classificação-semáforo)). O corte `higher-better 900/600` que estava em
> `src/data/indicators/thresholds.ts` era inventado (e em escala que nem bate com a fonte).
> A janela atual é **2025-12 a 2026-05**; rodar de novo desloca a janela (upsert no mesmo ano).
> Detalhes da API em `MAPEAMENTO_BASE_DOS_DADOS.md` §10.

### Atualizar o Tempo de licenciamento (Redesim/PB)

Mesma API do Ranking Municipal (§10 do `MAPEAMENTO`). **Limite da fonte:** as horas brutas
de alvará só existem no nível **estadual** (`ranking-panorama-estado`); por município a API
publica só a **pontuação do Índice de Tempo** do alvará. O gerador consulta
`/ranking-municipal` filtrando `indicador=1|3` (Alvará de Localização) e `2|3` (Alvará
Sanitário) na janela de 6 meses e soma as duas pontuações. `numericValue` = score 0–120
(**maior = licenciamento mais rápido**); o `breakdown` separa Localização/Sanitário e marca
`semEmissaoAlvara` quando o score é 0 (pode ser ausência de emissões, não lentidão).

```bash
python3 database/scripts/gerar_seed_tempo_licenciamento.py            # consulta a API
python3 database/scripts/gerar_seed_tempo_licenciamento.py --offline  # do snapshot
# depois, no NoSQLBooster: rode seed/indicador-tempo-licenciamento.mongodb.js (idempotente)
```

> **Sem threshold** (a fonte não publica faixa oficial p/ o score combinado de alvará; as
> faixas oficiais são por documento e em horas, que não temos por município) — ver
> [Classificação](#classificação-semáforo). O corte `lower-better 15/25` antigo em
> `src/data/indicators/thresholds.ts` era inventado e pressupunha horas. Na janela atual
> (2025-12 a 2026-05) ~109 dos 223 municípios têm score 0 (provável ausência de alvarás
> emitidos no sistema integrado). Detalhes da API em `MAPEAMENTO_BASE_DOS_DADOS.md` §10.

### Atualizar a escolaridade da força de trabalho (data lake do Sebrae)

Os dois indicadores (`trabalhadores-medio-completo`, `trabalhadores-superior-completo`) vêm
**direto do data lake do Sebrae** (RAIS, não basedosdados) — um único script agrega na origem
e emite os dois seeds. **Roda na `10.1.141.23`** (única máquina que vê o lake): topologia,
credenciais calibradas, pré-requisitos (Python 3.6, `pymongo<4`) e o cron em **`RUNBOOK_ETL.md`**.

```bash
# do snapshot versionado (sem acesso ao lake):
python3 database/scripts/gerar_seed_escolaridade.py --offline
# direto do lake + escreve no Mongo OPP (rodar na 10.1.141.23):
python3 database/scripts/gerar_seed_escolaridade.py \
  --mongo-host 10.19.4.174 --mongo-user usr_RAIS --mongo-pass usr_RAIS \
  --mongo-db RAIS --collection 2024_VINC \
  --opp-user usrdadosopp --opp-pass 'SENHA' --write-mongo
```

> **Sem threshold** (contagem bruta da RAIS, sem faixa oficial) — ver
> [Classificação](#classificação-semáforo). `ESCOLARIDADE_APOS_2005` = 7 (médio) / 9 (superior);
> `breakdown` traz total + percentual (o de superior também expõe mestrado/doutorado). Quando
> sair a RAIS 2025, troque `--collection 2025_VINC` e a constante `ANO` no script. Operação
> completa (3 máquinas, cron, troubleshooting) em **`RUNBOOK_ETL.md`**.

### Atualizar o IDEB (data lake do Sebrae)

Os dois indicadores (`ideb-anos-iniciais`, `ideb-anos-finais`) vêm **direto do data lake do
Sebrae** (base `IDEB`/`usr_IDEB`, INEP — não basedosdados) — um único script lê a série de
edições por município e emite os **dois seeds**, separados pelo campo `SERIE` do dump. **Roda na
`10.1.141.23`** (única máquina que vê o lake): credenciais, pré-requisitos (Python 3.6,
`pymongo<4`) e cron em **`RUNBOOK_ETL.md`**.

```bash
# 1) confirmar o schema (coleções, valores de REDE/SERIE, resolução das edições):
python3 database/scripts/gerar_seed_ideb_lake.py --inspect
# 2) gerar os dois seeds + snapshot (defaults: host do lake + usr_IDEB):
python3 database/scripts/gerar_seed_ideb_lake.py
# 3) regenerar do snapshot versionado (sem acesso ao lake):
python3 database/scripts/gerar_seed_ideb_lake.py --offline
# 4) direto do lake + escreve no Mongo OPP (com OPP_MONGO_USER/PASS no .env):
python3 database/scripts/gerar_seed_ideb_lake.py --write-mongo
```

> **Sem threshold** (o INEP publica metas projetadas por município/rede, não faixa universal
> bom/ruim — e o dump só traz o observado) — ver [Classificação](#classificação-semáforo).
> `numericValue` = IDEB observado **2023** (0–10); `breakdown.serieHistorica` traz a série
> 2005→2023; `variation` = 2023 vs 2021. ⚠️ a edição 2021 vem como campo `IDEB_OBSERVADO_20212`
> (dígito extra do dump) — o gerador resolve a edição pelos **4 primeiros dígitos** do sufixo.
> Recorte `UF="PB"` + `REDE="PUBLICA"`; se o dump usar outro rótulo de rede ou expuser a base
> como `usr_IDEB`, ajuste via `--rede` / `IDEB_MONGO_DB` (ou o bloco `IDEB_*` do `.env`). Se a
> base for atualizada com a edição 2025, troque `REF_YEAR`/`PREV_YEAR` no topo do script.

### Atualizar a Remuneração média (data lake do Sebrae)

O card `remuneracao-media` vem **direto do data lake do Sebrae** (base `RAIS`/`usr_RAIS`, a
**mesma** dos indicadores de escolaridade — não basedosdados). Métrica = **média de
`VL_REMUN_MEDIA_NOM`** (remuneração média mensal nominal, R$) sobre os vínculos ativos em 31/12
com remuneração > 0, agregada na origem (`mean = soma / nº de vínculos`). **Roda na
`10.1.141.23`** (única máquina que vê o lake): Python 3.6, `pymongo<4`, cron em **`RUNBOOK_ETL.md`**.

```bash
# 1) confirmar o schema (campo de remuneração, formato do número, média da PB):
python3 database/scripts/gerar_seed_remuneracao_media_lake.py --inspect
# 2) gerar o seed + snapshot (ref 2024 + ano anterior 2023 p/ a variação yoy):
python3 database/scripts/gerar_seed_remuneracao_media_lake.py --collection 2024_VINC --collection-prev 2023_VINC
# 3) regenerar do snapshot versionado (sem acesso ao lake):
python3 database/scripts/gerar_seed_remuneracao_media_lake.py --offline
# 4) direto do lake + escreve no Mongo OPP (com OPP_MONGO_USER/PASS no .env):
python3 database/scripts/gerar_seed_remuneracao_media_lake.py --collection 2024_VINC --collection-prev 2023_VINC --write-mongo
```

> **Sem threshold** (valor absoluto R$/mês, sem faixa oficial de semáforo) — ver
> [Classificação](#classificação-semáforo). `numericValue` = remuneração média mensal **2024**
> (R$); `breakdown` traz nº de vínculos (total e com remuneração) + massa salarial mensal;
> `variation` = **2024 vs 2023** (`basis: yoy`) quando se passa `--collection-prev 2023_VINC`.
> Município sem vínculo formal remunerado entra `null` (cobertura, não zero). ⚠️ Se o `--inspect`
> mostrar a remuneração como **string com vírgula** (`"1.234,56"`), ligue `--decimal-comma`
> (ou `RAIS_REMUN_DECIMAL_COMMA=1`). Nomes de campo divergentes → `RAIS_CAMPO_REMUN`/
> `RAIS_CAMPO_MUNICIPIO`/`RAIS_CAMPO_VINCULO_ATIVO` no `.env`. Ao sair a RAIS 2025, troque
> `--collection 2025_VINC --collection-prev 2024_VINC` e as constantes `ANO`/`ANO_PREV` no script.

### Adicionar um novo indicador

> **Política de classificação (obrigatória a cada seed):** ao criar o seed, **coletar
> também o threshold oficial da fonte**. A régua de classificação (semáforo) **só pode
> vir da classificação publicada pela própria fonte** — nunca de cortes inventados por
> nós. Inclusive */src/data/indicators/thresholds.ts*. Se a fonte **não** publica faixa oficial, o indicador entra **sem `threshold`**
> (sem semáforo, só o valor). Registrar a decisão (cortes oficiais + URL, ou "sem faixa
> oficial") na tabela da seção [Classificação](#classificação-semáforo) e no comentário
> do gerador. Ver os 5 indicadores já feitos como exemplo.

1. **Threshold (faixa oficial):** pesquisar a classificação oficial da fonte (ex: PNUD
   para IDH-M, Áquila para IGMA, CFA para IGM-CFA). Achou → mapear para `{ kind, success,
   warning }`. Não achou → **omitir `threshold`** (não inventar). Anotar na tabela da
   seção [Classificação](#classificação-semáforo).
2. Inserir o doc em `indicators` (`label`, `placements` com a(s) seção(ões) e `order`,
   `threshold` **se a fonte tiver faixa oficial**, `updatedAt`, `description`, `source`).
3. Inserir/atualizar `indicatorValues` por município (chave única `municipalityId +
   indicatorId + referenceYear`), com `rawValue`, `numericValue`, `referenceYear`,
   `source`, `isFictional` (e, se preciso, `variation`/`tone` para cards socialeconomic sem threshold).
4. Recomendado: criar um gerador análogo a `gerar_seed_idh_m.py` (uma fonte → um
   script `seed/indicador-<id>.mongodb.js`), para o povoamento ser reproduzível. O
   threshold (ou sua ausência justificada) fica como constante comentada no gerador.

---

## Estrutura de arquivos

```
database/
  README.md                       # este arquivo
  RUNBOOK_ETL.md                  # operação do ETL lake do Sebrae -> OPP (3 máquinas, cron)
  MAPEAMENTO_BASE_DOS_DADOS.md    # indicadores × fontes (BD / MB / AQ / data lake Sebrae)
  setup.mongodb.js                # coleções + validadores + índices (idempotente)
  seed/
    municipios.mongodb.js         # 223 municípios da PB (GERADO)
    agendas.mongodb.js            # 6 agendas (GERADO)
    indicador-idh-m.mongodb.js    # catálogo + valores IDH-M, 223 municípios (GERADO)
    indicador-igm-cfa.mongodb.js  # catálogo + valores IGM-CFA, 223 × 2017–2026 (GERADO)
    indicador-igma.mongodb.js     # catálogo + valores IGMA, 223 × 2026 (GERADO)
    indicador-trabalhadores-ct.mongodb.js  # catálogo + valores C&T, 223 × 2024 (GERADO)
    indicador-trabalhadores-tic.mongodb.js # catálogo + valores criativa/inovação/TIC, 223 × 2024 (GERADO)
    indicador-isdel-governanca.mongodb.js  # catálogo + valores ISDEL Governança, 223 × 2015–2023 (GERADO)
    indicador-isdel-educacao-emp.mongodb.js # catálogo + valores ISDEL Educação Empreendedora, 223 × 2015–2023 (GERADO)
    indicador-tempo-abertura.mongodb.js    # catálogo tempo-abertura + 223 valores (GERADO)
    indicador-tempo-viabilidade.mongodb.js # catálogo tempo-viabilidade + 223 valores (GERADO)
    indicador-ranking-redesim.mongodb.js   # catálogo ranking-redesim + 223 valores (GERADO)
    indicador-tempo-licenciamento.mongodb.js # catálogo tempo-licenciamento + 223 valores (GERADO)
    indicador-mpe-eli-sebrae.mongodb.js    # catálogo mpe-eli-sebrae + 223 valores (GERADO)
    indicador-trabalhadores-medio-completo.mongodb.js    # catálogo + valores Médio Completo, 223 × 2024 (GERADO)
    indicador-trabalhadores-superior-completo.mongodb.js # catálogo + valores Superior Completo, 223 × 2024 (GERADO)
  scripts/
    gerar_seed_idh_m.py           # gerador: BigQuery + GeoJSON -> scripts de seed
    gerar_seed_igm_cfa.py         # gerador: raspa Power BI do CFA + GeoJSON -> seed
    gerar_seed_igma.py            # gerador: API pública IGMA Áquila -> seed
    gerar_seed_trabalhadores_ct.py  # gerador: RAIS CBO (BigQuery) -> seed
    gerar_seed_trabalhadores_tic.py # gerador: RAIS CNAE (BigQuery) -> seed
    gerar_seed_isdel.py           # gerador: CSV interno do Sebrae (ISDEL) -> 2 seeds (governanca + educacao-emp)
    gerar_seed_tempo_abertura.py     # gerador: API pública da Redesim (microdados) -> seed tempo-abertura
    gerar_seed_tempo_viabilidade.py  # gerador: API pública da Redesim (microdados) -> seed tempo-viabilidade
    gerar_seed_ranking_redesim.py    # gerador: API pública do Ranking Municipal Redesim/PB -> seed ranking-redesim
    gerar_seed_tempo_licenciamento.py # gerador: Índice de Tempo de alvará (Ranking Redesim/PB) -> seed tempo-licenciamento
    gerar_seed_crescimento_mpe.py    # gerador: API Tesseract do Observatório Sebrae -> seed mpe-eli-sebrae
    gerar_seed_escolaridade.py       # gerador: data lake Sebrae (RAIS direto, Mongo) -> 2 seeds (médio + superior completo)
  data/
    idhm_pb_2010.json             # snapshot versionado da consulta ao basedosdados
    igm_cfa_pb.json               # snapshot versionado da raspagem do CFA (com IBGE)
    igma_pb.json                  # snapshot versionado da API IGMA Áquila (com IBGE)
    trabalhadores_ct_pb_2024.json # snapshot versionado da consulta RAIS CBO (com breakdown)
    trabalhadores_tic_pb_2024.json # snapshot versionado da consulta RAIS CNAE (com breakdown)
    isdel_pb.csv                  # fonte/snapshot do ISDEL (CSV interno Sebrae, 2015–2023; Governança + Educação Empreendedora)
    tempo_abertura_pb.json        # snapshot versionado dos agregados Redesim — tempo-abertura (janela 12m + cross-check)
    tempo_viabilidade_pb.json     # snapshot versionado dos agregados Redesim — tempo-viabilidade (janela 12m + cross-check)
    ranking_redesim_pb.json       # snapshot versionado da resposta do Ranking Municipal Redesim/PB (223 munis, janela 6m)
    tempo_licenciamento_pb.json   # snapshot versionado do Índice de Tempo de alvará (Localização+Sanitário, janela 6m)
    crescimento_mpe_pb.json       # snapshot versionado da API Tesseract do Observatório Sebrae (var.% MPE)
    escolaridade_pb_2024.json     # snapshot versionado da agregação RAIS no data lake do Sebrae (1 linha/município)
```

## Notas

- **Ano do IDH-M:** o último IDH-M municipal com cobertura completa é o do **Censo
  2010** (Atlas/basedosdados). O Atlas tem versão 2022, mas ela ainda não está no
  basedosdados — por isso o piloto usa 2010 (que, aliás, bate exatamente com os 8
  valores que o protótipo já exibia).
- **`isFictional`:** todos os valores de IDH-M são reais (`false`). As "variações"
  fictícias que o protótipo mostrava nos cards não foram trazidas (`variation: ""`).
- **Sub-índices:** `breakdown` guarda educação/longevidade/renda do IDH-M para uso futuro.
- **Definição de C&T:** "ocupações de C&T" = núcleo científico-tecnológico (CBO 2002
  subgrupos 20/21/31), escolhido sobre o conceito HRST amplo da OCDE (todos os GG 2+3):
  capta pesquisadores + ciências exatas/engenharia/TIC + seus técnicos (João Pessoa 19.760;
  Campina Grande 3.865). Os valores **substituem** os números fictícios (sufixo `*`) que o
  protótipo exibia em `src/data` — agora são reais (RAIS 2024). **Sem semáforo** (sem faixa
  oficial; ver [Classificação](#classificação-semáforo)).
- **Setores de criativa/inovação/TIC:** definição "TIC + economia criativa + P&D"
  (CNAE divisões 26/61/62/63 + 58/59/60/73/74/90/91 + 72), sobre o conceito de setor
  TIC estrito ou o conceito amplo com engenharia. É um **percentual** (vínculos no setor
  ÷ total). Com dados reais a PB fica bem abaixo dos fictícios do protótipo (JP 2,17% vs
  5,1% fictício). **Sem semáforo** (sem faixa oficial; ver [Classificação](#classificação-semáforo)).
- **ISDEL Governança:** dimensão "Governança para o Desenvolvimento" do ISDEL 2.0
  (Sebrae/CEDEPLAR-UFMG), escala 0–1. Veio de **CSV interno do Sebrae** (não há microdados
  abertos), com série **2015–2023** — exibe 2023 por padrão. Os valores reais **substituem**
  os fictícios que o protótipo mostrava em `src/data` (que não batiam com nenhum ano real).
  **Com semáforo** (faixa oficial Sebrae; ver [Classificação](#classificação-semáforo)).
- **ISDEL Educação Empreendedora:** 2ª coluna do mesmo CSV. É **subdimensão** de Capital
  Empreendedor (não dimensão), medindo penetração de programas Sebrae (Sebraetec +
  Empreendedor do Futuro, PF/PJ) — id `isdel-educacao-emp` (mantém o `-emp` para distinguir
  da educação geral da agenda: ensino médio/superior). **Zero-inflada**: 58% dos valores
  são 0 e **2022–2023 estão ~100% zerados** (clientela Sebrae não carregada na recalc),
  por isso exibe **2021** por padrão. **Sem semáforo** — a faixa oficial é só do índice
  agregado e não se estende a subdimensão (ver [Classificação](#classificação-semáforo)).
  Mesmo gerador da Governança (`gerar_seed_isdel.py` emite os dois seeds).
