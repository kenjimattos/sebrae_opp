// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import { sectionContent } from '@/data/sections'

const cursos = [
  { titulo: 'Gestão de Políticas Públicas', carga: '40h', modalidade: 'EAD', inscritos: 234 },
  { titulo: 'Elaboração de Projetos', carga: '60h', modalidade: 'Presencial', inscritos: 89 },
  { titulo: 'Captação de Recursos Federais', carga: '20h', modalidade: 'EAD', inscritos: 456 },
  { titulo: 'Indicadores Municipais', carga: '32h', modalidade: 'EAD', inscritos: 178 },
  { titulo: 'Liderança e Governança Local', carga: '48h', modalidade: 'Híbrido', inscritos: 67 },
  { titulo: 'Planejamento Estratégico Municipal', carga: '40h', modalidade: 'Presencial', inscritos: 112 },
]

export default function SectionCapacitacao() {
  return (
    <SectionContainer className="flex flex-col gap-[var(--spacing-lg)] py-[var(--spacing-lg)]">
      <SectionHeader
        title={sectionContent.capacitacao.title}
        description={sectionContent.capacitacao.description}
      />

      {/* Course list */}
      <div className="flex flex-col gap-[var(--spacing-sm)] w-full">
        {cursos.map((curso) => (
          <div
            key={curso.titulo}
            className="flex items-center justify-between bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] w-full"
          >
            <span className="flex-1 typo-body-bold text-[color:var(--semantic-text-primary)]">
              {curso.titulo}
            </span>
            <div className="flex items-center gap-[var(--spacing-lg)]">
              <span className="typo-body text-[color:var(--semantic-text-inactive)] w-[60px]">
                {curso.carga}
              </span>
              <span className="typo-body text-[color:var(--semantic-text-inactive)] w-[100px]">
                {curso.modalidade}
              </span>
              <span className="typo-body-bold text-[color:var(--semantic-text-primary)] w-[80px] text-right">
                {curso.inscritos} inscritos
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
