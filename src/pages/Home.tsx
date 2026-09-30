import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionJornada from '@/components/sections/SectionJornada'
import SectionErrorBoundary from '@/components/ui/SectionErrorBoundary'
import JourneyDivider from '@/components/ui/JourneyDivider'
import ChatButton from '@/components/chat/ChatButton'
import { useMunicipality } from '@/hooks/useMunicipality'

export default function Home() {
  const { municipality } = useMunicipality()
  const { hash } = useLocation()
  const data = municipality.data

  // Navegação por hash (`/home#ambiente`). O desconto do header sticky vem do
  // scroll-padding-top do <html>, não de um offset aqui.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="container flex flex-col gap-sm">
      <div id="agenda">
        <SectionErrorBoundary name="agendas">
          <SectionAgendas />
        </SectionErrorBoundary>
      </div>
      {data ? (
        <>
          <JourneyDivider targetId="ambiente" />
          <div id="ambiente">
            <SectionErrorBoundary name="jornada">
              <SectionJornada />
            </SectionErrorBoundary>
          </div>
        </>
      ) : ''}
      {/* Chat global de IA — só faz sentido com município selecionado. */}
      {data && <ChatButton />}
    </div>
  )
}
