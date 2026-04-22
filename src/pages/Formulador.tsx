// Página do Formulador — layout 3 colunas (sidebar esquerda / form central / sidebar direita).
// Header global + hero (título + descrição) + FormuladorProgress + grid + Footer.

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FormuladorProgress from '@/components/formulador/FormuladorProgress'
import { sectionContent } from '@/data/home/sections'
import { useFormulador } from '@/hooks/useFormulador'
import { etapasFormulador } from '@/data/formulador/etapas'
import { useLocation } from 'react-router-dom'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import { countEtapasCompletas } from '@/utils/formuladorCompleteness'
import { trackEvent } from '@/utils/analytics'

function currentIndexFromPath(pathname: string): number {
  const parts = pathname.split('/').filter(Boolean)
  const slug = parts[1] ?? ''
  if (slug === 'conclusao') return etapasFormulador.length
  const idx = etapasFormulador.findIndex((e) => e.slug === slug)
  return idx === -1 ? 0 : idx
}

export default function Formulador() {
  const { state } = useFormulador()
  const { pathname } = useLocation()
  const currentIndex = currentIndexFromPath(pathname)

  const percent = Math.min(
    100,
    (countEtapasCompletas(state) / etapasFormulador.length) * 100,
  )

  // Evento único por sessão de Formulador: dispara no primeiro mount e não
  // é re-emitido se o usuário navegar entre steps (Outlet muda sem remount
  // do parent).
  useEffect(() => {
    trackEvent('formulador_iniciado')
  }, [])

  // Captura abandono por fechar aba / navegar pra fora do domínio. Saídas via
  // header/logo já são rastreadas no próprio Header.
  useEffect(() => {
    function onBeforeUnload() {
      if (!window.location.pathname.startsWith('/formulador')) return
      if (window.location.pathname.includes('/conclusao')) return
      const slug = window.location.pathname.split('/')[2] ?? ''
      trackEvent('formulador_abandonado', {
        ultimo_step: slug,
        via: 'unload',
      })
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return (
    <main className="min-h-screen bg-primary">
      <Header />
      <section className="mx-auto w-full max-w-[1440px] flex flex-col gap-xl py-2xl px-2xl">
        <TitleSubtitle title={sectionContent.formuladorPagina.title} subtitle={sectionContent.formuladorPagina.description} />
        <section className="flex flex-col items-start gap-sm">
          <FormuladorProgress currentIndex={currentIndex} percent={percent} />
          <Outlet />
        </section>
      </section>
      <Footer />
    </main>
  )
}
