// Casca compartilhada por todas as páginas top-level: <main> como landmark ÚNICO
// do documento, envolvendo o <Outlet/>.
// Registrada como layout route em App.tsx; as páginas retornam só o conteúdo.

import { Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Controle de tema no topo, fora do <main>: vale para o documento inteiro,
          não para a página. Antes morava no cabeçalho da SideNav — que só existe
          na segunda seção da Home, então trocar de tema exigia rolar, e em
          /trilhas e no login não havia como.

          Fixo no mesmo eixo vertical do ChatButton (right-[62px]): os dois
          controles globais e persistentes ocupam a mesma faixa à direita, um em
          cada extremidade. z-40 empata com o FAB e passa por cima da barra de
          eixos de /trilhas (z-20); o ChatPanel (z-50) continua cobrindo os dois.

          Não vira <header>: um elemento header aqui criaria um landmark `banner`
          e o <main> deixaria de ser o único do documento por causa de um botão.

          Instância única — useTheme é estado local, e dois consumidores montados
          teriam preferências independentes (ver o comentário em useTheme.ts). */}
      <div className="fixed top-lg right-[62px] z-40 glass glass-bevel rounded-full p-2xs">
        <ThemeToggle />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
