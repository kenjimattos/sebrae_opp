import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SectionAgendas from '@/components/sections/SectionAgendas'
import SectionJornada from '@/components/sections/SectionJornada'
import SectionErrorBoundary from '@/components/ui/SectionErrorBoundary'
import JourneyDivider from '@/components/ui/JourneyDivider'
import ChatButton from '@/components/chat/ChatButton'
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
    <div className="container flex flex-col gap-lg">
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
