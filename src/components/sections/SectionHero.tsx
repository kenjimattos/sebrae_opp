// Tailwind pure — no Figma equivalent yet
// Hero: eyebrow + macro objetivo + 3 CTAs numeradas (Mobilize → Analise → Formule)
// com scroll suave para as seções de destino

import SectionContainer from '@/components/ui/SectionContainer'
import { ArrowRight, ChartColumn, Briefcase, Users, type LucideIcon, iconSizes } from '@/components/icons'
import { sectionContent } from '@/data/sections'
import TitleSubtitle from '../ui/TitleSubtitle'
import Card from '../ui/Card'

const HEADER_HEIGHT = 95

const ctaIcons: Record<string, LucideIcon> = {
  mobilize: Users,
  analisar: ChartColumn,
  formule: Briefcase,
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function SectionHero() {
  return (
    <SectionContainer className="items-center">
      {/* Eyebrow */}
      <div className="flex items-center gap-xs">
        <span
          className="typo-body-sm-bold uppercase tracking-[0.12em] text-accent"
          style={{ letterSpacing: '0.12em' }}
        >
          Plataforma OPP
        </span>
        <span
          className="h-px w-12"
          style={{ backgroundColor: 'var(--semantic-accent)' }}
          aria-hidden="true"
        />
        <span className="typo-body-sm text-inactive uppercase tracking-[0.12em]">
          Inteligência Territorial
        </span>
      </div>

      {/* Macro objetivo */}
      <h1
        className="typo-h1 text-center max-w-[960px]"
        style={{ fontWeight: 'var(--typo-weight-regular)', lineHeight: 1.2 }}
        dangerouslySetInnerHTML={{
          __html: sectionContent.hero.title.replace(
            /<highlight>(.*?)<\/highlight>/g,
            '<span style="color: var(--semantic-accent); font-weight: var(--typo-weight-bold)">$1</span>',
          ),
        }}
      />

      {/* 3 CTAs numeradas */}
      <div className="grid-3 w-full">
        {sectionContent.hero.ctas.map((cta, index) => {
          const Icon = ctaIcons[cta.id]
          const step = String(index + 1).padStart(2, '0')
          return (
            <Card
              className="flex flex-col card-surface gap-md py-lg cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)] focus-visible:ring-offset-2 outline-none border border-solid border-[var(--semantic-surface-secondary)] hover:border-[var(--semantic-accent-surface)]"
              aria-label={`Etapa ${step}: ${cta.label}`}
            >
              {/* Step number + icon */}
              <div className="flex items-start justify-between">
                <div
                  className="flex-center justify-center radius-md transition-colors duration-200"
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: 'var(--semantic-accent-surface)',
                  }}
                >
                  <Icon
                    size={iconSizes.lg}
                    color="var(--semantic-accent)"
                    strokeWidth={1.75}
                  />
                </div>
              </div>

              {/* Title + description */}
              <TitleSubtitle
                size="sm"
                title={cta.label}
                subtitle={cta.description}
              />
            </Card>
          )
        })}
      </div>
    </SectionContainer>
  )
}
