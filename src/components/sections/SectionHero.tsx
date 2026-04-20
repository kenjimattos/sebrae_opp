// Tailwind pure — no Figma equivalent yet
// Hero: eyebrow + macro objetivo + 4 blocos 2×2 (Agenda / Recursos / Capacitação / Formulador)
// Cada bloco é clicável e faz scroll suave para a seção correspondente.

import SectionContainer from '@/components/ui/SectionContainer'
import IconButton from '@/components/ui/buttons/IconButton'
import {
  Briefcase,
  ChartColumn,
  GraduationCap,
  Landmark,
  type LucideIcon,
} from '@/components/icons'
import { sectionContent } from '@/data/sections'

const HEADER_HEIGHT = 95

const ctaIcons: Record<string, LucideIcon> = {
  agendas: ChartColumn,
  recursos: Landmark,
  capacitacao: GraduationCap,
  formulador: Briefcase,
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function SectionHero() {
  return (
    <SectionContainer className="items-center gap-lg">
      {/* Eyebrow */}
      <div className="flex items-center gap-xs">
        <span className="typo-body-sm-bold uppercase text-accent tracking-[0.12em]">
          Plataforma OPP
        </span>
        <span className="h-px w-12 bg-accent" aria-hidden="true" />
        <span className="typo-body-sm text-inactive uppercase tracking-[0.12em]">
          Inteligência Territorial
        </span>
      </div>

      {/* Macro objetivo */}
      <h1
        className="typo-h1 text-center font-regular leading-[1.2]"
        dangerouslySetInnerHTML={{
          __html: sectionContent.hero.title.replace(
            /<highlight>(.*?)<\/highlight>/g,
            '<span style="color: var(--semantic-accent); font-weight: var(--typo-weight-bold)">$1</span>',
          ),
        }}
      />

      {/* 4 blocos em grid 2×2 */}
      <div className="grid grid-cols-2 gap-sm w-full">
        {sectionContent.hero.ctas.map((cta) => {
          const Icon = ctaIcons[cta.id]

          return (
            <button
              key={cta.id}
              onClick={() => scrollToSection(cta.sectionId)}
              className="card-surface card-hoverable p-lg flex flex-col gap-lg text-left"
              aria-label={`Ir para ${cta.label}`}
            >
              <div className="flex items-center gap-md">
                <IconButton icon={Icon} size="lg" variant="tertiary" decorative />
                <h3 className="typo-h3">{cta.label}</h3>
              </div>

              <p className="typo-body">
                {cta.description}
              </p>

            </button>
          )
        })}
      </div>
    </SectionContainer>
  )
}
