// ARQUIVO GERADO por database/scripts/gerar_seed_idh_m.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db


// Estrutura das 6 agendas da OPP (catálogo).
const agendas = [
  {"_id": "governanca", "name": "Governança: Parcerias público, privada, social para o desenvolvimento local", "order": 0},
  {"_id": "simplificacao", "name": "Serviços públicos mais simples e digitais para os pequenos negócios", "order": 1},
  {"_id": "inovacao", "name": "Ecossistemas de Inovação: Inclusão e digitalização para Pequenos Negócios", "order": 2},
  {"_id": "educacao", "name": "Educação empreendedora", "order": 3},
  {"_id": "credito", "name": "Acesso a crédito e viabilização financeira", "order": 4},
  {"_id": "inclusao", "name": "Iniciativas para gerar trabalho e renda para os pequenos negócios", "order": 5},
]

const ops = agendas.map(a => ({ updateOne: {
  filter: { _id: a._id },
  update: { $set: { name: a.name, order: a.order } },
  upsert: true,
} }))
const res = database.agendas.bulkWrite(ops, { ordered: false })
print(`agendas -> upserted=${res.upsertedCount} modified=${res.modifiedCount} matched=${res.matchedCount}`)
