// Casca compartilhada por todas as páginas top-level: <main> como landmark ÚNICO
// do documento, envolvendo o <Outlet/>.
// Registrada como layout route em App.tsx; as páginas retornam só o conteúdo.

import { Outlet, useLocation } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'
import SiteHeader from '@/components/layout/SiteHeader'

export default function Layout() {
  const { pathname } = useLocation()
  const isLogin = pathname === '/'

  return (
    // `relative`: ancora o marcador de rolagem do SiteHeader no topo do documento.
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* No login não há header: o hero já traz a marca em 270px no meio da
          tela, e o seletor de município só vale para a Home. O tema segue
          solto no canto, fixo no mesmo eixo do ChatButton (right-[62px]).
          Instância única de ThemeToggle em qualquer rota — useTheme é estado
          local, e dois montados teriam preferências independentes. */}
      {isLogin ? (
        <div className="fixed top-lg right-[62px] z-40 glass glass-bevel rounded-full p-2xs">
          <ThemeToggle />
        </div>
      ) : (
        <SiteHeader showCitySelector={pathname === '/home'} />
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
