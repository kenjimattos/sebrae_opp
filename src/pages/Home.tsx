import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionPanorama from '@/components/sections/SectionPanorama'
import SectionEconomicBase from '@/components/sections/SectionEconomicBase'
import SectionRisks from '@/components/sections/SectionRisks'
import SectionResources from '@/components/sections/SectionResources'
import SectionTraining from '@/components/sections/SectionTraining'
import SectionCaseStudies from '@/components/sections/SectionCaseStudies'
import SectionFormulator from '@/components/sections/SectionFormulator'
// import SectionAIAssistant from '@/components/sections/SectionAIAssistant'
import { useMunicipality } from '@/hooks/useMunicipality'

const HEADER_OFFSET = 95

export default function Home() {
  const { municipality } = useMunicipality()
  const { hash } = useLocation()
  const data = municipality.data

  // Suporta navegação por hash (`/#agendas`) — usada quando o usuário sai do
  // Formulador clicando num link do Header. Scroll respeita o offset do
  // header sticky.
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, [hash])

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] flex flex-col gap-2xl pb-3xl">
        {data && (
          <>
            <div id="agenda">
              <SectionAgendas />
            </div>
            <div id="panorama">
              <SectionPanorama />
            </div>
            <div id="base-economica">
              <SectionEconomicBase items={data.economicBase} />
            </div>
            <div id="riscos">
              <SectionRisks agendas={data.agendas} />
            </div>
          </>
        )}
        <div id="recursos">
          <SectionResources />
        </div>
        <div id="capacitacao">
          <SectionTraining />
        </div>
        <div id="casos-sucesso">
          <SectionCaseStudies />
        </div>
        <div id="formulador">
          <SectionFormulator />
        </div>
        {/* Hidden for now, may be used in the future */}
        {/* <SectionAIAssistant /> */}
      </main>

      <Footer />
    </div>
  )
}
