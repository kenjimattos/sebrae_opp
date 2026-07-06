// Migração 1x — remove o `updatedAt` string-ano LEGADO dos docs de indicador.
//
// Contexto: na coleção `indicators`, o campo `updatedAt` guardava, na verdade, o
// ANO de referência exibido (string, ex: "2010") — não uma data. Ele foi
// renomeado para `referenceYear` no schema (setup.mongodb.js) e nos seeds. Como
// o upsert dos seeds usa `$set`, o `updatedAt` antigo NÃO é removido sozinho —
// esta migração o apaga.
//
// PRÉ-REQUISITO: rode ANTES o `setup.mongodb.js` (valida o schema novo) e
// re-aplique os seeds (`scripts/aplicar_seeds.sh --all` ou os seeds no
// NoSQLBooster), para que os docs de indicador já tenham `referenceYear` + `unit`.
// Só então rode esta migração.
//
// SEGURANÇA: mexe SÓ na coleção `indicators`. NUNCA toca `indicatorValues.updatedAt`
// — esse é o Date de carga/atualização do registro e DEVE permanecer. Idempotente
// (rodar de novo não faz nada). Não altera nenhum dado de valor.

// Para mirar um banco com nome fixo, troque por: const database = db.getSiblingDB('opp')
const database = db

// 1) Sanidade: os docs de indicador já têm `referenceYear`? (senão, os seeds
//    ainda não foram re-aplicados — pare e re-rode setup + seeds antes.)
const semRefYear = database.indicators.countDocuments({ referenceYear: { $exists: false } })
if (semRefYear > 0) {
  print(`⚠  ${semRefYear} indicador(es) SEM referenceYear.`)
  print('   Re-rode setup.mongodb.js + os seeds ANTES desta migração e rode de novo.')
}

// 2) Remove o `updatedAt` string-ano legado — SÓ na coleção indicators.
const antes = database.indicators.countDocuments({ updatedAt: { $type: 'string' } })
const res = database.indicators.updateMany(
  { updatedAt: { $type: 'string' } },
  { $unset: { updatedAt: '' } },
)
const depois = database.indicators.countDocuments({ updatedAt: { $type: 'string' } })

// 3) Confirma que o updatedAt (Date) dos VALORES ficou intacto.
const valoresComDate = database.indicatorValues.countDocuments({ updatedAt: { $type: 'date' } })

print('--- migração indicators.updatedAt (string) → removido ---')
print(`indicators com updatedAt string  ANTES: ${antes}`)
print(`docs modificados:                       ${res.modifiedCount}`)
print(`indicators com updatedAt string DEPOIS: ${depois}   (esperado 0)`)
print(`indicatorValues com updatedAt (Date) preservados: ${valoresComDate}`)
