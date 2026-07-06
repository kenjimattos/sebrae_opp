// Migração 1x — renomeia o indicador `mpe-eli-sebrae` → `crescimento-mpe`.
//
// Contexto: o id `mpe-eli-sebrae` prometia "MPE nos ELI (Ecossistemas Locais de
// Inovação)", mas o dado é um PROXY de crescimento de MPE formalizadas no
// município (o recorte ELI é interno do Sebrae, sem fonte aberta). O id foi
// renomeado para `crescimento-mpe` para casar com a realidade do dado (jul/2026).
//
// Como o `_id` do Mongo é imutável, o doc de indicador é recriado com o novo id;
// os 223 valores têm `indicatorId` reapontado. Idempotente (rodar de novo não faz
// nada). Só mexe neste indicador — nenhum outro dado é tocado.
//
// PRÉ-REQUISITO: rode ANTES o `setup.mongodb.js` atualizado. Alternativa a esta
// migração: apagar os docs antigos e re-aplicar o seed já renomeado
// (`aplicar_seeds.sh indicador-crescimento-mpe`) — mas a migração preserva os
// valores já carregados sem depender de re-coleta.

// Para mirar um banco com nome fixo, troque por: const database = db.getSiblingDB('opp')
const database = db

const OLD = 'mpe-eli-sebrae'
const NEW = 'crescimento-mpe'

// 1) Indicador: renomeia o _id (imutável → copia doc + apaga o antigo).
const oldDoc = database.indicators.findOne({ _id: OLD })
const newExists = database.indicators.countDocuments({ _id: NEW }) > 0
if (oldDoc && !newExists) {
  oldDoc._id = NEW
  database.indicators.insertOne(oldDoc)
  database.indicators.deleteOne({ _id: OLD })
  print(`indicador: ${OLD} → ${NEW} (doc recriado, antigo removido)`)
} else if (oldDoc && newExists) {
  database.indicators.deleteOne({ _id: OLD })
  print(`indicador: ${NEW} já existia; doc antigo ${OLD} removido`)
} else {
  print(`indicador: já está como ${NEW} (nada a fazer)`)
}

// 2) Valores: reaponta indicatorId OLD → NEW. Trata colisão com a chave única
//    { municipalityId, indicatorId, referenceYear } caso os valores NEW já
//    existam (ex.: seed novo já aplicado).
const antesOld = database.indicatorValues.countDocuments({ indicatorId: OLD })
const jaNew = database.indicatorValues.countDocuments({ indicatorId: NEW })
if (jaNew > 0) {
  const del = database.indicatorValues.deleteMany({ indicatorId: OLD })
  print(`valores: ${NEW} já existem (${jaNew}); removidos ${del.deletedCount} valores ${OLD} para não duplicar`)
} else {
  const res = database.indicatorValues.updateMany(
    { indicatorId: OLD },
    { $set: { indicatorId: NEW } },
  )
  print(`valores: reapontados ${OLD} → ${NEW}: ${res.modifiedCount}`)
}

// 3) Verificação final.
const restamOld =
  database.indicators.countDocuments({ _id: OLD }) +
  database.indicatorValues.countDocuments({ indicatorId: OLD })
const totalNew = database.indicatorValues.countDocuments({ indicatorId: NEW })
print('--- migração mpe-eli-sebrae → crescimento-mpe ---')
print(`valores ${OLD} ANTES: ${antesOld}`)
print(`resíduos ${OLD} (indicador+valores) DEPOIS: ${restamOld}   (esperado 0)`)
print(`valores ${NEW} DEPOIS: ${totalNew}   (esperado 223)`)
