// Casca compartilhada por todas as páginas top-level: <main> como landmark ÚNICO
// do documento, envolvendo o <Outlet/>.
// Registrada como layout route em App.tsx; as páginas retornam só o conteúdo.

import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
