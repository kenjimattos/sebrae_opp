// Contrato de /api/terms/acceptance. Espelho de server/src/types/api.ts.
export interface TermsAcceptance {
  /** Versão vigente dos termos (não a que o usuário aceitou). */
  version: string
  /** O usuário logado já aceitou a versão vigente. */
  accepted: boolean
}
