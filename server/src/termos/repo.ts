import { getDb } from '../infra/db.js'

// Aceite dos termos de uso: o ÚNICO dado que esta API grava. Um documento por
// usuário (`sub` do AMEI) e versão; guarda quando, como prova para a LGPD. O
// resto do banco segue só leitura.
interface TermsAcceptanceDoc {
  sub: string
  version: string
  acceptedAt: Date
}

const COLLECTION = 'termsAcceptances'

const collection = () => getDb().collection<TermsAcceptanceDoc>(COLLECTION)

// Índice único (sub, version): dois cliques ou duas abas não geram dois aceites.
// Chamado no boot. Sem permissão de criar índice a API segue (o upsert abaixo já é
// idempotente por si; o índice só fecha a corrida entre dois pedidos simultâneos).
export async function ensureTermsIndex(): Promise<void> {
  await collection().createIndex({ sub: 1, version: 1 }, { unique: true })
}

export async function hasAccepted(sub: string, version: string): Promise<boolean> {
  return (await collection().countDocuments({ sub, version }, { limit: 1 })) > 0
}

// Idempotente: aceitar de novo mantém a data do primeiro aceite.
export async function recordAcceptance(sub: string, version: string): Promise<void> {
  try {
    await collection().updateOne(
      { sub, version },
      { $setOnInsert: { sub, version, acceptedAt: new Date() } },
      { upsert: true },
    )
  } catch (err) {
    // Dois pedidos simultâneos: o segundo bate no índice único (E11000). O aceite
    // já existe, que é o que se queria.
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) return
    throw err
  }
}
