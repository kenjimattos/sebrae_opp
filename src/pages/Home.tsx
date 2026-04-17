import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionHero from '@/components/sections/SectionHero'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionPanorama from '@/components/sections/SectionPanorama'
import SectionBaseEconomica from '@/components/sections/SectionBaseEconomica'
import SectionRiscos from '@/components/sections/SectionRiscos'
import SectionRecursos from '@/components/sections/SectionRecursos'
import SectionCapacitacao from '@/components/sections/SectionCapacitacao'
import SectionCasosSucesso from '@/components/sections/SectionCasosSucesso'
import SectionFormulador from '@/components/sections/SectionFormulador'
// import SectionAIAssistant from '@/components/sections/SectionAIAssistant'
import { useMunicipio } from '@/hooks/useMunicipio'

export default function Home() {
  const { municipio } = useMunicipio()
  const dados = municipio.dados

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] flex flex-col gap-2xl pb-3xl">
        <div id="hero">
          <SectionHero />
        </div>
        {dados && (
          <>
            <div id="agendas">
              <SectionAgendas agendas={dados.agendas} />
            </div>
            <div id="panorama">
              <SectionPanorama />
            </div>
            <div id="base-economica">
              <SectionBaseEconomica dados={dados.baseEconomica} />
            </div>
            <div id="riscos">
              <SectionRiscos agendas={dados.agendas} />
            </div>
          </>
        )}
        <div id="recursos">
          <SectionRecursos />
        </div>
        <div id="capacitacao">
          <SectionCapacitacao />
        </div>
        <div id="casos-sucesso">
          <SectionCasosSucesso />
        </div>
        <div id="formulador">
          <SectionFormulador />
        </div>
        {/* Hidden for now, may be used in the future */}
        {/* <SectionAIAssistant /> */}
      </main>

      <Footer />
    </div>
  )
}
