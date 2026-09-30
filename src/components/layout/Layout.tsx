// Casca compartilhada por todas as páginas top-level: <main> como landmark ÚNICO
// do documento, envolvendo o <Outlet/>.
// Registrada como layout route em App.tsx; as páginas retornam só o conteúdo.

import { Link, Outlet, useLocation } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'
import PippaWordmark from '../brand/PippaWordmark'

export default function Layout() {
  const { pathname } = useLocation()

  // O Login já abre com o logotipo em 270px no meio da tela: repetir a marca
  // no canto seria dizer o nome duas vezes na mesma dobra.
  const showWordmark = pathname !== '/'

  // Rolar ao topo no clique. `ScrollToTop` só reage a *mudança* de rota, então
  // ele não cobre o caso de clicar no logotipo já estando em /home: o pathname
  // não muda, o efeito não roda e a página fica onde estava.
  function scrollToTop() {
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, left: 0, behavior: reduzMovimento ? 'auto' : 'smooth' })
  }

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
      {/* A marca é também o caminho de volta. <Link> e não onClick no <svg>:
          só o link recebe foco de teclado, responde a Enter, abre em nova aba
          e é anunciado como controle. O logotipo vira decorativo porque o link
          já se nomeia — senão o leitor de tela diria "PIPPA" duas vezes. */}
      {showWordmark && (
        <Link
          to="/home"
          onClick={scrollToTop}
          aria-label="PIPPA — página inicial"
          className="wordmark-link fixed top-lg left-[62px] z-40 text-primary hover:text-accent transition-colors rounded-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <PippaWordmark className="block h-auto w-[80px]" decorative />
        </Link>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
