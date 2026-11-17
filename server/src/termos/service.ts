import { TERMS_VERSION } from '../../../src/data/terms/version.js'
import type { TermsAcceptance } from '../types/index.js'
import { hasAccepted, recordAcceptance } from './repo.js'

export async function acceptanceStatus(sub: string): Promise<TermsAcceptance> {
  return { version: TERMS_VERSION, accepted: await hasAccepted(sub, TERMS_VERSION) }
}

// Só a versão vigente pode ser aceita: o cliente manda a que ele mostrou, e uma
// aba velha (termos já atualizados) não pode gravar o aceite do texto antigo como
// se fosse do novo. Devolve false quando a versão não é a vigente.
export async function accept(sub: string, version: unknown): Promise<boolean> {
  if (version !== TERMS_VERSION) return false
  await recordAcceptance(sub, TERMS_VERSION)
  return true
}
