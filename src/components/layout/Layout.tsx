// Casca compartilhada por todas as páginas top-level: faixa Header + <main>
// (landmark ÚNICO do documento, envolvendo o <Outlet/>).
// Registrada como layout route em App.tsx; as páginas retornam só o conteúdo.

import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
