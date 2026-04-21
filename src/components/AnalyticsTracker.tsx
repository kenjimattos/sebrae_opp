// Componente invisível que lida com o ciclo de vida do analytics (Clarity):
//
// 1. No bootstrap: se o usuário já deu consentimento anteriormente, inicializa
//    Clarity automaticamente.
// 2. Se a URL tem `?participante=XX`, identifica a sessão (útil para testes
//    moderados em que cada máquina abre com um ID de participante).
// 3. Dispara `pagina_visitada` a cada mudança de rota (complementa a detecção
//    automática do Clarity com uma prop `rota` fácil de filtrar).

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getStoredConsent,
  identifySession,
  initAnalytics,
  trackEvent,
} from '@/utils/analytics'

export default function AnalyticsTracker() {
  const { pathname } = useLocation()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (getStoredConsent() === 'granted') {
      initAnalytics()
    }
    const params = new URLSearchParams(window.location.search)
    const participante = params.get('participante')
    if (participante) identifySession(participante)
  }, [])

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    trackEvent('pagina_visitada', { rota: pathname })
  }, [pathname])

  return null
}
