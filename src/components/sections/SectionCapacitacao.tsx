// Figma: Section/Capacitacao (390:611)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import CoursesCard from '@/components/courses/CoursesCard'
import { sectionContent } from '@/data/sections'

const trilhas = [
  {
    title: 'Formulação e avaliação de\nPolíticas Públicas',
    description:
      'Do diagnóstico do problema ao desenho de soluções estruturadas para o desenvolvimento local.',
    cursos: [
      { titulo: 'Avaliação de Impacto de Políticas Públicas', carga: '36 Horas' },
      { titulo: 'Elaboração de Projetos Municipais', carga: '40 Horas' },
      { titulo: 'Gestão de Políticas Públicas', carga: '48 Horas' },
    ],
  },
  {
    title: 'Captação de recursos e\nfinanciamento municipal',
    description:
      'Estratégias para identificar, acessar e gerir recursos federais, estaduais e de emendas parlamentares.',
    cursos: [
      { titulo: 'Captação de Recursos Federais', carga: '20 Horas' },
      { titulo: 'Elaboração de Convênios', carga: '32 Horas' },
      { titulo: 'Gestão Financeira Municipal', carga: '36 Horas' },
    ],
  },
  {
    title: 'Liderança e governança\nlocal',
    description:
      'Competências de liderança, articulação política e governança participativa para gestores municipais.',
    cursos: [
      { titulo: 'Liderança e Governança Local', carga: '48 Horas' },
      { titulo: 'Articulação Institucional', carga: '24 Horas' },
      { titulo: 'Governança Participativa', carga: '32 Horas' },
    ],
  },
  {
    title: 'Indicadores e diagnóstico\nmunicipal',
    description:
      'Uso de dados e indicadores para embasar decisões estratégicas e monitorar o desenvolvimento local.',
    cursos: [
      { titulo: 'Indicadores Municipais', carga: '32 Horas' },
      { titulo: 'Diagnóstico Socioeconômico', carga: '28 Horas' },
      { titulo: 'Planejamento Estratégico Municipal', carga: '40 Horas' },
    ],
  },
]

export default function SectionCapacitacao() {
  return (
    <SectionContainer>
      <SectionHeader title={sectionContent.capacitacao.title} />

      {/* Grid 2x2 with graduation cap icon in center */}
      <div className="grid grid-cols-2 gap-sm w-full">
        {trilhas.map((trilha) => (
          <CoursesCard
            key={trilha.title}
            title={trilha.title}
            description={trilha.description}
            cursos={trilha.cursos}
          />
        ))}
      </div>
    </SectionContainer>
  )
}
