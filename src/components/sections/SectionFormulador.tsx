// Figma: Section/Formulador (390:635)

import SectionContainer from '@/components/ui/SectionContainer'
import SectionHeader from '@/components/SectionHeader'
import FormuladorCard from '@/components/formulador/FormuladorCard'
import { sectionContent } from '@/data/sections'

export default function SectionFormulador() {
  return (
    <SectionContainer>
      <SectionHeader
        title={sectionContent.formulador.title}
        description={sectionContent.formulador.description}
      />

      {/* Grid 2 cards */}
      <div className="flex gap-md items-start w-full">
        <FormuladorCard
          titulo="Assistente de formulação de projetos"
          descricao="A IA analisa os principais desafios do município e sugere caminhos para estruturar um projeto de desenvolvimento local."
          buttonLabel="Começar com a ajuda da IA"
          buttonHref="#"
        />
        <FormuladorCard
          titulo="Modelos de projeto"
          descricao="Acesse formatos estruturados como plano de ação, programas de apoio a pequenos negócios e projetos de captação de recursos."
          buttonLabel="Ver modelos"
          buttonHref="#"
        />
      </div>
    </SectionContainer>
  )
}
