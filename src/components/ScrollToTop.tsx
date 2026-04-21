// Reseta o scroll para o topo a cada mudança de rota.
// Mantido global dentro do <BrowserRouter> para normalizar o comportamento
// entre browsers/máquinas (history.scrollRestoration = 'auto' é inconsistente
// em SPAs). Rotas com hash (#...) são ignoradas para preservar scrollIntoView
// dos alvos (ex.: /trilhas#trilha-slug).

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash])

  return null
}
