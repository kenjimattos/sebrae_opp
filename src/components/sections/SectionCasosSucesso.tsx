// Figma: Section/CasosSucesso (390:623)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import { sectionContent } from '@/data/sections'

const casos = [
  {
    titulo: 'Revitalização do centro histórico',
    municipio: 'João Pessoa',
    resultado: 'Aumento de 45% no fluxo turístico',
    descricao: 'Projeto integrado de restauração e incentivo ao comércio local no centro histórico.',
  },
  {
    titulo: 'Hub de inovação do semiárido',
    municipio: 'Campina Grande',
    resultado: '87 startups incubadas',
    descricao: 'Ecossistema de inovação conectando universidades e pequenos negócios de tecnologia.',
  },
  {
    titulo: 'Programa Água para Todos',
    municipio: 'Patos',
    resultado: '12.000 famílias atendidas',
    descricao: 'Sistema de cisternas e dessalinização para comunidades rurais do sertão.',
  },
  {
    titulo: 'Feira de Economia Criativa',
    municipio: 'Guarabira',
    resultado: 'R$ 2.3M em vendas diretas',
    descricao: 'Evento anual que conecta artesãos e produtores locais ao mercado regional.',
  },
]

export default function SectionCasosSucesso() {
  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.casosSucesso.title}
        description={sectionContent.casosSucesso.description}
      />

      {/* Horizontal scroll */}
      <div className="flex gap-[var(--spacing-md)] overflow-x-auto w-full pb-[var(--spacing-xs)] snap-x snap-mandatory">
        {casos.map((caso) => (
          <div
            key={caso.titulo}
            className="flex-shrink-0 w-[380px] bg-[var(--semantic-surface-primary)] rounded-[var(--radius-md)] p-[var(--spacing-lg)] flex flex-col gap-[var(--spacing-md)] snap-start"
          >
            <span className="typo-body-sm text-[color:var(--semantic-text-inactive)] uppercase">
              {caso.municipio}
            </span>
            <h4 className="typo-h3 text-[color:var(--semantic-text-primary)]">
              {caso.titulo}
            </h4>
            <p className="typo-body text-[color:var(--semantic-text-primary)]">
              {caso.descricao}
            </p>
            <div className="bg-[var(--semantic-success-surface)] rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-xs)]">
              <span className="typo-body-bold text-[color:var(--semantic-success)]">
                {caso.resultado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
