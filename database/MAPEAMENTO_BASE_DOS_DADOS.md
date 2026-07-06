# Mapeamento de Fontes de Dados — Plataforma OPP

Mapeamento dos 35 indicadores da OPP (catálogo em [indicators/catalog.ts](indicators/catalog.ts))
e das demais fontes disponíveis. A coluna **Fonte** da §1 usa as etiquetas abaixo.

**Camadas de dados consolidados**

- **SL** — Sebrae Data Lake (Ambiente Colaborativo de Dados SEBRAE-PR, Mongo `10.19.4.174`).
  Caminho de ETL preferencial: autocontido, sem BigQuery. Bases usadas: `RAIS`, `ESTBAN`,
  `REDESIM`, `IDEB`, Receita Federal (`RF_*`), PNCP. Ver §13.
- **BD** — `basedosdados` (BigQuery, dados massivos consolidados). Requer ADC + billing project.
- **MB** — `mcp-brasil` (42 APIs governamentais ao vivo).

**APIs públicas por indicador** (abertas, sem autenticação salvo nota)

- **AQ** — API IGMA Áquila (`data-igma-api.aquila.com.br`). Ver §7.
- **CFA** — Dashboard Power BI público do CFA (IGM-CFA), raspado via `querydata`. Frágil (token gira). Ver §6.
- **Redesim/PB** — API do Ranking Municipal da Redesim/PB (`redesim.pb.gov.br`). Ver §10.
- **Observatório Sebrae** — API Tesseract OLAP do Observatório Setorial Territorial (`apiv2-observatorio.sebrae.com.br`). Ver §11.
- **ICS** — API do Instituto Cidades Sustentáveis (IDSC-BR, `cidadessustentaveis.org.br`). Ver §15.

**Acervos e portais abertos (snapshot CSV)**

- **Sebrae** — Acervo ISDEL do Sebrae Minas (`inteligencia.sebraemg.com.br/isdel`), snapshot CSV.
- **BNDES** — Portal de Dados Abertos do BNDES (`dadosabertos.bndes.gov.br`), conjunto "Operações de Financiamento" → recurso "Operações não automáticas", snapshot CSV.

**Status:** ✅ fonte definida e implementada · 🟡 proxy / cobertura parcial · ❌ sem fonte aberta (dado interno Sebrae).

---

## 1. Indicadores OPP × Fonte

### Agenda: Governança multissetorial

| Indicador | Fonte | Como obter |
|---|---|---|
| IGM – Índice CFA de Governança Municipal | ✅ CFA (implementado) | **Raspado** do dashboard Power BI público via `querydata` — ver §6. Seed `igm-cfa` no banco: 223 municípios PB, 2017–2026. Frágil (token gira). Proxies `iegm`/`ifgf` não foram localizados na BD na varredura atual |
| IDH-M | ✅ BD (implementado) | `adh` (Atlas do Desenvolvimento Humano — IDHM oficial PNUD/IPEA/FJP) |
| Governança para o Desenvolvimento – ISDEL | ✅ Sebrae (implementado) | **Acervo ISDEL do Sebrae Minas** ([inteligencia.sebraemg.com.br/isdel/acervo](https://inteligencia.sebraemg.com.br/isdel/acervo)) — ISDEL 2.0, dimensão Governança, escala 0–1. Seed `isdel-governanca` no banco: 223 municípios PB, série 2015–2023 (2.007 valores), faixas oficiais Sebrae. Snapshot em `data/isdel_pb.csv` |
| Índice de Gestão Municipal Áquila (IGMA) | ✅ AQ (implementado) | API aberta `data-igma-api.aquila.com.br` — ver §7. Seed `igma` no banco: 223 municípios PB, versão 2026, com 6 pilares + posição/classificação no `breakdown` |

### Agenda: Simplificação e digitalização

| Indicador | Fonte | Como obter |
|---|---|---|
| Tempo médio de viabilidade da empresa | ✅ SL (implementado) | **Data lake do Sebrae**, base `REDESIM` (coleção `BRASIL_<ano>` — os mesmos microdados que a API expõe em XLSX). Seed `tempo-viabilidade`: 223 municípios PB, ano-calendário (2025: 196/223 com dado), marco de 75% (horas úteis), faixas oficiais. Caminho autocontido (`gerar_seed_tempo_abertura_lake.py`). Fonte legada = API pública `estatistica.redesim.gov.br/tempos-abertura-redesim`. Ver §9 e §13 |
| Tempo médio de abertura da empresa | ✅ SL (implementado) | Idem, mesma base/script — `tempo-abertura` = viabilidade + validação cadastral (DBE) + deferimento. Seed: 223 municípios PB, marco de 75%. P75 reimplementado (host Python 3.6) idêntico à metodologia oficial. Ver §9 e §13 |
| Ranking municipal Redesim/PB | ✅ Redesim/PB (implementado) | **API pública** do Ranking Municipal da Redesim/PB (`redesim.pb.gov.br/api/mapa-empresas-service/ranking-municipal`) — 223 municípios já com IBGE, pontuação (DH+IA+Índice de Tempo) e posição. Seed `ranking-redesim`: janela de 6 meses, `numericValue` = total 0–600. Ver §10 |
| Tempo de licenciamento | ✅ Redesim/PB (implementado) | Mesma API (§10). Horas brutas de alvará só existem no **nível estadual**; por município usa-se a **pontuação do Índice de Tempo** do alvará (Localização `1\|3` + Sanitário `2\|3`, derivada das faixas oficiais de horas). Seed `tempo-licenciamento`: 223 municípios, `numericValue` = score 0–120 (maior = + rápido), sem threshold |

### Agenda: Ecossistemas de Inovação

| Indicador | Fonte | Como obter |
|---|---|---|
| Trabalhadores nas ocupações de C&T | ✅ BD (implementado) | `rais` (`br_me_rais.microdados_vinculos`) — vínculos ativos em 31/12, CBO 2002 subgrupos **20/21/31** (núcleo C&T: pesquisadores + ciências exatas/engenharia/TIC + técnicos). Seed `trabalhadores-ct` no banco: 223 municípios PB, RAIS 2024, `breakdown` com os 3 subgrupos. Definição estreita (não o HRST amplo da OCDE) p/ casar com o threshold |
| Trabalhadores nos setores de economia criativa, inovação e TIC | ✅ BD (implementado) | `rais` (`br_me_rais.microdados_vinculos`) — **% dos vínculos** em setores intensivos em conhecimento: CNAE 2.0 divisões **TIC** 26/61/62/63 + **criativa** 58/59/60/73/74/90/91 + **P&D** 72. Seed `trabalhadores-tic`: 223 municípios PB, RAIS 2024, `breakdown` com numerador/denominador + split TIC/criativa/pesquisa. Não inclui div 71 (engenharia/arquitetura) |
| Crescimento de MPE formalizadas nos ELI | 🟡 Observatório Sebrae (implementado) | **API Tesseract pública** do Observatório Setorial Territorial do Sebrae (cubo `RF` — RFB/Estabelecimentos). Seed `crescimento-mpe` (renomeado de `mpe-eli-sebrae` em jul/2026, pois o recorte "nos ELI" é só proxy): 223 municípios PB, **var. % a.a.** das MPE (MEI+ME+EPP) formalizadas por ano de abertura (2025 vs 2024), todas as situações cadastrais (sem viés de sobrevivência). **Proxy municipal** — o recorte "nos ELI" não existe em fonte aberta (dado interno do Sebrae). Sem threshold. Ver §11 |
| Compras públicas de inovação nos pequenos negócios | 🟡 SL (proxy, implementado) | **Valor (R$/ano)** de contratos municipais a pequenos negócios em compras de inovação (NÍVEL, não crescimento — a var. a.a. mede adesão ao PNCP). 🟡 (não ✅) porque **não há definição oficial de "compra de inovação"**: as fontes são primárias (PNCP + RF), mas a operacionalização é um **proxy nosso** — (A) CNAE ∈ {TIC/criativa/P&D} via `RF_ESTABELECIMENTOS` ∪ (B) `OBJETO_CONTRATO` classificado por semente calibrada — que **não** capta CPSI/encomenda tecnológica. Mesmo status de `crescimento-mpe` (proxy). Coletado jun/2026 (2025): **R$144,5M PB**, 98 municípios. Sem threshold. Ver §12 |

### Agenda: Educação empreendedora

| Indicador | Fonte | Como obter |
|---|---|---|
| Educação Empreendedora – ISDEL | ✅ Sebrae (implementado) | Mesmo CSV do ISDEL (§ Governança acima) — coluna Educação Empreendedora. Seed `isdel-educacao-emp`: 223 municípios PB, série 2015–2023 (2.007 valores). É **subdimensão** de Capital Empreendedor (clientela Sebraetec + Empreendedor do Futuro), fortemente zero-inflada (2022–2023 ~100% zerada) → exibe **2021** e entra **sem semáforo** (faixa oficial é só do índice agregado) |
| Trabalhadores formais com Ensino Médio Completo | ✅ SL (implementado) | **Acesso direto ao data lake do Sebrae** (Mongo `10.19.4.174`, base `RAIS.2024_VINC`) — vínculos ativos em 31/12 com `ESCOLARIDADE_APOS_2005 = 7`. Seed `trabalhadores-medio-completo`: 223 municípios PB, RAIS 2024, `breakdown` com total + percentual. **Sem semáforo** (contagem bruta). 1º indicador do fluxo lake→OPP — ver §13 e `RUNBOOK_ETL.md` |
| Trabalhadores formais com Ensino Superior Completo | ✅ SL (implementado) | Idem, `ESCOLARIDADE_APOS_2005 = 9`. Seed `trabalhadores-superior-completo`: 223 municípios PB, RAIS 2024, `breakdown` com total + percentual + mestrado/doutorado. **Sem semáforo**. Mesma consulta do médio (um script → dois seeds, como o ISDEL) |

### Agenda: Acesso a crédito

| Indicador | Fonte | Como obter |
|---|---|---|
| Crédito concedido no município | ✅ SL (implementado) | **ETL do data lake do Sebrae** (base `ESTBAN`, Estatística Bancária Mensal e por Município do BCB — uma coleção por mês `AAAAMM`). Métrica de **nível**: saldo de fim de mês das **Operações de Crédito** (empréstimos+títulos descontados, financiamentos, financiamentos rurais/agroindustriais, outras), somado sobre as instituições do município, no **último mês disponível** (saldo é estoque — não se somam meses; `--dezembro` p/ fim de ano). Gerador `gerar_seed_credito_financiamento_lake.py` (com `--inspect`/`--inspect-verbetes`/`--offline`/`--write-mongo`). **Sem semáforo** (saldo absoluto, BCB não classifica). É um SALDO (estoque), não fluxo de concessão — o ESTBAN não publica concessão por município. Schema confirmado: `UF="PB"`, município por `CODMUN_IBGE`, verbete `160` = rollup oficial (líquido de provisão). **Rodado (jun/2026, mês 202011): R$ 20,72 bi de saldo de crédito na PB; só 47/223 municípios têm agência (demais → null, cobertura — não ausência de crédito).** Seed `credito-financiamento` + snapshot versionados. SCR não é público nominal |
| Crédito contratado no BNDES (operações não automáticas) | ✅ BNDES (implementado) | **Portal de Dados Abertos do BNDES** (conjunto "Operações de Financiamento" → recurso "Operações não automáticas", CSV público ~19 Mb; **não está no lake nem na Base dos Dados** — a `bndes_consultar_operacoes_bndes` do mcp-brasil lista/filtra mas **não expõe o valor R$**). Métrica de **FLUXO**: **valor contratado acumulado** (R$, nominal, todos os anos 2002→último) por município do tomador. "Não automáticas" = apoio **direto** + **indireto não automático** (o arquivo já exclui as indiretas automáticas/Finame/Cartão e PF) — casa exatamente com o indicador original ("direto e indireto não automático"). Gerador `gerar_seed_bndes_operacoes.py` (com `--inspect`/`--csv`/`--desde`/`--ate`/`--offline`/`--write-mongo`). Seed `bndes-operacoes` + snapshot `data/bndes_operacoes_pb.json`. **Sem semáforo** (valor absoluto). ⚠️ **Cobertura municipal fraca:** das 97 operações da PB, só **34 (10 municípios, R$ 984 mi)** têm município identificado; **63 (R$ 4,67 bi, ~83%)** vêm como "sem município" (`municipio_codigo` = 0/9999999, tipicamente apoio direto ao governo estadual/concessionárias) e ficam **só no rollup UF**, fora do total municipal. O indicador original era **na UF** — no grão municipal ele é esparso. Município sem contrato → **R$ 0** (censo, não lacuna). |
| Crédito avalizado pelo FAMPE | ❌ (dado interno Sebrae) | **Fundo de Aval às MPE (FAMPE)** — aval do Sebrae que complementa a garantia de operações de crédito de MPE junto a bancos parceiros (até 80% da operação). Métrica pretendida: **valor avalizado/garantido (R$) por município**. ⚠️ **Sem fonte aberta municipalizada** — varredura (jul/2026) negativa em **lake**, **Base dos Dados** (0 datasets), **mcp-brasil** (nenhuma tool; "garantia-safra" é seguro agrícola, outra coisa) e no **Observatório Sebrae** (59 cubos; o único de crédito é `credito_bacen_valores` = BCB, não FAMPE). Publicamente só há **agregados nacionais/UF** em relatórios/imprensa (631 mil operações e R$ 34 bi de crédito habilitado / R$ 25 bi avalizados até 2024). Municipalizar exige **extração interna do sistema operacional do FAMPE (Sebrae)** por município/PB — dado não público. **Requer solicitação ao Sebrae.** |

### Agenda: Inclusão produtiva

| Indicador | Fonte | Como obter |
|---|---|---|
| Pequenos negócios abertos | ✅ SL (implementado) | **ETL do data lake** (RF Estabelecimentos): nº de estabelecimentos de pequeno porte (ME/EPP, MEI incluso) abertos no ano-ref, por `DATA_DE_INICIO_ATIVIDADE`. Porte resolvido na `RF_EMPRESAS` (`$in` por CNPJ). Gerador `gerar_seed_negocios_rfb_lake.py` (1 script → 3 seeds). **Coletado (PB 2025): 36.904** pequenos negócios abertos, 223/223 munis. Ver §14 |
| Empresas ativas | ✅ SL (implementado) | Idem — estoque de estabelecimentos com `SITUACAO_CADASTRAL='02'` (ativa), **todos os portes**. Mesmo gerador/rodada. **Coletado (PB 2025): 192.461** estabelecimentos ativos. Ver §14 |
| Pequenos negócios extintos | ✅ SL (implementado) | Idem — estabelecimentos de pequeno porte baixados (`SITUACAO_CADASTRAL='08'`) no ano-ref, por `DATA_SITUACAO_CADASTRAL`. Mesmo gerador/rodada. **Coletado (PB 2025): 20.184** baixados. Ver §14 |
| Crescimento de beneficiários Bolsa Família (18–50) | 🟡 Observatório Sebrae (implementado) | **API Tesseract pública** do Observatório (cubo `MDS_PBF` — Programa Bolsa Família/MDS). Seed `bolsa-familia`: 223 municípios PB, **var. % a.a. da média mensal de famílias beneficiárias** (ano-ref vs anterior). 🟡 **proxy municipal** (mesmo status do `crescimento-mpe`): o **recorte etário 18–50 não existe em fonte municipal aberta atual** — a tabela `bolsa_familia` da BD conta **famílias** (sem idade) e está **congelada em 2004–2020**; o recorte por idade só está no **CadÚnico amostral (2012–2018)**, defasado e ruim p/ municípios pequenos. Mede-se **famílias** (Novo BF), não pessoas por faixa. **Sem threshold.** Rodado jun/2026: **PB −2,7% (2024→2025)**, pente-fino do Novo BF. Ver §11 |
| Pequenos negócios apoiados pelo Sebrae | ❌ | Sebrae interno |
| Participação MPE em compras públicas | 🟡 SL (implementado) | **Cross-source PNCP × RF, ambos do data lake — COLETADO (PB 2025).** Contratos do PNCP (CNPJ + valor + IBGE do órgão) ⨝ porte do CNPJ na Receita Federal (`RF_EMPRESAS_<ano>`, pequenos = `PORTE_EMPRESA` '01'/'03'). O PNCP **não traz porte do fornecedor** → vem da RF. Como a **API pública do PNCP está instável** (500/422/timeout em jun/2026), o caminho é o **ETL do data lake** do Sebrae (que ingere PNCP **e** RF — mesmo fluxo da RAIS, **uma rodada, sem BigQuery**), via `gerar_seed_mpe_compras_publicas_lake.py`. **Rodado em jun/2026 (CONTRATOS_2025): 150/223 municípios com participação calculável; 74,5% do valor de compras municipais da PB a pequenos negócios** (R$ 3,77bi de R$ 5,06bi). Os 73 sem contrato municipal PJ entram `null`. O 🟡 é **permanente** (proxy derivado, esfera municipal), não um estágio rumo a ✅. Ver §12 |
| Linhas de Crédito Disponíveis | ❌ (levantado jul/2026 — sem seed) | **Levantamento feito; indicador segue pendente** porque nenhuma fonte entrega *linhas* + *grão municipal*, nem *R$ a MPE* + *grão municipal*, ao mesmo tempo. "Quantidade de linhas de crédito disponíveis" é um **catálogo de produtos**, que **nem ESTBAN nem BCB publicam** — a autoridade monetária mede *dinheiro contratado*, não *produtos ofertados* (daí o ❌ "Bancos/Bacen" original). **Quem cataloga linhas:** a **Plataforma/Coletânea Sebrae de Linhas de Crédito** (`sebrae.com.br/linhasdecredito`) — **+250 linhas de 35 instituições** públicas e privadas, avalizadas pelo **FAMPE**. Limitações: é **nacional** (filtra por modalidade/taxa/prazo/valor, **não por UF**), e o "+250" é número **institucional** (SPA sem endpoint aberto → não é count auditável máquina-a-máquina). Camadas nomeadas acessíveis a uma MPE da PB: **Federais** — Pronampe, ProCred 360 (prog. Acredita), FGI PEAC (garantia BNDES), Cartão BNDES, BNDES Crédito Pequenas Empresas/Finame; **Nordeste (BNB)** — FNE (Nordeste Empresarial, Industrial, Inovação, Verde, MPE), Crediamigo (microcrédito urbano), Agroamigo (rural); **Estadual** — **Empreender PB** (12 linhas, ~5 PJ: Pessoa Jurídica, Cooperativas, Inovação Tecnológica, Energia Solar, Rural — R$ 5–100 mil, 0,64% a.m., carência 6 m, até 30 parcelas); **Municipal** (esparso) — ex. *Eu Posso* (microcrédito social de João Pessoa). **Alternativa em R$ (volume, não contagem):** o **saldo de crédito às MPE** É auditável no BCB, mas com o mesmo trade-off porte×grão — **SCR por UF × porte** (micro/pequena, presente no lake, porém **só PB, sem grão municipal** — ver [[project_bcb_lake]]) ou **SGS "Saldo das operações por porte MPMe"** (nacional). O **ESTBAN** dá saldo **municipal** mas **sem porte** (não isola MPE) — é o que já alimenta `credito-financiamento`; dele só se extrai, de forma municipal e auditável, o **nº de instituições com agência no município** (proxy de oferta, não de linhas). **Decisão jul/2026: manter ❌/pendente, sem seed.** |

### Base econômica (cards do Panorama)

| Indicador | Fonte | Como obter |
|---|---|---|
| IDSC – Desenvolvimento Sustentável das Cidades | ✅ ICS (implementado) | **API pública** do Instituto Cidades Sustentáveis (`cidadessustentaveis.org.br/api/idsc-br`) — a mesma que alimenta o mapa oficial. Seed `idsc`: 223 municípios PB, IDSC-BR **2025**, pontuação geral 0–100 + classificação nacional + população no `breakdown`. **Sem semáforo** (índice composto não tem faixa oficial). O Atlas IDSC não está na BD; não precisa mais de proxy. Ver §15 |
| IDH-M | ✅ BD (implementado)| `adh` (Atlas do Desenvolvimento Humano — IDHM oficial PNUD/IPEA/FJP). **Por município só até 2010** (séries 1991/2000/2010); o IDH-M 2021 (nova metodologia) **não está na BD** — fonte seria o Atlas Brasil direto |
| Cobertura Atenção Básica na Saúde | ✅ BD (implementado) | `br_ms_atencao_basica.municipio` (MS — e-Gestor AB/SISAB), coluna `proporcao_cobertura_total_atencao_basica` (Cobertura da AB oficial, % limitada a 100%). Seed `cobertura-atencao-basica`: 223 municípios PB, **média das 12 competências mensais de 2020** (último ano na BD; média anual robusta a quedas pontuais de cobertura — mesmo critério do `bolsa-familia`). `breakdown` traz cobertura ESF + população + meses. **Sem semáforo** (o MS não publica faixa oficial). PB 2020: média 98,8% (213/223 ~100%). Alternativa ao vivo = `/saude` (MB) |
| IDEB 2023 – Anos Iniciais | ✅ SL (implementado) | **ETL do data lake do Sebrae** (base `IDEB`/`usr_IDEB`, INEP/MEC). Uma linha por município × etapa × rede, com a série de edições em colunas `IDEB_OBSERVADO_<ano>` (2005→2023). Seed `ideb-anos-iniciais`: 223 municípios PB, **IDEB observado 2023** da rede `PUBLICA`, série `ANOS_INICIAIS_FUNDAMENTAL`. `breakdown` traz a série histórica completa + rede + etapa; `variation` = 2023 vs edição anterior 2021. Gerador `gerar_seed_ideb_lake.py` (`--inspect`/`--offline`/`--write-mongo`), comum às duas etapas. A base tem 4 coleções (`BRASIL`/`ESTADO`/`MUNICIPIO`/`ESCOLA`) — usa a `MUNICIPIO`. **Sem semáforo** (o INEP publica metas projetadas, não faixa universal bom/ruim — e o dump só traz o observado). ⚠️ o sufixo da edição 2021 é inconsistente entre coleções (`IDEB_OBSERVADO_20211`/`…20212`) — o gerador resolve a edição pelos 4 primeiros dígitos e pega o 1º valor não-nulo. Alternativa ao vivo = `/inep` (MB) |
| IDEB 2023 – Anos Finais | ✅ SL (implementado) | **ETL do data lake do Sebrae** (mesma base/gerador da linha acima). Seed `ideb-anos-finais`: 223 municípios PB, IDEB observado 2023, série `ANOS_FINAIS_FUNDAMENTAL`, rede `PUBLICA`, com série histórica + variação 2023 vs 2021. **Sem semáforo.** Alternativa ao vivo = `/inep` (MB) |
| GINI (2010) | ✅ BD (implementado) | `adh` (`basedosdados.mundo_onu_adh.municipio`, coluna `indice_gini` — **mesma tabela/edição do IDH-M**, Censo 2010). Seed `gini`: 223 municípios PB, Gini 0–1. **Sem semáforo** (não há faixa oficial) e **sem `variation`** — a série do Atlas é decenal (1991/2000/2010), então a única variação seria 2010 vs 2000 (década, não ano); igual ao idh-m, não exibimos. 2010 é o **teto de qualquer fonte municipal** (o Censo 2022 não teve quesito de renda). Gerador `gerar_seed_gini.py` (`--project`/`--offline`), snapshot em `data/gini_pb_2010.json` |
| Remuneração média (2024) | ✅ SL (implementado) | **ETL do data lake do Sebrae** (base `RAIS`/`usr_RAIS`, mesma dos indicadores de escolaridade — não basedosdados). Métrica = **média de `VL_REMUN_MEDIA_NOM`** (remuneração média mensal nominal, R$) sobre os vínculos ativos em 31/12 com remuneração > 0; `mean = soma / nº de vínculos`, agregada na origem. Seed `remuneracao-media`: 223 municípios PB, RAIS **2024**, `breakdown` com nº de vínculos + massa salarial mensal; `variation` = **2024 vs 2023** (`basis: yoy`, via `--collection-prev 2023_VINC`). Gerador `gerar_seed_remuneracao_media_lake.py` (`--inspect`/`--offline`/`--write-mongo`/`--decimal-comma`). **Sem semáforo** (valor absoluto R$/mês, sem faixa oficial). Município sem vínculo formal remunerado entra `null` (cobertura, não zero). Alternativa BD (defasada) = `rais`/`caged` |
| Empresas Ativas (2025) | ✅ SL (implementado) | Indicador próprio da base econômica **`empresas-ativas-total`** (section `socialeconomic`), gerado na mesma rodada do RF lake (§14) — estoque de estabelecimentos `SITUACAO_CADASTRAL='02'` (todos os portes). Mesmos valores do `empresas-ativas` da agenda, mas com id/placement próprio do card (não depende de alias no frontend). Não re-consulta `cnpj`/`estatisticas_sobre_simples_nacional` da BD. **PB 2025: 192.461** ativos (JP 70.864 · Campina 26.911). Sem semáforo (base econômica) |
| PIB per capita (2023) | ✅ BD (implementado) | `pib` (`basedosdados.br_ibge_pib.municipio`, coluna `pib` em **reais**) ⨝ `br_ibge_populacao.municipio` (`populacao`) — a tabela de PIB **não** traz população nem per capita, então `PIB per capita = pib / populacao`. Seed `pib-per-capita`: 223 municípios PB, **2023** (último ano na BD, melhor que o "2021" do card antigo → label atualizado). `breakdown` traz PIB total + população + VAB por setor + impostos. **Sem semáforo** (valor absoluto). `variation` = **2023 vs 2022** (`basis: yoy`). Gerador `gerar_seed_pib_per_capita.py` (`--project`/`--offline`), snapshot em `data/pib_per_capita_pb_2023.json` |
| MEI (2025) | ✅ SL (implementado) | Indicador `meis` (base econômica) — **estoque ativo de MEI** por município, do RF Estabelecimentos do lake (§14): estabelecimentos `SITUACAO_CADASTRAL='02'` com opção MEI no `RF_SIMPLES` (join por `CNPJ_BASICO`). Mesmo gerador/rodada dos demais. Substitui `estatisticas_sobre_..._mei` (RFB)/`cnpj` da BD por acesso direto ao lake. **Coletado jul/2026 (run online, `--write-mongo`): PB 97.160** (JP 33.862). Sem semáforo (base econômica) |
| ME (2025) | ✅ SL (implementado) | Indicador `mes` (base econômica) — **estoque ativo de ME** (porte `01`, exclui MEI), mesmo gerador/rodada. Substitui `estatisticas_sobre_simples_nacional`/`cnpj` da BD. **Coletado jul/2026: PB 61.354** (JP 24.175). Sem semáforo |
| EPP (2025) | ✅ SL (implementado) | Indicador `epps` (base econômica) — **estoque ativo de EPP** (porte `03`), mesmo gerador/rodada. Substitui `estatisticas_sobre_simples_nacional`/`cnpj` da BD. **Coletado jul/2026: PB 8.379** (JP 3.736). Sem semáforo |

> **Variação dos cards (campo `variation` no doc do valor).** Cada card do Panorama
> mostra uma variação, mas **não há uma cadência única** entre as fontes — a regra é
> "vs. a observação imediatamente anterior da própria série", e o **período viaja junto**
> no objeto (`{ deltaPct, previousValue, previousYear, basis }`), porque difere por
> indicador:
>
> | Indicador | `basis` | Variação | Disponibilidade |
> |---|---|---|---|
> | **IDSC** | `edicao-anterior` | 2025 vs 2024 (série `buscarSeriePontuacaoIdscPorCidade`) | 223/223; edições do IDSC-BR não são 100% comparáveis metodologicamente |
> | **Cobertura AB** | `yoy-media-anual` | 2020 vs 2019 (média anual vs média anual) | 223/223; YoY limpo, mas 213/223 grudados no teto de 100% → variação ~0% para a maioria |
> | **IDH-M** | — (**sem variação**) | — | só censo decenal 1991/2000/2010 na BD; uma variação seria 2010 vs 2000 (década, não ano) e o card diz "2021" → decidido **não exibir** |
> | **GINI** | — (**sem variação**) | — | mesmo caso do IDH-M — série decenal do Atlas (1991/2000/2010); card diz "2010" → não exibe |
> | **PIB per capita** | `yoy` | 2023 vs 2022 (per capita = `pib/populacao` em cada ano) | 223/223; série anual do IBGE (Contas Regionais), último ano 2023 |
> | **Remuneração média** | `yoy` | 2024 vs 2023 (média de `VL_REMUN_MEDIA_NOM` em cada ano) | 223/223 esperado; série anual da RAIS (data lake), último ano 2024; município sem vínculo remunerado → sem variação |
>
> Indicadores ainda fictícios (MEI/ME/EPP…) seguirão o
> mesmo formato quando coletados; cada um carrega sua própria `basis`/período.

### Cobertura final do catálogo (após varredura completa BD)

- **✅ Cobertos:** 29/35 indicadores (a agenda **Simplificação e digitalização** está completa: tempo de abertura e viabilidade via **data lake do Sebrae** (base `REDESIM`, §9.1/§13), ranking municipal e tempo de licenciamento via API `redesim.pb.gov.br` (§10); **as duas dimensões ISDEL** — Governança + Educação Empreendedora — via CSV do Sebrae; **escolaridade da força de trabalho** — médio + superior completo — via acesso direto ao data lake do Sebrae, §13; **remuneração média** via RAIS do data lake — média de `VL_REMUN_MEDIA_NOM` 2024, variação yoy, §13; **IDSC** via API pública do Instituto Cidades Sustentáveis, §15; **Cobertura da Atenção Básica** via `br_ms_atencao_basica` da BD — média anual 2020, sem semáforo)
- **🟡 Parcial / proxy:** 4/35 (IGM-CFA via Power BI scrape ou IEGM/IFGF; **MPE em ELI** via proxy municipal RFB — fluxo de aberturas do **RF Estabelecimentos do lake** (§14, consolidado jul/2026 com o `negocios-abertos`; antes Observatório Sebrae); recorte ELI indisponível em fonte aberta; **Participação MPE em compras públicas** via PNCP × RF, ambos do data lake — coletado jun/2026, 150/223 munis, 74,5% PB — ver §12/§13; **Bolsa Família** via cubo `MDS_PBF` do Observatório — mede **famílias** (Novo BF), pois o recorte etário 18–50 do catálogo não existe em fonte municipal aberta atual, ver §11)
- **❌ Sem fonte aberta:** 4/35 (Sebrae interno: apoiados Sebrae; **linhas de crédito** — levantado jul/2026: catálogo existe (Plataforma Sebrae, +250 linhas/35 inst.) mas é nacional e não auditável, e o volume R$ a MPE (SCR/BCB) não tem grão municipal; segue pendente, ver agenda "Acesso a crédito"; **compras públicas de inovação** — sem flag de inovação no PNCP, ver §12)

> Nota `tempo-licenciamento`: é a **pontuação** do Índice de Tempo do alvará (proxy oficial), não horas brutas — estas não são publicadas por município (ver §10).

> **Ganhos da varredura:** `adh` (IDHM oficial), `bolsa_familia`, `atencao_basica`, `rais`, `estban`, `estatisticas_sobre_microempreendedores_individuais_mei`, `estatisticas_sobre_simples_nacional`, `iegm`, `ifgf` — todos invisíveis na busca por keyword anterior.

### Semáforo (threshold) — quais indicadores das agendas classificam e quais não

O `threshold` (semáforo Bom / Atenção / Alerta) **só se aplica aos indicadores das agendas**.
Os cards da **base econômica** (Panorama) exibem só o valor — **por design não têm semáforo**,
independentemente de existir faixa oficial —, então ficam **fora** desta tabela. Entre os das
agendas, **só existe threshold quando a fonte publica faixa de classificação oficial** — nunca
inventamos cortes (ver [[feedback_verify_primary_sources]]). Ground-truth = os seeds
`seed/indicador-*.mongodb.js` (`"threshold": {…}` vs comentário `SEM threshold`).

**Com semáforo — 6 indicadores de agenda** (têm `threshold` porque a fonte publica faixa oficial):

| Indicador | Agenda | `kind` | Faixas (Bom / Atenção / Alerta) | Origem da faixa |
|---|---|---|---|---|
| IGM-CFA | Governança | `higher-better` | ≥7,51 · 5,01–7,50 · <5,01 | Faixas do CFA |
| IDH-M | Governança | `higher-better` | ≥0,700 · 0,600–0,699 · <0,600 | Faixas oficiais PNUD/Atlas |
| ISDEL – Governança | Governança | `higher-better` | ≥0,471 · 0,311–0,470 · <0,311 | Faixas oficiais Sebrae (ISDEL 2.0) |
| IGMA | Governança | `higher-better` | ≥65 · 50–64 · <50 | Classificação Áquila (Desenvolvido / Em desenvolvimento / Crítico) |
| Tempo de abertura | Simplificação | `lower-better` | ≤72h · 72–168h · >168h | Marco de 75%, faixas oficiais Redesim (§9) |
| Tempo de viabilidade | Simplificação | `lower-better` | ≤72h · 72–168h · >168h | Idem, faixas oficiais Redesim (§9) |

**Sem semáforo — demais indicadores de agenda** (`threshold: null` — a fonte não publica faixa):

| Indicador | Agenda | Por que não tem threshold |
|---|---|---|
| Ranking Redesim | Simplificação | Total 0–600; a fonte não publica faixa para o total |
| Tempo de licenciamento | Simplificação | É a **pontuação** do Índice de Tempo (proxy); horas brutas por município não são publicadas (§10) |
| Trabalhadores C&T | Ecossistemas de Inovação | Contagem/percentual sem faixa oficial |
| Trabalhadores TIC/criativa | Ecossistemas de Inovação | Percentual sem faixa oficial |
| MPE em ELI | Ecossistemas de Inovação | Var. % a.a. (crescimento) sem faixa oficial |
| Compras públicas de inovação | Ecossistemas de Inovação | Proxy de nível (R$/ano) sem faixa oficial |
| ISDEL – Educação Empreendedora | Educação empreendedora | **Subdimensão** sem faixa própria (faixa oficial é só do índice agregado — §1) |
| Trab. Ensino Médio completo | Educação empreendedora | Contagem bruta sem faixa oficial |
| Trab. Ensino Superior completo | Educação empreendedora | Contagem bruta sem faixa oficial |
| Crédito concedido | Acesso a crédito | Saldo absoluto (R$); o BCB não classifica |
| Pequenos negócios abertos | Inclusão produtiva | Contagem bruta de estabelecimentos sem faixa oficial |
| Empresas ativas | Inclusão produtiva | Contagem bruta de estabelecimentos sem faixa oficial |
| Pequenos negócios extintos | Inclusão produtiva | Contagem bruta de estabelecimentos sem faixa oficial |
| Bolsa Família | Inclusão produtiva | Var. % a.a. (crescimento) sem faixa oficial |
| Participação MPE em compras públicas | Inclusão produtiva | Proxy (% do valor) sem faixa oficial |

> **Regra:** *indicador de agenda + faixa oficial da fonte ⇒ `threshold` ⇒ semáforo*; sem faixa
> oficial ⇒ sem `threshold` (o card exibe só o valor). **Base econômica nunca tem semáforo.** Se
> um dia a fonte publicar faixa para um indicador de agenda, é só preencher `threshold` no seed.
> Indicadores de agenda ainda não coletados (apoiados Sebrae, linhas de crédito, BNDES) ficam de
> fora até terem seed.

---

## 2. Dados extras disponíveis (não no catálogo atual, mas úteis pra OPP)

Coisas que **mcp-brasil** entrega e que podem virar features novas no Panorama, Riscos ou Trilhas:

| Dado | Fonte | Feature mcp-brasil | Possível uso na OPP |
|---|---|---|---|
| Emendas parlamentares pix por município | MB | `/transferegov` | Card "Recursos federais recebidos" |
| Atos administrativos municipais | MB | `/diario_oficial` (Querido Diário, 5.000+ cidades) | Trilhas: monitorar publicações dos 8 municípios da PB |
| Acórdãos TCU + inidôneos + débitos | MB | `/tcu` | Riscos: alertas de gestão fiscal |
| Jurisprudência STF/STJ/TST | MB | `/jurisprudencia` | Trilhas / referências |
| Homicídios e violência por município | MB | `/atlas_violencia`, `/sinesp`, `/forum_seguranca` | Card "Segurança pública" |
| Vacinação SUS, SRAG, dengue | MB | `/imunizacao`, `/saude`, `/opendatasus` | Riscos sanitários |
| Estabelecimentos / leitos / urgências | MB | `/saude` | Detalhe da agenda Saúde |
| Medicamentos SUS, preços CMED, Farmácia Popular | MB | `/rename`, `/anvisa`, `/bps`, `/farmacia_popular` | Saúde pública |
| Queimadas, desmatamento, hidrologia | MB | `/inpe`, `/ana` | Riscos ambientais |
| Imóveis da União por município | MB | `/spu_imoveis`, `/spu_geo` | Patrimônio federal disponível |
| Séries macro (Selic, IPCA, câmbio, +190) | MB | `/bacen` | Contexto econômico nacional |
| CNPJ lookup, CEP, FIPE, bancos | MB | `/brasilapi` | Enriquecer formulário do Formulador |
| Eleições, candidatos, prestação de contas | MB | `/tse` | Composição política do município |
| Deputados/senadores, gastos parlamentares | MB | `/camara`, `/senado` | Representação federal do município |
| Auditorias do SUS | MB | `/denasus` | Riscos de gestão da saúde |
| Marés (litoral) | MB | `/tabua_mares` | Conde, Caaporã, Pitimbu (litorâneos) |
| Geração de documentos oficiais (ofício, parecer, nota técnica) | MB | `/redator` | **Formulador**: sugestão automática de minutas |

E o que **basedosdados** entrega de massa (1.181 datasets, varredura completa) que pode alimentar dashboards comparativos:

### Índices municipais consolidados (proxies para "índice OPP")

| Dataset | Conteúdo | Possível uso |
|---|---|---|
| `adh` | Atlas do Desenvolvimento Humano (PNUD/IPEA/FJP) — IDHM oficial e seus 16 sub-indicadores | IDH-M direto |
| `iegm` | Índice de Efetividade da Gestão Municipal (TCEs) — 7 dimensões | Proxy IGM-CFA |
| `ifgf` | Índice Firjan de Gestão Fiscal — receita, gasto pessoal, investimentos, liquidez | Riscos fiscais |
| `capacidade_de_pagamento_capag_de_estados_e_municipios` | CAPAG do Tesouro — A/B/C/D | Risco fiscal |
| `avs` | Atlas de Vulnerabilidade Social (IPEA) | Vulnerabilidade social (IDSC já vem da API própria, §15) |
| `munic` | Pesquisa de Informações Básicas Municipais (IBGE) | Estrutura de gestão municipal (existência de secretarias, conselhos, planos) |
| `portal_meu_municipio` | Portal Meu Município | Painel comparativo |
| `iegm` / `rs_tce_iegm` | IEGM (geral e RS) | Indicadores TCE |

### Empresas e empreendedorismo

| Dataset | Conteúdo |
|---|---|
| `cnpj` | Quadros societários e situação cadastral (todos os CNPJs brasileiros) |
| `estatisticas_sobre_microempreendedores_individuais_mei` | MEI por município/CNAE (RFB consolidado) |
| `estatisticas_sobre_simples_nacional` | Adesão e distribuição Simples Nacional |
| `exportadoras_importadoras` | Empresas exportadoras/importadoras |
| `tic_empresas` | Uso de TIC pelas empresas (CETIC.br) |
| `pesquisa_de_inovacao` | PINTEC (IBGE) — investimento em inovação |

### Trabalho e renda

| Dataset | Conteúdo |
|---|---|
| `rais` | Relação Anual de Informações Sociais — vínculos formais detalhados (anual) |
| `caged` | Cadastro Geral Empregados/Desempregados (mensal) |
| `pnadc` | PNAD Contínua |
| `estatisticas_da_previdencia_social` | Previdência |

### Educação

| Dataset | Conteúdo |
|---|---|
| `ideb`, `saeb` | Avaliações INEP |
| `censo_escolar` | Censo Escolar oficial |
| `indicadores_educacionais` | Indicadores INEP |
| `sinopse_estatistica_educacao_basica` | Sinopses |
| `dados_da_educacao_brasileira` | Compilado |

### Saúde

| Dataset | Conteúdo |
|---|---|
| `atencao_basica` | **Cobertura da Atenção Básica** (resolve gap direto da OPP) |
| `cnes` | Estabelecimentos de saúde |
| `sia` | Sistema de Informações Ambulatoriais |
| `sih` | Sistema de Informações Hospitalares |

### Crédito e finanças

| Dataset | Conteúdo |
|---|---|
| `estban` | Estatística Bancária BCB — depósitos/empréstimos por município/banco |
| `desembolso` (BNDES) | Desembolsos BNDES MPME |
| **BNDES Dados Abertos** — `operacoes-financiamento` → recurso "Operações não automáticas" | **Fonte usada pelo indicador `bndes-operacoes`** (NÃO está na BD nem no lake). CSV público ~19 Mb (Windows-1252, `;`, decimal `,`), ~23,5k linhas Brasil, desde 2002. `resource_id` `6f56b78c-510f-44b6-8274-78a5b7e931f4`. Operações **contratadas** (valor R$) por município do tomador; forma de apoio DIRETA/INDIRETA (= direto + indireto não automático). URL: `dadosabertos.bndes.gov.br/dataset/operacoes-financiamento` |
| `sicor`, `mdcr` | Crédito rural (relevante p/ Cabaceiras, Monteiro) |
| `siconfi` | Sistema de Informações Contábeis e Fiscais (Tesouro) |
| `mides` | Microdados de Despesas de Entes Subnacionais |
| `transferencias_a_estados_e_municipios` | Transferências federais |
| `bolsa_familia` | Bolsa Família oficial |
| `auxilio_emergencial` | Auxílio Emergencial |

### Compras públicas e governo

| Dataset | Conteúdo |
|---|---|
| `compra_publica_governo_federal` | Compras federais |
| `licitacao_contrato` | Licitações e contratos federais |
| `siconv` | Convênios e contratos de repasse |
| `contratos_federais` | Contratos federais |

### Demografia e território

| Dataset | Conteúdo |
|---|---|
| `pib` | PIB municipal |
| `populacao` | População |
| `censo_demografico`, `censo_2022` | Censos IBGE |
| `codigos_dos_municipios_ibge` | Tabela de códigos |
| `malha_municipal` | Malha geográfica |

---

## 3. TCEs e dados estaduais

mcp-brasil tem TCE de **CE, ES, PA, PE, PI, RJ, RN, RS, SC, SP, TO**. ⚠️ **Não há TCE-PB.** Para os 8 municípios da Paraíba (João Pessoa, Campina Grande, Queimadas, Conde, Caaporã, Pitimbu, Monteiro, Cabaceiras), usar:

- `/diario_oficial` (Querido Diário) — atos administrativos
- `/compras` (PNCP) — licitações e contratos
- `/transferegov` — emendas federais

---

## 4. Datasets locais (ADR-004) do mcp-brasil

Cache opcional ativável via `MCP_BRASIL_DATASETS=...` no `.env`:

| ID | Tamanho | Conteúdo |
|---|---|---|
| `tse_candidatos` | 290 MB | Consulta candidatos 2014–2024 |
| `tse_votacao` | 1600 MB | Votação por município/zona |
| `tse_bens` | 205 MB | Bens declarados |
| `tse_redes_sociais` | 34 MB | Redes sociais dos candidatos |
| `tse_fefc` | 5 MB | FEFC 2020/2024 |
| `spu_siapa` | 220 MB | Imóveis SPU |

---

## 5. Features bloqueadas (precisam env var)

| Feature | Env var faltante | Conteúdo |
|---|---|---|
| `transparencia` | `TRANSPARENCIA_API_KEY` | Portal da Transparência (servidores, despesas, sanções) |
| `dados_gov_br` | `DADOS_GOV_BR_API_KEY` | Catálogo dados.gov.br |
| `datajud` | `DATAJUD_API_KEY` | Processos judiciais CNJ |
| `anuncios_eleitorais` | `META_ACCESS_TOKEN` | Biblioteca de Anúncios Meta |

---

## 6. Dashboards Power BI públicos (IGM-CFA)

O CFA publica o IGM-CFA via dashboard **Power BI embarcado**. Endpoint interno:

```
POST https://wabi-brazil-south-api.analysis.windows.net/public/reports/querydata
```

Headers chave: `Origin: https://app.powerbi.com`, `RequestId`. A query usa **DSR (Data Shape Result)** com DAX por trás. Exemplo de retorno para **João Pessoa-PB**:

| Ano | IGM/CFA | Melhor do grupo |
|---|---|---|
| 2023 | 6,972 | 8,250 |
| 2024 | 6,592 | 8,057 |
| 2025 | 6,537 | 8,348 |

**Como consumir:**
1. Abrir o dashboard público do CFA em browser e capturar via DevTools o `resourceKey` (token anônimo embutido no iframe). Vale por meses, mas pode girar.
2. Replicar o POST acima com a query DSR filtrando UF=PB e município.
3. Parsear o formato compactado: `S` = colunas, `C` = valores. **`R` e `Ø` são bitmasks** (não contadores): bit *i* de `R` ligado ⇒ coluna *i* repete o valor da linha anterior; bit *i* de `Ø` ligado ⇒ coluna *i* é nula; senão, consome o próximo valor de `C`. Colunas com `ValueDict` (`DN`) trazem **índice** no dicionário **ou** o valor literal (municípios além dos ~100 do dict vêm como string).

**✅ Implementado** em `scripts/gerar_seed_igm_cfa.py` (raspa, parseia o DSR e gera o seed). Parâmetros descobertos (válidos em jun/2026):

| Parâmetro | Valor |
|---|---|
| Dashboard | `https://igm.cfa.org.br/bi` → iframe `app.powerbi.com/view?r=<base64 {k,t}>` |
| `RESOURCE_KEY` (`k`) | `eecd56d2-d4d2-40d0-9ee7-1203cc50aa11` *(gira)* |
| `DatasetId` (`dbName`) | `d80b919d-d054-4d99-944b-88893df2e69e` |
| `ReportId` | `13522802` |
| `modelId` | `11356413` |
| Entidade (tabela) | `IGM CFA` — colunas `nome`, `estado (sigla)`, `ano`, `IGM/CFA`, e dimensões `Finanças/Gestão/Desempenho - Dimensão` |

Descoberta do schema: `GET .../public/reports/{RESOURCE_KEY}/modelsAndExploration?preferReadOnlySession=true` (header `X-PowerBI-ResourceKey`) — devolve modelo + visuais (de onde saem os nomes exatos de entidade/coluna e os `prototypeQuery`).

**Trade-off:** funciona, mas é frágil (token gira, schema do report pode mudar). Por isso o gerador versiona um **snapshot** (`data/igm_cfa_pb.json`) e tem modo `--offline`. **Proxies estáveis** seriam `iegm` (IEGM/TCEs) e `ifgf` (Firjan) na Base dos Dados — mas não foram localizados na varredura atual (busca vazia / tabelas não encontradas).

---

## 7. API IGMA Áquila (aberta, sem autenticação)

**Endpoint útil descoberto:**

```
GET https://data-igma-api.aquila.com.br/api/v1/structures/get_params_indicators_ranking?business_id=1&id={structure_id}
```

Retorna por município: nome, IBGE code, lat/lng, **IGMA score + 6 pilares** (Governança e Eficiência Fiscal, Educação, Saúde e Bem-Estar, Infraestrutura e Sustentabilidade, Segurança Pública, Desenvolvimento Socioeconômico) com valor 0–100, posição no ranking nacional e classificação (Crítico / Em desenvolvimento / Desenvolvido). Versão atual: **2026** (atualizada em 09/04/2026).

**Outros endpoints (`/structures`, `/businesses`, `/pillars`, `/versions`) exigem login.** Apenas `get_params_indicators_ranking` é público.

**✅ Implementado** em `scripts/gerar_seed_igma.py` (consome a API e gera o seed `igma`). Os `id` Áquila da PB são um bloco alfabético contíguo — ids **1991** ("Água Branca") a **2212** ("Zabelê") = 222 municípios — mais a capital **João Pessoa** (id **745**, bloco de capitais): 223 no total. O gerador valida a cobertura contra os 223 códigos IBGE do seed de municípios. `breakdown` guarda os 6 pilares + posição no ranking nacional + classificação (faixa Áquila). Snapshot versionado em `data/igma_pb.json`, com modo `--offline`. Os 8 municípios do protótipo foram conferidos ponta a ponta contra os valores de `src/data` (Campina Grande 57,52; João Pessoa 58,24; etc.).

### IDs Áquila para os municípios da OPP

| Município OPP | IBGE | id Áquila | IGMA 2026 | Posição (de ~5570) |
|---|---|---|---|---|
| Campina Grande | 2504009 | **2042** | 57,5 | 466 |
| Caaporã | 2503001 | **2030** | 44,6 | 3.465 |
| Cabaceiras | 2503100 | **2031** | 47,2 | 2.671 |
| Conde | 2504603 | **2052** | 45,6 | 3.153 |
| Monteiro | 2509701 | **2113** | 50,8 | 1.728 |
| Pitimbu | 2511905 | **2136** | 37,4 | 5.105 |
| Queimadas | 2512507 | **2144** | 48,3 | 2.348 |
| João Pessoa | 2507507 | **745** | 58,2 | 378 |

> Capitais ficam em IDs próprios (bloco antes da listagem alfabética por estado), com flag `capital: true`. João Pessoa = id 745.

**Sobreposição parcial com a OPP:** OPP e IGMA olham para territórios temáticos parecidos, mas a **cesta de indicadores dentro de cada pilar/agenda é diferente** — não há mapeamento 1:1.

| Pilar IGMA | Agenda OPP correspondente | Sobreposição |
|---|---|---|
| Governança, Eficiência Fiscal e Transparência | Governança multissetorial | 🟡 mesmo tema, indicadores distintos (IGMA usa receita/gestão fiscal; OPP usa IGM-CFA, ISDEL, IGMA) |
| Educação | Educação empreendedora | 🟡 IGMA mede educação básica/escolar; OPP foca educação **empreendedora** (escopo diferente) |
| Desenvolvimento Socioeconômico | Inclusão produtiva | 🟡 cestas distintas |
| Saúde e Bem-Estar | — | ❌ OPP não tem agenda Saúde |
| Infraestrutura e Sustentabilidade | — | ❌ OPP não tem agenda Infra |
| Segurança Pública | — | ❌ OPP não tem agenda Segurança |
| — | Simplificação e digitalização | ❌ IGMA não cobre |
| — | Ecossistemas de Inovação | ❌ IGMA não cobre |
| — | Acesso a crédito | ❌ IGMA não cobre |

**Como usar então:** consumir o **IGMA score consolidado** + posição no ranking nacional como dado de contexto (card "Como o município se posiciona"), e usar os 3 pilares extras (Saúde, Infra, Segurança) como possíveis cards complementares no Panorama. Os indicadores específicos de cada agenda OPP continuam vindo de BD/MB conforme §1.

---

## 8. Recomendações de ingestão

1. **Quick win — dados ao vivo (sem cache):** `/inep` (IDEB), `/saude` (CNES), `/compras` (PNCP), `/bndes`, `/ibge` Sidra, `/transferegov` via mcp-brasil + IGMA Áquila para os 6 pilares.
2. **Quick win — dados massivos (BigQuery):** `pib`, `cnpj` (MEI/ME/EPP/abertas/extintas), `caged` (escolaridade + remuneração), `ideb`, `censo_demografico` (Gini) via basedosdados.
3. **Build é estático:** criar `scripts/fetch-data.ts` que combina BD + MB + Áquila offline e gera JSONs em [indicators/values/](indicators/values/).
4. **Featurização extra:** considerar usar `/diario_oficial` e `/transferegov` para virar conteúdo da seção de Riscos e/ou Trilhas.
5. **Lacunas restantes:** IGM-CFA, dados internos do Sebrae seguem como inputs manuais (IDSC, ISDEL e Redesim já têm API/fonte própria — ver §15, §1 e §9–§10).

---

## 9. API pública da Redesim (tempo de abertura de empresas)

O Portal de Estatística da Redesim (Mapa de Empresas) expõe uma **API REST pública sem
autenticação** em `https://estatistica.redesim.gov.br/tempos-abertura-redesim/`
(descoberta raspando o bundle Angular `main.*.js` do site):

| Endpoint | Retorna |
|---|---|
| `GET /periodos-disponiveis` | JSON dos anos/meses disponíveis — **série de 2019 ao presente**, 12 meses/ano |
| `GET /exportar/solicitacoes/{UF}?mes={M}&ano={A}` | **XLSX dos microdados** (1 linha por solicitação de abertura). A UF vai **no path**; sem `/{UF}` = Brasil inteiro (~85k linhas/mês) |
| `GET /tempo-medio-total-abertura/{UF}?ano=&mes=` | Agregado UF: `{dias, horas}` (tempo médio) |
| `GET /percentual-solicitacoes-abertura/{UF}` · `/percentual-viabilidade/{UF}` | Agregado UF: `{percentual1..4}` por faixa (cross-check) |

Granularidade municipal **só** existe nos microdados (XLSX); os agregados são por UF.

**Metodologia oficial (validada contra os endpoints, PB mai/2026):**
- **Tempo total de abertura** (horas úteis) = `QTDE HH VIABILIDADE TOTAL` + `QTDE HH
  LIBERAÇÃO DBE` (validação cadastral) + `QTDE HORAS DEFERIMENTO` (registro/inscrição) —
  colunas 11, 17, 24 do XLSX. **Não** inclui tempo do usuário, licenças ou alvará.
- Cor do ente = **marco de 75%** (faixa que contém o percentil 75 dos processos). Faixas
  oficiais com **1 dia = 24 horas úteis**: 🟢 ≤72h (≤3d) · 🟡 72–120h (3–5d) · 🟠 120–168h
  (5–7d) · 🔴 >168h (>7d). Reproduz o oficial PB (95/3/1/1) e a média "0 dias 19 horas".
- O XLSX traz **nome** do município (não IBGE) → casar por slug. Renomeados PB: Joca
  Claudino=Santarém (2513653), São Vicente do Seridó=Seridó (2515401), Tacima=Campo de
  Santana (2516409).

**✅ Implementado** em **dois geradores independentes** (um por indicador, padrão "uma
fonte → um script → um seed"): `database/scripts/gerar_seed_tempo_abertura.py` e
`gerar_seed_tempo_viabilidade.py`. Cada um baixa 12 meses, agrega o marco de 75% por
município e faz cross-check contra o agregado oficial. Geram, respectivamente, os
indicadores `tempo-abertura` (viab + validação + registro) e `tempo-viabilidade` (só
viabilidade) da agenda `simplificacao`.

> **Cobertura real:** 1 mês cobre só ~43% dos 223 municípios (cidade pequena abre
> pouquíssimas empresas/mês); acumulando **12 meses** sobe para **~84%** (187/223). Os
> demais entram com `numericValue: null` (sem aberturas na janela). Municípios com n<30
> entram com o valor + `confiabilidade: "baixa"` no `breakdown`.

### 9.1. Migração para o data lake (caminho preferencial, jun/2026)

O **data lake do Sebrae também ingere a Redesim** (base `REDESIM`, ver §13): a coleção
`BRASIL_<ano>` é o **mesmo microdado** que a API expõe em XLSX, com 1 doc por solicitação
de abertura. Confirmado via `inspecionar_redesim_lake.py` que os campos batem 1:1 com as
colunas do XLSX: `QTDE_HH_VIABILIDADE_TOTAL` (col 11), `QTDE_HH_LIBERACAO_DBE` (col 17),
`QTDE_HORAS_DEFERIMENTO` (col 24), `MUNICIPIO` (nome), `UF`, `ANO`, `MES`.

Por isso `tempo-abertura` e `tempo-viabilidade` passaram a ser coletados **pelo lake**
(`gerar_seed_tempo_abertura_lake.py`, 1 script → 2 seeds), seguindo o fluxo autocontido
do §13 (sem internet/API em runtime). O **P75 foi reimplementado à mão** (host do ETL é
Python 3.6, sem `statistics.quantiles`) reproduzindo bit-a-bit o método `inclusive` do
CPython → números idênticos aos da API. Sem cross-check via API (autocontido).

- **Cobertura:** ano-calendário (não janela de 12 meses): 2025 = **196/223** municípios
  (melhor que os ~84% da janela). Demais entram `null`; n<30 → `confiabilidade: "baixa"`.
- Os geradores **da API** (`gerar_seed_tempo_abertura.py` / `_viabilidade.py`) seguem no
  repo como **fonte legada/fallback** — mesma metodologia, mesma forma de seed.
- ⚠️ `ranking-redesim` e `tempo-licenciamento` **não** estão na base `REDESIM` do lake
  (ela só tem o fluxo de abertura; sem alvará/ranking) → continuam na API `redesim.pb.gov.br`
  (§10).

---

## 10. API pública do Ranking Municipal da Redesim/PB

O portal **Mapa de Empresas/PB** (`redesim.pb.gov.br/mapa-empresas`, app Next.js) expõe
uma **API REST pública sem autenticação** (descoberta nos chunks `_next/static/chunks`):
base `https://www.redesim.pb.gov.br/api/mapa-empresas-service/`.

| Endpoint | Retorna |
|---|---|
| `GET /ranking-periodo` | anos/meses disponíveis (o ranking é apurado nos **últimos 6 meses**) |
| `GET /ranking-municipal?periodoInicial=YYYY-MM-01&periodoFinal=YYYY-MM-01` | **223 municípios da PB com IBGE** (`cod_municipio`), `documento`/`indice`/`tempo` (componentes), `total` (0–600), `percentual` (0–100), `posicao` (1–223). Aceita `&indicador=K` para isolar um indicador |
| `GET /ranking-indicador` | lista de indicadores filtráveis: DH (Documento Habilitado), IA (Índice de Atendimento), TA (Tempo de Análise) por documento (Consulta Prévia, Alvará de Localização `1\|`, Alvará Sanitário `2\|`, Inscrição Municipal) |
| `GET /ranking-panorama-estado?periodoInicial=&periodoFinal=` | agregado **estadual** por documento: `percentual` (DH), `tempo` (horas `HH:MM:SS`), `Meta Tempo`, `indice` (IA). Ignora filtro de município |
| `GET /ranking-regiao` | as 14 regiões da PB |

**Metodologia** (ver também *Ranking Municipal do Ambiente de Negócios*): pontuação mensal
máx 100 = Documentos Habilitados (35) + Índice de Atendimento (15) + Índice de Tempo (50);
a API **soma os 6 meses** da janela → escalas 6× (DH 210, IA 90, Tempo 300, Total 600).

**Implementado:** `ranking-redesim` (`gerar_seed_ranking_redesim.py`, `numericValue` = total
0–600, sem threshold — a fonte não publica faixa oficial para o total).

> ⚠️ **Tempo de licenciamento — limite da fonte:** as **horas brutas** de alvará só existem
> no `ranking-panorama-estado` (nível **estadual**: Alvará de Localização ~253h, Sanitário
> ~726h). Por **município**, a API publica apenas a **pontuação do Índice de Tempo** do
> alvará (`ranking-municipal?indicador=1\|3` / `2\|3`), que é derivada das faixas oficiais de
> horas (Alvará Localização: 10 pts ≤72h … 1 pt >264h; Sanitário: 10 pts ≤96h … 1 pt >312h).
> Logo, `tempo-licenciamento` por município é modelável como **faixa oficial** (a partir do
> score), não como horas cruas.

---

## 11. API Tesseract do Observatório Sebrae (Receita Federal e +)

O **Observatório Setorial Territorial do Sebrae** (`observatorio.sebrae.com.br`, front
Next.js da Datawheel) expõe uma **API Tesseract OLAP pública sem autenticação** (descoberta
nos bundles `_next/static/chunks`, variável `TESSERACT`):

```
base = https://apiv2-observatorio.sebrae.com.br/tesseract   (espelho: https://api-observatorio.sebrae.com.br)
```

| Endpoint | Retorna |
|---|---|
| `GET /cubes` | catálogo de **59 cubos** (medidas + dimensões + níveis) |
| `GET /members?cube={C}&level={Nível}` | membros de um nível (chave + caption) |
| `GET /data.jsonrecords?cube={C}&drilldowns={N1,N2}&measures={M}&{Nível}={chaves}` | dados (cut = `Nível=chave1,chave2`) |

**Cubo `RF` (Receita Federal — Estabelecimentos), medida `Establishments`:** geografia até
**Município (chave = código IBGE)**, recorte `State=25` (PB). Dimensões-chave: `Company Size
Sebrae` (3=EPP, 4=ME, 5=MEI, 9=Outros), `Open Activity Year` (ano de abertura), `Status
Year`, `Registration Status` (1 Nula · 2 Ativa · 3 Suspensa · 4 Inapta · 8 Baixada — a base
**mantém baixadas**, então contar por ano de abertura *sem* filtro de situação dá o fluxo de
formalização sem viés de sobrevivência), `MEI Indicator`, `Simples Indicator`, e flags de
jornadas/territórios Sebrae (`Journeys`: Cidade Empreendedora, Sala do Empreendedor,
Território Empreendedor, Agente Territorial…). **Não há nível "ELI"** — por isso o indicador
`crescimento-mpe` usa **proxy municipal**.

**✅ Implementado — e CONSOLIDADO no lake (jul/2026).** O indicador `crescimento-mpe` (var. % a.a.
das MPE formalizadas por ano de abertura — fluxo, todas as situações; ano-ref = último ano civil
completo) passou a ser gerado por **`scripts/gerar_seed_negocios_rfb_lake.py`** (§14), a partir do
**MESMO fluxo de aberturas** do `RF_ESTABELECIMENTOS` do lake que alimenta o `negocios-abertos` — não
mais da API Tesseract do Observatório. Motivo: os dois mediam a mesma coisa de fontes diferentes e
**podiam discordar** (ex.: João Pessoa 2025 dava **+23,2%** pelo Observatório e **+19,1%** pelo lake);
consolidado, o `numericValue` do crescimento É a variação % a.a. que o `negocios-abertos` já guarda no
breakdown (JP `aberturasRef=15184` idêntico nos dois). Ganho: fonte única, autocontida (sem rede),
sem risco de inconsistência interna. Cross-check PB (lake, 2025 vs 2024): **+19,9%**.

> ⚠️ **`anoCorrenteParcial` não traduz para o lake:** o cubo do Observatório era ao vivo (trazia o ano
> corrente parcial); a coleção `RF_ESTABELECIMENTOS_<ano>` é o vintage daquele ano. A série do
> breakdown agora roda `2016..ano-ref` (completo, `ANO_MIN_SERIE=2016`), sem ano parcial.
>
> O gerador antigo **`scripts/gerar_seed_crescimento_mpe.py`** (Observatório Tesseract) + snapshot
> `data/crescimento_mpe_pb.json` **ficam no repo como referência/fallback**, mas a coleta oficial é a
> do lake. Cross-check histórico do Observatório (jun/2026): aberturas de MPE 2024=51.444 →
> 2025=63.594 (**+23,6%**) — difere do lake por ser outra extração/agregação.

**✅ Implementado (2º uso da API Tesseract)** em `scripts/gerar_seed_bolsa_familia.py`
(indicador `bolsa-familia`, agenda *Inclusão produtiva*) a partir do cubo **`MDS_PBF`**
(Programa Bolsa Família/MDS), medida `Beneficiary Families` (estoque mensal) + `Transferred
Value`, geografia até Município (chave IBGE), recorte `State=25` (PB), dimensão Time =
Year/Month. Métrica: **var. % a.a. da média mensal de famílias beneficiárias** (média dos
estoques mensais do ano — robusta a anos com nº de meses diferente: 2023 começa em mar/2023
com o relançamento; o último ano pode vir parcial); ano-ref = último ano com dados vs anterior.
Snapshot em `data/bolsa_familia_pb.json`, modo `--offline`. **🟡 proxy:** o cubo **não tem
dimensão de idade** — a unidade é **família**, não pessoa por faixa etária, então o recorte
*18–50* do catálogo não é coletável aqui (nem em nenhuma fonte municipal aberta atual; só no
CadÚnico amostral 2012–2018). **Sem threshold.** Cross-check PB jun/2026: média mensal de
famílias por município 2024=3.009 → 2025=2.926 (**−2,7%**, pente-fino do Novo BF).

> **Outros cubos úteis (futuro):** `Sebrae_Atendimento` (atendimentos Sebrae por
> município/programa — proxy para "pequenos negócios apoiados pelo Sebrae"), `RAIS_workers` /
> `RAIS_establishment`, `RF` (também serve a "pequenos negócios abertos/ativos/extintos" via
> `Registration Status`), `ISDEL`, `INEP_IDEB_Municipio`, `IBGE_PIB_Municipal_VAB`,
> `BCB_ESTBAN_MUN`, `PNUD_Atlas_IDHM`. Muitos espelham fontes que a OPP já puxa da
> BD/MB, mas aqui vêm **pré-agregados por município** e com os recortes territoriais do Sebrae.

---

## 12. API de consulta do PNCP (compras públicas) — metodologia

O **Portal Nacional de Contratações Públicas** (Lei 14.133/2021) expõe uma **API REST
pública de consulta sem autenticação**. Spec OpenAPI confirmada em jun/2026:

```
base    = https://pncp.gov.br/api/consulta/v1
swagger = https://pncp.gov.br/api/consulta/swagger-ui/index.html
docs    = https://pncp.gov.br/api/consulta/v3/api-docs   (OpenAPI JSON, 12 endpoints)
```

| Endpoint | Filtros úteis | Retorna |
|---|---|---|
| `GET /contratacoes/publicacao` | `dataInicial`,`dataFinal`,`codigoModalidadeContratacao` (**obrig.**), `uf`, **`codigoMunicipioIbge`**, `cnpj`, `pagina` | contratações (`RecuperarCompraPublicacaoDTO`): `objetoCompra`, `valorTotalHomologado`/`Estimado`, `amparoLegal`, `unidadeOrgao.codigoIbge`, `orgaoEntidade.cnpj`. **Filtra por município**, mas **não traz fornecedor** |
| `GET /contratos` | `dataInicial`,`dataFinal`, `cnpjOrgao`, `pagina` | contratos (`RecuperarContratoDTO`): **`niFornecedor`** (CNPJ), `nomeRazaoSocialFornecedor`, `tipoPessoa`, `valorGlobal`, `unidadeOrgao.codigoIbge`. **Traz fornecedor**, mas **não filtra por município** (só por CNPJ do órgão) |
| `GET /atas`, `/pca/` | datas / órgão | atas de registro de preço e Planos de Contratação Anual |

Janela máx. **365 dias** por chamada; `tamanhoPagina` mín. **10** (5 → HTTP 400).

**Limite estrutural:** **nenhum DTO do PNCP traz o porte (ME/EPP) do fornecedor.** Logo a
participação MPE não sai do PNCP isolado — exige join com a Receita Federal.

### `mpe-compras-publicas` — Participação MPE em compras públicas (planejado)

Metodologia (cross-source PNCP × RFB), `numericValue` = **% do valor de contratos do
município com fornecedor de pequeno porte**, janela 12 meses:

1. **Descobrir órgãos por município** — `/contratacoes/publicacao` com `codigoMunicipioIbge`
   varrendo os 223 da PB × modalidades (6 Pregão, 8 Dispensa, 9 Inexigibilidade,
   4 Concorrência, 12 Credenciamento). Coleta o conjunto de `orgaoEntidade.cnpj`.
2. **Puxar contratos** — `/contratos?cnpjOrgao=…` para cada órgão → `niFornecedor`,
   `valorGlobal`, `unidadeOrgao.codigoIbge` (re-bina por município).
3. **Classificar porte** — join dos CNPJs em `basedosdados.br_me_cnpj.empresas`
   (`SUBSTR(niFornecedor,1,8) = cnpj_basico`). **Pequeno negócio = `porte IN ('1','3')`**
   (1=ME, 3=EPP; 5=demais). MEI ⊂ ME. Validado no BigQuery (jun/2026).
4. **Agregar** — participação = Σ `valorGlobal`(ME/EPP) ÷ Σ `valorGlobal`(total), por município.

**Ressalvas:** PNCP cobre **a partir de ~2021** (Lei 14.133), com adesão municipal irregular
— muitos municípios pequenos da PB têm pouco/zero registro (entram `numericValue: null`).
Fornecedor PF (`tipoPessoa`) e estrangeiro (`codigoPaisFornecedor`) ficam fora do recorte de
porte. **Sem `threshold`** (não há faixa oficial de participação MPE; não inventamos cortes —
o `higher-better 20/10` em `src/data/indicators/thresholds.ts` era inventado). Snapshot
versionado + modo `--offline` no gerador, como nos demais.

**Pipeline validado ponta a ponta** (10/06/2026, quando a API respondeu): descoberta de
órgãos por IBGE, contratos por `cnpjOrgao` (com `niFornecedor`/`valorGlobal`/IBGE) e o join
de porte no BigQuery (`empresas` + `simples`, MEI separável) — todos confirmados num teste
com Campina Grande e Cabaceiras. Gerador escrito:
`database/scripts/gerar_seed_mpe_compras_publicas.py` (online + `--offline` + snapshot, roda
com o Python que tem `google-cloud-bigquery`, ex. `/tmp/bqvenv/bin/python`). **Falta só
rodar a varredura completa dos 223** — pendente de a API estabilizar.

> ⚠️ **Status 11/06/2026 — a API existe, mas NÃO foi possível coletar os dados.** A API de
> consulta do PNCP está **funcional porém instável/sobrecarregada**: responde em janelas
> curtas de poucos segundos e logo degrada. Tentativa de varredura completa dos 223 **abortou
> no 1º município** (Água Branca, `2500106`) com `HTTP 500`. Diagnóstico conclusivo — a
> **mesma requisição idêntica**, repetida 5×, devolveu `200 em 56,6s` · `422` · `500` · `500`
> · `500`: o backend deles **estoura por timeout (30–57s) de forma intermitente**, sem relação
> com o tamanho da janela. Um `200` que leva 56s indica **degradação sustentada**, não soluço
> pontual.
>
> Por decisão do projeto, o gerador **não contorna instabilidade** (sem retry agressivo nem
> split adaptativo de janela): se a API falhar, a rodada falha e tentamos de novo quando
> normalizar. **Coleta adiada até o backend do PNCP estabilizar de fato.** O pipeline e o
> gerador estão prontos — quando a API responder consistentemente rápido, basta rodar
> `gerar_seed_mpe_compras_publicas.py --ano 2025 --project <gcp>` (com o Python do BigQuery).

### `mpe-compras-publicas` via ETL do data lake (caminho preferencial — contorna a API)

O **data lake do Sebrae já ingere o PNCP _e_ a Receita Federal** (ver §13). Como a API pública
é instável, o caminho escolhido passa a ser o **mesmo ETL da RAIS**: agregar os contratos **na
origem** (Mongo do lake), descer só o resultado pequeno e resolver o porte **na própria base da
RF do lake** — sem BigQuery, sem internet, **uma rodada só** na 10.1.141.23.

- **Gerador:** `database/scripts/gerar_seed_mpe_compras_publicas_lake.py` (3.6-safe, molde do
  `gerar_seed_escolaridade.py`). Mesma **métrica** e mesmo seed de saída
  (`indicador-mpe-compras-publicas.mongodb.js`) do gerador de API — muda só a origem dos dados.
- **Fluxo (uma rodada):** agrega o PNCP server-side a 1 linha por `(município × fornecedor)`,
  resolve o porte de cada CNPJ com um `$in` em `RF_EMPRESAS_<ano>` (e o MEI em
  `RF_SIMPLES_<ano>`), agrega aos 223 e emite o seed. Snapshot em
  `database/data/mpe_compras_publicas_lake_pb.json`; `--offline` regenera o seed sem tocar no
  lake; `--write-mongo` faz upsert direto no `DadosOPP`.
- **Ano-alinhado:** `CONTRATOS_2025` × `RF_EMPRESAS_2025` × `RF_SIMPLES_2025` — porte/MEI
  contemporâneos ao contrato (uma ME de 2025 que virou média em 2026 conta como pequeno
  _naquele_ contrato). As coleções do PNCP/RF no lake são por ano (`CONTRATOS_2025` ≈ 0,98M docs
  = ano fechado; `CONTRATOS_2026` ainda parcial).
- **Schema calibrado** contra o lake real (jun/2026): PNCP é UPPERCASE_SNAKE
  (`ORGAO_ENTIDADE.ESFERA_ID`='M', `UNIDADE_ORGAO.CODIGO_IBGE`, `NI_FORNECEDOR`, `TIPO_PESSOA`,
  `CODIGO_PAIS_FORNECEDOR`, `VALOR_GLOBAL`, `ANO_CONTRATO`); `RF_EMPRESAS_2025` (~65,7M docs,
  índice `idx_cnpj`) tem `CNPJ_BASICO` (int — casamos por `zfill(8)`) e `PORTE_EMPRESA` ('01'=ME,
  '03'=EPP, '05'=demais → normalizado p/ '1'/'3'/'5'); `RF_SIMPLES_2025` (~46,2M, `idx_cnpj`) tem
  o MEI em `OPCAO_MEI` ('S'/'N'). Modos `--inspect`/`--inspect-rfb` confirmam tudo.
- **Escopo** = **esfera municipal** (`ESFERA_ID == 'M'`); `validate()` aborta se a
  cobertura/valores cheirarem a campo errado.
- **Coleta concluída (jun/2026, CONTRATOS_2025):** harvest reduziu a 7.214 linhas
  (município × fornecedor) cobrindo **150/223 municípios** (R$ 5,06bi a PJ; 7.135 fornecedores
  PJ); porte resolvido em 4.609/4.611 CNPJs; MEI em 560. **Participação PB = 74,5%** do valor de
  compras municipais a pequenos negócios (R$ 3,77bi); média simples entre municípios = 75,5%.
  Coerente com a preferência ME/EPP da LC 123/147 em compras públicas. Seed e snapshot
  versionados; carga no `DadosOPP` via `--write-mongo`/seed.

### `compras-publicas-inovacao` — de ❌ para 🟡 (proxy de NÍVEL via lake)

> **Por que 🟡 e não ✅:** as fontes são primárias (PNCP + Receita Federal), mas **não existe
> definição oficial de "compra pública de inovação" por município** — a operacionalização (cesta
> CNAE ∪ classificador de objeto) é um **proxy construído pelo projeto**, e não capta a inovação
> "jurídica" (CPSI/encomenda tecnológica). Mesmo patamar de confiança do `crescimento-mpe` (🟡).

**Métrica:** *Valor (R$/ano) das compras públicas de inovação nos pequenos negócios* —
`numericValue` = `valorInovPeq[refYear]` (valor de contratos municipais a ME/EPP/MEI que são de
inovação). Agenda `inovacao`, ordem 4. **Sem threshold.** Município sem contrato municipal a PJ
no PNCP → `numericValue: null` (lacuna de cobertura); com contrato e sem inovação → `0`.

> **Por que NÍVEL e não "Crescimento" (apesar do label original do catálogo):** a variação a.a.
> é dominada pela **adesão crescente ao PNCP**, não pela política de inovação. Medido jun/2026:
> total municipal PJ cresceu **+303%** de 2024→2025 (R$1,25bi→5,06bi) e a inovação **+191%** —
> mas a *share* de inovação **caiu** 3,96%→2,86%. Reportar "+191% de crescimento" seria o oposto
> da verdade. Por decisão do projeto, o indicador é o **valor do ano** (label atualizado no
> `catalog.ts` para "Valor … (R$/ano)"). O ano anterior só serve de **reserva de CNAE**.

**O bloqueio antigo era só a flag de inovação.** Continua verdade que o PNCP não traz
`amparoLegal`/modalidade nos CONTRATOS, nem isola CPSI/encomenda tecnológica (Marco Legal
CT&I) por município — esses instrumentos "duros" são raros e ficam de fora. Mas a métrica é
**viável como proxy** cruzando dois sinais, **ambos no lake** (sem fonte externa):

- **(A) CNAE do fornecedor** ∈ {TIC 26/61/62/63 · criativa 58/59/60/73/74/90/91 · P&D 72}
  (cesta de `trabalhadores-tic`), resolvido em `RF_ESTABELECIMENTOS_<ano>` (CNAE do estab.,
  preferindo a matriz). *Quem* vendeu é de setor intensivo em conhecimento.
- **(B) OBJETO do contrato** (`OBJETO_CONTRATO`, que ESTÁ no lake) classificado pela semente
  calibrada em `database/scripts/calibrar_compras_inovacao.py` (software/P&D/IoT/plataforma…;
  veta conteúdo didático). *O que* foi comprado tem cara de inovação.

`inovacao = A ∪ B`; confiança 'alta' quando A ∩ B. Cada sinal cobre o ponto cego do outro
(firma de TI que vende móvel → só A erra; objeto genérico → só B erra). É **proxy setorial/
textual**, não inovação no sentido jurídico — o rótulo da descrição reflete isso.

**Gerador:** `gerar_seed_compras_publicas_inovacao_lake.py` (molde do `mpe-compras` +
join de CNAE + classificador). Harvest de **um ano** (refYear); o ano−1 entra só como reserva
de CNAE. Calibração: `--inspect` (PNCP), `--inspect-rfb` (porte/MEI), `--inspect-estab` (CNAE).

> ✅ **Coletado (jun/2026, refYear 2025):** 223 valores no `DadosOPP`. **Total PB = R$144,5M** de
> inovação a pequenos negócios (de R$5,06bi a PJ — share 2,86%); **98/150** municípios com
> contrato municipal compraram inovação. **Split do valor por sinal: só CNAE 62% · só objeto 32%
> · ambos 7%** — o classificador de objeto (sinal B) captura ~1/3 do valor sozinho, validando a
> calibração. **Gotcha:** `RF_ESTABELECIMENTOS_2025` estava a ~59% de carga → CNAE caiu para o
> estab de 2024 (fallback); ver `RUNBOOK §11`.

---

## 13. Data lake do Sebrae (RAIS/CAGED, acesso direto)

Além do basedosdados/BigQuery, a OPP tem **acesso direto ao data lake do Sebrae** — um
Mongo com os microdados brutos da RAIS e do CAGED (`10.19.4.174:27018`, uma base por fonte:
`RAIS`, `CAGED…`, **`PNCP`**, **`RECEITA_FEDERAL`**, **`REDESIM`**). É mais **atual e granular**
que o basedosdados (que atrasa 1–2 anos) e a fonte natural para indicadores de emprego formal.
**O lake também ingere o PNCP e a Receita Federal** (coleções por ano: `CONTRATOS_<ano>`,
`RF_EMPRESAS_<ano>`, `RF_SIMPLES_<ano>`, e — a confirmar via `--inspect` — `RF_ESTABELECIMENTOS_<ano>`)
→ é por ele, e não pela API instável nem pelo BigQuery, que coletamos `mpe-compras-publicas`
(PNCP × porte da RF, ver §12) e os três indicadores de **estoque/fluxo de empresas** da Inclusão
produtiva (abertos/ativas/extintos, ver §14). **E ingere a Redesim** (base `REDESIM`, coleções
`BRASIL_<ano>` — microdados de solicitações de abertura, ~0,91M/ano em 2025; índices em
`MUNICIPIO`/`ANO`/`MES`/`UF`) → fonte de `tempo-abertura`/`tempo-viabilidade` (§9.1).

**Convenção de conexão do lake** (geradores `*_lake.py`, commits c2413af/4ec16d5/2e504f8):
host fixo `10.19.4.174:27018`, authSource `admin`, credencial `usr_<BASE>:usr_<BASE>`
(`usr_REDESIM`, `usr_RAIS`, `usr_RECEITA_FEDERAL`, `usr_PNCP`) — todos são **default no
script**, derivados após o parse, então a rodada mínima é só `--write-mongo`. Os scripts
**carregam `database/.env` sozinhos** (load_dotenv; dispensa `source`); o `.env` só precisa
do `OPP_MONGO_USER`/`OPP_MONGO_PASS` (o user do OPP, `usrdadosopp`, não segue o padrão `usr_`).

**Padrão de ingestão (fluxo lake→OPP):** a agregação roda **na origem** (87,7M vínculos →
223 municípios) e só o resultado desce — nunca replicamos os microdados. O job roda na
`10.1.141.23` (única máquina que vê o lake e hospeda o Mongo OPP) e escreve direto no
`DadosOPP`. 1º indicador: escolaridade da força de trabalho (médio/superior completo).
Topologia, credenciais calibradas, passo a passo e cron em **`RUNBOOK_ETL.md`**.

Campos úteis da RAIS crua (coleções `*_VINC`): `MUNICIPIO` (6-díg IBGE sem DV),
`ESCOLARIDADE_APOS_2005` (1–11), `VINCULO_ATIVO_31_12`, `CBO_OCUPACAO_2002`, `CNAE_2_0_*`,
`VL_REMUN_*` — dá para refazer trabalhadores-ct/tic e remuneração direto da fonte, sem o
atraso do basedosdados.

---

## 14. Estoque/fluxo de empresas (RF Estabelecimentos do lake) — abertos/ativas/extintos/crescimento-mpe + base econômica por porte

**Até 8** indicadores saem da **mesma fonte e numa rodada só**: a base de **Estabelecimentos da
Receita Federal no data lake** (`RF_ESTABELECIMENTOS_<ano>`, ~37,6M docs, confirmada jun/2026). É o
caminho do lake (§13), não a API/BigQuery. Gerador:
`database/scripts/gerar_seed_negocios_rfb_lake.py` (molde do `gerar_seed_escolaridade.py`,
3.6-safe; 1 script → **8 seeds**). São **4 de agenda** — três da **Inclusão produtiva**
(`negocios-abertos`, `empresas-ativas`, `negocios-extintos`) e o `crescimento-mpe` (Crescimento de MPE,
agenda **Ecossistemas de Inovação**, consolidado aqui em jul/2026; antes vinha da API Tesseract do
Observatório) — **+ 4 cards da base econômica** (section `socialeconomic`): **`empresas-ativas-total`**
(estoque, todos os portes) e **`meis`/`mes`/`epps`** (estoque ativo quebrado por porte). Todos do mesmo
estoque ativo, sem alias no frontend.

> **Split de porte só no run online.** `empresas-ativas-total` sai também offline (é só o total). Já
> `meis`/`mes`/`epps` exigem resolver o porte de **~todos os CNPJs ativos da PB** (join no
> `RF_EMPRESAS`/`RF_SIMPLES`) — a maior fatia da rodada; esse split fica em `ativasPorPorte` no snapshot
> e **só é gerado no run ONLINE** (`--offline` pula os três e avisa).

> **Município:** diferente da RAIS, o campo `MUNICIPIO` aqui é o **código da Receita Federal**
> (`id_municipio_rf`: 2051=João Pessoa, 1981=Campina Grande), **não o IBGE**. Recorte da PB por
> `UF=='PB'`; tradução código RFB → IBGE pelo campo **`rfCode` da coleção `municipalities`** do
> `DadosOPP` (gerada por `gerar_seed_municipios.py`) — lida em runtime do próprio banco da OPP, sem
> fonte externa. Confirmado contra o lake: 223 códigos distintos = 223 municípios da PB.

| Indicador | Agenda | Recorte no `RF_ESTABELECIMENTOS` | Porte | Métrica |
|---|---|---|---|---|
| `negocios-abertos` | Inclusão produtiva | `DATA_INICIO_ATIVIDADE` no ano-ref | pequeno (ME/EPP, MEI incluso) | contagem absoluta |
| `empresas-ativas` | Inclusão produtiva | `SITUACAO_CADASTRAL = '02'` (estoque) | **todos** os portes | contagem absoluta |
| `negocios-extintos` | Inclusão produtiva | `SITUACAO_CADASTRAL = '08'` + `DATA_SITUACAO_CADASTRAL` no ano-ref | pequeno (ME/EPP, MEI incluso) | contagem absoluta |
| `crescimento-mpe` | Ecossistemas de Inovação | **mesmo fluxo do `negocios-abertos`** (aberturas por ano) | pequeno (MPE = MEI+ME+EPP) | **var. % a.a.** = (fluxo[ref]−fluxo[prev])/fluxo[prev]×100 |
| `empresas-ativas-total` | Base econômica (`socialeconomic`) | `SITUACAO_CADASTRAL='02'` (estoque) | **todos** os portes | contagem absoluta |
| `meis` | Base econômica (`socialeconomic`) | `SITUACAO_CADASTRAL='02'` + opção MEI (`RF_SIMPLES`) | MEI | contagem absoluta (estoque ativo) |
| `mes` | Base econômica (`socialeconomic`) | `SITUACAO_CADASTRAL='02'` + porte `01` | ME (exclui MEI) | contagem absoluta (estoque ativo) |
| `epps` | Base econômica (`socialeconomic`) | `SITUACAO_CADASTRAL='02'` + porte `03` | EPP | contagem absoluta (estoque ativo) |

**Métrica:** contagem absoluta de **estabelecimentos** no ano-ref (último ano civil completo).
O breakdown de abertos/extintos traz o split MEI/ME/EPP, o ano anterior e a variação % a.a.
`empresas-ativas` é estoque (todos os portes) no snapshot da base. O **`crescimento-mpe`** é a
variação % a.a. desse mesmo fluxo de aberturas — seu `numericValue` é idêntico à variação que o
`negocios-abertos` já guarda no breakdown; a `serieAnual` do breakdown roda `2016..ano-ref`
(`ANO_MIN_SERIE=2016`), sem ano corrente parcial (o vintage da coleção = ano-ref). **Todos sem
`threshold`** (contagem/variação bruta, sem faixa oficial — não inventamos cortes, como em
trabalhadores-*/mpe-compras).

**Por que precisa de join:** o ESTABELECIMENTOS tem município/situação/data, mas **não tem o
porte** (que é da EMPRESA). O porte vem de `RF_EMPRESAS_<ano>` por `$in` no `CNPJ_BASICO` (índice
`idx_cnpj`), e o MEI de `RF_SIMPLES_<ano>` (`OPCAO_MEI`) — tudo no mesmo servidor, sem BigQuery.
Ano-alinhado (estab × empresas × simples do mesmo ano).

**Fluxo (uma rodada):** 3 agregações no estabelecimentos (**ativas por município×CNPJ** — para o
total e o split de porte do estoque; **aberturas por município×CNPJ×ano na janela `2016..ano-ref`** —
larga o bastante para a série do crescimento-mpe; baixas por município×CNPJ×ano, ano-ref + anterior) →
resolve porte dos CNPJs envolvidos na RF (aberturas + baixas + **estoque ativo**) → agrega aos 223 →
emite os **8 seeds** + snapshot (`database/data/negocios_rfb_lake_pb.json`, só os agregados por
município; guarda `ativas`, `ativasPorPorte`, `abertos`, `extintos`). O `negocios-abertos` e o
`crescimento-mpe` leem o **mesmo agregado de aberturas**; os cards da base econômica leem `ativas`
(total) e `ativasPorPorte` (MEI/ME/EPP). `--offline` regenera os seeds (menos `meis`/`mes`/`epps`, que
precisam do `ativasPorPorte`); `--write-mongo` faz upsert no `DadosOPP`. Calibração: `--inspect`
(estabelecimentos) e `--inspect-rfb` (porte/MEI). Ver `RUNBOOK_ETL.md §9`.

> **Custo do join de porte.** A janela larga de aberturas (2016..ref) não muda o COLLSCAN (varre 37,6M
> docs de qualquer jeito), só aumenta os CNPJs distintos das aberturas. O peso maior agora é o **estoque
> ativo**: resolver o porte de ~todos os CNPJs ativos da PB (centenas de milhares) — via índice
> `idx_cnpj` em lotes, aceitável numa rodada única. ⚠️ Por isso `meis`/`mes`/`epps` (e a `serieAnual`
> completa) **só saem no run online**; `--offline` gera os outros 5 seeds e avisa o que pulou.

> ✅ **Coletado (jun/2026, RF_ESTABELECIMENTOS_2025):** rodada completa na 10.1.141.23,
> **223/223 municípios**, **669 valores** (223 × 3) gravados no `DadosOPP`. Totais PB: **192.461**
> estabelecimentos ativos (todos os portes), **36.904** pequenos negócios abertos e **20.184**
> baixados em 2025. Exemplos: João Pessoa (ativas 70.864 · abertos 15.184 · extintos 7.860),
> Campina Grande (26.911 · 5.461 · 3.083). Coleção `RF_ESTABELECIMENTOS_2025` = ~37,6M docs; campo
> `rfCode` em `municipalities` fez a tradução código RFB → IBGE. Snapshot + 3 seeds versionados.
>
> ✅ **Consolidação do `crescimento-mpe` (jul/2026) — rerun online feito.** Rodada na 10.1.141.23
> em 03/jul/2026 regenerou o snapshot com a **série anual completa 2016..2025** (PB: 13.111 aberturas
> de MPE em 2016 → 36.904 em 2025) e o 4º seed (`indicador-crescimento-mpe.mongodb.js`) com a
> `serieAnual` cheia no breakdown. Crescimento MPE PB 2025 vs 2024 = **+19,9%**; JP +19,1% (idêntico à
> variação do `negocios-abertos`, `aberturasRef=15184`). Os 3 seeds de contagem
> (abertos/ativas/extintos) saíram **idênticos** aos de jun/2026 — números de 2025 estáveis/reproduzíveis.
> ✅ A rodada **incluiu `--write-mongo`**: o `DadosOPP` tem os **892 valores** (223 × 4), com o
> `crescimento-mpe` do lake substituindo o valor antigo do Observatório.
>
> ✅ **Base econômica por porte (jul/2026) — coletado.** Run online na 10.1.141.23 (03/jul/2026,
> `--write-mongo`) gerou os 4 cards da base econômica (`empresas-ativas-total` + `meis`/`mes`/`epps`) do
> estoque ativo. Join de porte resolveu **313.725/313.725 CNPJs** ativos (`porteDesconhecido=0`). Totais
> PB 2025: **MEI 97.160 · ME 61.354 · EPP 8.379** (166.893 pequenos) + 25.568 médio/grande = **192.461**
> ativos. Ex. João Pessoa: MEI 33.862 · ME 24.175 · EPP 3.736 · médio/grande 9.091 (total 70.864). A
> rodada completa emitiu **8 seeds** e gravou **1.784 valores** (223 × 8) no `DadosOPP` (892 upserted +
> 892 modified); o snapshot passou a guardar `ativasPorPorte`.
>
> > Nota: o 1º `--inspect` (filtro provisório por prefixo do `MUNICIPIO`) reportou situação
> > '2'=328.703 / '8'=395.381 e aberturas 2025=71.959 — eram de **outro estado** (o prefixo do
> > código RFB não corresponde à UF). Os números corretos da PB vêm do recorte por `UF=='PB'` acima.

---

## 15. API pública do IDSC (Instituto Cidades Sustentáveis)

O **IDSC-BR** (Índice de Desenvolvimento Sustentável das Cidades) **não está na Base
dos Dados**, mas o mapa oficial (`idsc.cidadessustentaveis.org.br/map`) é um front
Next.js que consome uma **API REST pública, sem autenticação**:

```
Base: https://www.cidadessustentaveis.org.br/api/idsc-br/
```

> O servidor recusa requisições **sem `User-Agent` de navegador** (403). O gerador já
> manda um UA de Chrome.

**Endpoint usado no seed** (só a pontuação geral, que é o que entra no card do Panorama):

```
GET /buscarAllPerfilCidadePorSiglaEstado/PB
```

Retorna os **223 municípios da PB** com `pontuacao` (0–100), `classificacao` (ranking
nacional, ~5570 cidades) e `populacao`. **✅ Implementado** em
`scripts/gerar_seed_idsc.py` → seed `idsc`, edição **2025** (a corrente no mapa),
snapshot versionado em `data/idsc_pb_2025.json`, com modo `--offline`. Conferido contra
o mapa: João Pessoa **52,03** (rank 1972), Campina Grande **51,0** (rank 2400); faixa PB
37,87–55,90. **Sem `threshold`** — a metodologia do IDSC classifica a distância da meta
**por ODS** (verde/amarelo/laranja/vermelho), não o índice composto; não há faixa oficial
para o agregado, então não inventamos cortes (como em `trabalhadores-*`/`negocios-*`).

**Outros endpoints da mesma API** (não usados — coletamos só o score geral; ficam aqui
para aprofundar depois sem redescobrir):

| Endpoint | Retorna |
|---|---|
| `buscarInfoOdsPorCidade/{ibge}` | Os **17 ODS** da cidade (pontuação + label + descrição) |
| `buscarSeriePontuacaoIdscPorCidade/{ibge}` | **Série temporal**: edições 2015 / 2022 / 2023 / 2024 / 2025 |
| `buscarPerfilCidadePorCodigoIbge/{ibge}` | Perfil: score, classificação, população |
| `buscarAllPerfilCidadeDetalhes` | **Tudo** (5570 cidades + 17 ODS embutidos, ~95 MB) |
| `buscarLabelsOds` | Os 17 rótulos dos ODS |
| `buscarCidadesPorIndicador/…`, `buscarObservacaoesIndicadoresPorCidadeEOds?codigoIbge=…` | Nível dos **88 indicadores** subjacentes |

> O IDSC tem **5 edições** (2015, 2022, 2023, 2024, 2025); o mapa exibe a 2025. Se um dia
> quisermos evolução temporal ou o detalhe por ODS, é só trocar/agregar o endpoint no gerador.

---

## 16. Base `IBGE` do data lake (arquivo SIDRA histórico) — varredura jun/2026

O data lake do Sebrae **também expõe uma base `IBGE`** (usuário `usr_IBGE`; note: o usuário
**não** tem `listCollections` na base `usr_IBGE`, mas **tem** na base real, que se chama
`IBGE`). Varrida em jun/2026 com `database/scripts/inspecionar_ibge_lake.py` (inventário →
`data/ibge_lake_inventario.tsv`; detalhe por tabela → `data/ibge_lake_detalhe.txt`).

**O que é:** um dump de **2.302 tabelas do SIDRA/IBGE**, **uma coleção por tabela** (nome =
nº da tabela SIDRA, ex. `21`, `155`, `1685` + algumas nomeadas, ex. `AREA_MUNICIPIOS_KM`).
Schema SIDRA uniforme: `VARIAVEL` (o que é medido) · `VALOR` · `ANO`/`CD_ANO` ·
`MUNICIPIO`/`CD_MUNICIPIO` · `UNIDADE_DE_MEDIDA` + dimensões de classificação. **Não há campo
`UF`** → o recorte PB é por `MUNICIPIO` terminando em `(PB)` (ou `CD_MUNICIPIO` prefixo `25`).

**Veredito — nenhum indicador pendente do mapeamento é desbloqueado por esta base.** É um
**arquivo histórico** (Censo 1991/2000/2010, Censo Agropecuário 2006, MUNIC/saneamento
2000/2008, POF 1987/2008, PIB municipal 2008–2012) + **CEMPRE 2016–2021**. Detalhe dos
candidatos da base econômica:

| Card pendente (hoje não-lake) | Está na base IBGE? | Achado |
|---|---|---|
| **PIB per capita** (card quer 2021) | ⚠️ só **2008–2012** | Coleção `21` tem PIB total + per capita + VAB por setor, mas **congelada em 2008–2012**; a tabela moderna (SIDRA 5938, 2021) **não está** no dump. Além disso o recorte município de `21` **não casa** por `(PB)$` (naming próprio → PB: 0 docs). Fica na **BD** (`pib`) |
| **GINI** (card quer 2010) | ⚠️ só **1991** | Coleção `155` = "Índice de Gini da renda dos responsáveis" (Censo **1991**, 171/223 PB); `379` = Gini POF 1987/1995. Não há 2010. Fica na **BD** (censo/adh) |
| **IDH-M** | ❌ ausente | zero ocorrências de "desenvolvimento humano"/IDH — é do **Atlas**, não SIDRA. Fica na **BD** (`adh`) |
| **Remuneração média** (card quer 2024) | ⚠️ CEMPRE ≤2021 | Coleção `1685` (CEMPRE, **2016–2021**, **223/223 PB**) tem `Salário médio mensal em reais`, `Pessoal ocupado total/assalariado`, `Salários e outras remunerações`. Mas é **superada** pela RAIS do lake (2024, §1/§13) |
| População / renda domiciliar | ✅ censitário | fartas tabelas de "População residente" (Censo 1991/2000/2010) e rendimento domiciliar (`1428` 2010 — mas só 5 munis PB; outras por município). Serve como **contexto**, não é card atual |
| Empresas ativas | já via RF lake | CEMPRE (`993`/`1685`, "empresas atuantes" 2016–2021) existe, mas usamos a **RF do lake** (2025, §14), mais atual |

> **Por que não migrar nada:** as lacunas modernas da base econômica (PIB per capita 2021,
> Gini 2010, IDH-M) estão **ausentes ou congeladas em vintages antigos** aqui; e o que a base
> tem de recente (CEMPRE 2016–2021) já é coberto — e mais atual — pela **RF (2025)** e pela
> **RAIS (2024)** que o lake já ingere (§13/§14). Coerente com o princípio "fonte primária,
> vintage corrente". A base fica como **arquivo de consulta** (séries censitárias de
> renda/população como contexto; CEMPRE como eventual fallback IBGE de remuneração).

---

## Legenda

- ✅ — Cobertura direta por uma das fontes
- 🟡 — Cobertura parcial (precisa derivar / complementar)
- ❌ — Sem fonte aberta nos MCPs/APIs avaliados
- **BD** = `basedosdados` · **MB** = `mcp-brasil` · **AQ** = API IGMA Áquila · **SL** = data lake do Sebrae (acesso direto, §13) · **ICS** = API pública do Instituto Cidades Sustentáveis (IDSC, §15)
