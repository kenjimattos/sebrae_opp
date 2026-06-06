// Página do Formulador — layout 3 colunas (sidebar esquerda / form central / sidebar direita).
// Header global + hero (título + descrição) + FormulatorProgress + grid + Footer.

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import FormulatorProgress from '@/components/formulator/FormulatorProgress'
import { sectionContent } from '@/data/home/sections'
import { useFormulator } from '@/hooks/useFormulator'
import { formulatorSteps } from '@/data/formulator/steps'
import { useLocation } from 'react-router-dom'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import { countCompletedSteps } from '@/utils/formulatorCompleteness'
import { trackEvent } from '@/utils/analytics'

function currentIndexFromPath(pathname: string): number {
  const parts = pathname.split('/').filter(Boolean)
  const slug = parts[1] ?? ''
  if (slug === 'conclusao') return formulatorSteps.length
  const idx = formulatorSteps.findIndex((e) => e.slug === slug)
  return idx === -1 ? 0 : idx
}

export default function Formulator() {
  const { state } = useFormulator()
  const { pathname } = useLocation()
  const currentIndex = currentIndexFromPath(pathname)

  const percent = Math.min(
    100,
    (countCompletedSteps(state) / formulatorSteps.length) * 100,
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
    <div className="container">
      <section className="section-container">
        <TitleSubtitle title={sectionContent.formulatorPage.title} subtitle={sectionContent.formulatorPage.description} />
        <section className="flex flex-col items-start gap-sm">
          <FormulatorProgress currentIndex={currentIndex} percent={percent} />
          <Outlet />
        </section>
      </section>
    </div>
  )
}
