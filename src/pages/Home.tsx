import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionPanorama from '@/components/sections/SectionPanorama'
import SectionBaseEconomica from '@/components/sections/SectionBaseEconomica'
import SectionRiscos from '@/components/sections/SectionRiscos'
import SectionRecursos from '@/components/sections/SectionRecursos'
import SectionCapacitacao from '@/components/sections/SectionCapacitacao'
import SectionCasosSucesso from '@/components/sections/SectionCasosSucesso'
import SectionFormulador from '@/components/sections/SectionFormulador'
import SectionAIAssistant from '@/components/sections/SectionAIAssistant'
import { useMunicipio } from '@/hooks/useMunicipio'

export default function Home() {
  const { municipio } = useMunicipio()
  const dados = municipio.dados

  return (
    <div className="min-h-screen bg-[var(--semantic-background-primary)]">
      <Header municipio={municipio.nome} />

      <main className="mx-auto w-full max-w-[1440px] flex flex-col gap-[var(--spacing-2xl)] py-[var(--spacing-3xl)]">
        {dados && (
          <>
            <SectionAgendas agendas={dados.agendas} />
            <SectionPanorama />
            <SectionBaseEconomica dados={dados.baseEconomica} />
            <SectionRiscos agendas={dados.agendas} />
          </>
        )}
        <SectionRecursos />
        <SectionCapacitacao />
        <SectionCasosSucesso />
        <SectionFormulador />
        {/* Hidden for now, may be used in the future */}
        {/* <SectionAIAssistant /> */}
      </main>

      <Footer />
    </div>
  )
}
