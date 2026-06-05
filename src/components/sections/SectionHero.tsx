// Tailwind pure — no Figma equivalent yet
// Hero: eyebrow + macro objetivo + 4 blocos 2×2 (Agenda / Recursos / Capacitação / Formulador)
// Cada bloco é clicável e faz scroll suave para a seção correspondente.
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'
import {
  Briefcase,
  ChartColumn,
  GraduationCap,
  Landmark,
  type LucideIcon,
} from '@/components/icons'
import { sectionContent } from '@/data/home/sections'


const ctaIcons: Record<string, LucideIcon> = {
  ambiente: ChartColumn,
  recursos: Landmark,
  capacitacao: GraduationCap,
  formulador: Briefcase,
}

export default function SectionHero() {

  return (
    <section className="section-container">
      {/* Eyebrow */}
      <div className="flex items-center gap-sm typo-title-sm uppercase">
        <span className="text-accent">
          Plataforma OPP
        </span>
        <hr className="w-[4rem]" aria-hidden="true" />
        <span className="">
          Inteligencia em políticas públicas
        </span>
      </div>

      {/* Macro objetivo */}
      <SectionHeader
        title={sectionContent.hero.title}
        description={sectionContent.hero.description}
        className="px-lg"
      />

      <div className="flex flex-col items-center gap-lg px-lg">
        <Button
          variant="secondary"
          label={sectionContent.hero.subtitle}
          className='pointer-events-none'
        />

        {/* 4 blocos em grid 2×2 */}
        <div className="grid grid-cols-2 gap-x-2xl gap-y-md px-3xl w-full">
          {sectionContent.jornadas.map((each) => {
            const Icon = ctaIcons[each.id]

            return (
              <div
                key={each.id}
                className="glass rounded-lg p-md flex items-center gap-lg text-left"
                aria-label={`Ir para ${each.title}`}
              >
                <IconButton icon={Icon} size="lg" decorative/>
                
                <div className="flex flex-col gap-sm">
                  <h4 className="typo-h4 uppercase">{each.title}</h4>
                  <p className="typo-body">
                  {each.description}
                  </p>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
