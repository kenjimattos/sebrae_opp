// ARQUIVO GERADO por database/scripts/gerar_seed_uf_empresas_ativas.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db


// --- 1) Catálogo: uf-empresas-ativas (seção estadual) ---
const indicators = [
  {"_id": "uf-empresas-ativas", "label": "Empresas ativas", "referenceYear": "2026", "unit": "estabelecimentos", "description": "Estabelecimentos com situação cadastral Ativa na Receita Federal, sediados na Paraíba. É um retrato do estoque na data da coleta, não um dado anual.", "source": "Receita Federal — base de Estabelecimentos (cubo RF), situação cadastral Ativa, via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "sourceDataset": "rfb_estabelecimentos_observatorio_sebrae", "placements": [{"section": "estadual", "order": 8}]},
]
database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {
  filter: { _id: i._id }, replacement: i, upsert: true,
} })), { ordered: false })
print(`indicators(estadual) -> ok (${indicators.length} docs)`)

// --- 2) Valores por UF × ano (1 docs) ---
// ESTOQUE sem dimensao de ano: referenceYear e o ano da COLETA e breakdown.coletadoEm
// guarda a data exata. Rodar em outro ano cria doc novo, mantendo o retrato antigo auditavel.
// Nao soma com o empresas-ativas municipal — aquele vem do data lake, com outra data de carga.
const values = [
  {"uf": "25", "indicatorId": "uf-empresas-ativas", "rawValue": "361.415", "numericValue": 361415, "referenceYear": "2026", "source": "Receita Federal — base de Estabelecimentos (cubo RF), situação cadastral Ativa, via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"porSituacaoCadastral": {"Baixada": 448657, "Ativa": 361415, "Inapta": 123684, "Suspensa": 1805, "Nula": 1518}, "coletadoEm": "2026-09-30", "anoPopulacaoNormalizacao": "2025", "referenceYearE": "ano da COLETA, nao vintage estatistico — o cubo RF nao tem dimensao de ano para o estoque", "comparacaoMunicipal": "nao soma com o empresas-ativas municipal (fonte = data lake, outra data de carga)", "posicao": {"entreUfs": 15, "totalUfs": 27, "entreNordeste": 2, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 86.79, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}}},
]
const now = new Date()
const ops = values.map(v => ({ updateOne: {
  filter: { uf: v.uf, indicatorId: v.indicatorId, referenceYear: v.referenceYear },
  update: { $set: Object.assign({}, v, { updatedAt: now }) },
  upsert: true,
} }))
const res = database.stateValues.bulkWrite(ops, { ordered: false })
print(`stateValues -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)
