// ARQUIVO GERADO por database/scripts/gerar_seed_uf_matriculas_superior.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db


// --- 1) Catálogo: uf-matriculas-superior (seção estadual) ---
const indicators = [
  {"_id": "uf-matriculas-superior", "label": "Matrículas no ensino superior", "referenceYear": "2024", "unit": "matrículas", "description": "Matrículas em cursos de graduação na Paraíba, segundo o Censo da Educação Superior do INEP. Inclui a rede pública e a privada.", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "sourceDataset": "inep_censo_superior_observatorio_sebrae", "placements": [{"section": "estadual", "order": 7}]},
]
database.indicators.bulkWrite(indicators.map(i => ({ replaceOne: {
  filter: { _id: i._id }, replacement: i, upsert: true,
} })), { ordered: false })
print(`indicators(estadual) -> ok (${indicators.length} docs)`)

// --- 2) Valores por UF × ano (7 docs) ---
// Censo da Educacao SUPERIOR (cubo INEP_censo) — nao confundir com INEP_Censo_Ed_Basica,
// que tem uma medida Enrollments com o mesmo nome e outra ordem de grandeza.
// A posicao e per capita: contagem bruta entre UFs mede o tamanho do estado.
const values = [
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "156.876", "numericValue": 156876, "referenceYear": "2018", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": {"entreUfs": 18, "totalUfs": 27, "entreNordeste": 2, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 39.25, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "163.351", "numericValue": 163351, "referenceYear": "2019", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": {"entreUfs": 16, "totalUfs": 27, "entreNordeste": 2, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 40.65, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": 4.13, "previousValue": 156876, "previousYear": "2018", "basis": "yoy"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "157.694", "numericValue": 157694, "referenceYear": "2020", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": {"entreUfs": 17, "totalUfs": 27, "entreNordeste": 2, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 39.04, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": -3.46, "previousValue": 163351, "previousYear": "2019", "basis": "yoy"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "163.353", "numericValue": 163353, "referenceYear": "2021", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": {"entreUfs": 17, "totalUfs": 27, "entreNordeste": 1, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 40.24, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": 3.59, "previousValue": 157694, "previousYear": "2020", "basis": "yoy"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "169.437", "numericValue": 169437, "referenceYear": "2022", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": null, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": 3.72, "previousValue": 163353, "previousYear": "2021", "basis": "yoy"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "180.896", "numericValue": 180896, "referenceYear": "2023", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": null, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": 6.76, "previousValue": 169437, "previousYear": "2022", "basis": "yoy"}},
  {"uf": "25", "indicatorId": "uf-matriculas-superior", "rawValue": "188.630", "numericValue": 188630, "referenceYear": "2024", "source": "INEP — Censo da Educação Superior (cubo INEP_censo), via API Tesseract pública do Observatório Setorial Territorial do Sebrae (observatorio.sebrae.com.br)", "isFictional": false, "breakdown": {"posicao": {"entreUfs": 14, "totalUfs": 27, "entreNordeste": 1, "totalNordeste": 9, "normalizado": true, "valorNormalizado": 45.51, "unidadeNormalizada": "/1k hab.", "nota": "posicao e comparacao entre pares, nao classificacao — estes indicadores nao tem threshold"}, "cubo": "INEP_censo = Censo da Educacao SUPERIOR (nao confundir com INEP_Censo_Ed_Basica)"}, "variation": {"deltaPct": 4.28, "previousValue": 180896, "previousYear": "2023", "basis": "yoy"}},
]
const now = new Date()
const ops = values.map(v => ({ updateOne: {
  filter: { uf: v.uf, indicatorId: v.indicatorId, referenceYear: v.referenceYear },
  update: { $set: Object.assign({}, v, { updatedAt: now }) },
  upsert: true,
} }))
const res = database.stateValues.bulkWrite(ops, { ordered: false })
print(`stateValues -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)
