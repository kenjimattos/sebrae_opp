import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Guarda de rota: só deixa passar quem está logado no AMEI. Sem login, manda ao
// AMEI e o retorno cai de volta na mesma URL. É layout route (renderiza <Outlet/>),
// então envolve várias rotas de uma vez em App.tsx.
//
// A guarda do cliente é conveniência de UX: quem protege os dados é o servidor,
// que recusa qualquer /api sem token válido.
export default function RequireAuth() {
  const { ready, isLoggedIn, login } = useAuth()
  const { pathname, search } = useLocation()
  // StrictMode roda o efeito duas vezes em dev; um redirecionamento só basta.
  const redirected = useRef(false)

  useEffect(() => {
    if (!ready || isLoggedIn || redirected.current) return
    redirected.current = true
    login(`${pathname}${search}`)
  }, [ready, isLoggedIn, login, pathname, search])

  if (!ready || !isLoggedIn) return null
  return <Outlet />
}
