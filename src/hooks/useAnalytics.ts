import { createContext, useContext } from 'react'
import type { ConsentChoice } from '@/analytics/consent'

export interface AnalyticsContextType {
  /** Há projeto do Clarity no build e usuário logado. Sem os dois não se pergunta nada. */
  available: boolean
  /** `null` = ainda não respondeu (o banner aparece). */
  choice: ConsentChoice | null
  grant: () => void
  /** Recusa ou revoga. Revogar depois de um "sim" recarrega a página. */
  deny: () => void
}

export const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}
