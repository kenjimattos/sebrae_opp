// Página do Formulador — layout 3 colunas (sidebar esquerda / form central / sidebar direita).
// Header global + hero (título + descrição) + FormuladorProgress + grid + Footer.

import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FormuladorProgress from '@/components/formulador/FormuladorProgress'
import { sectionContent } from '@/data/sections'
import { useFormulador } from '@/hooks/useFormulador'
import { etapasFormulador } from '@/data/formulador-etapas'
import { useLocation } from 'react-router-dom'
import TitleSubtitle from '@/components/ui/TitleSubtitle'

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
    (state.etapasVisitadas.length / etapasFormulador.length) * 100,
  )

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
