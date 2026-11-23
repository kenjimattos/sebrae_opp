import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clarityProjectId, loadClarity, revokeClarity } from '@/analytics/clarity'
import { readConsent, writeConsent, type ConsentChoice } from '@/analytics/consent'
import { AnalyticsContext, type AnalyticsContextType } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'

// Fica dentro do AuthProvider: o consentimento é por usuário (`sub`). O Clarity só
// carrega com as três coisas juntas — projeto configurado, usuário logado e "sim"
// gravado. Quem pergunta é o banner, montado pelo TermsGate depois do aceite.
export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const projectId = clarityProjectId()

  // Guarda de quem é a escolha: ao trocar de usuário, a do anterior não vale.
  const [stored, setStored] = useState<{ userId: string; choice: ConsentChoice | null } | null>(null)
  const choice =
    userId === null ? null : stored?.userId === userId ? stored.choice : readConsent(userId)

  useEffect(() => {
    if (projectId && userId && choice === 'granted') loadClarity(projectId, userId)
  }, [projectId, userId, choice])

  const decide = useCallback(
    (next: ConsentChoice) => {
      if (!userId) return
      const wasGranted = choice === 'granted'
      writeConsent(userId, next)
      setStored({ userId, choice: next })
      if (next === 'denied' && wasGranted) {
        // O script do Clarity não sai da página: apaga os cookies e recarrega.
        revokeClarity()
        window.location.reload()
      }
    },
    [userId, choice],
  )

  const value = useMemo<AnalyticsContextType>(
    () => ({
      // Sem usuário não há a quem perguntar nem onde gravar a resposta.
      available: projectId !== null && userId !== null,
      choice,
      grant: () => decide('granted'),
      deny: () => decide('denied'),
    }),
    [projectId, userId, choice, decide],
  )

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}
