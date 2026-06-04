// Figma: Section/Resources (390:600)
// Emendas parlamentares + mapa Datapedia + editais e programas


import Card from '@/components/ui/Card'
import TitleSubtitle from '@/components/ui/TitleSubtitle'
import PillButton from '@/components/ui/buttons/PillButton'
import { resourcesContent } from '@/data/home/resources'

export default function ModeEditais() {
  return (
   <>
    {/* Bloco 3 — Editais e programas */}
    <Card as="section" padding="lg" className="flex flex-col items-end gap-2xl">
      <TitleSubtitle
        title={resourcesContent.editais.title}
        subtitle={resourcesContent.editais.description}
        className="flex-1"
      />
      <PillButton label={resourcesContent.buttons.verOportunidades} href="/oportunidades" className="shrink-0" />
    </Card>
  </> 
  )
}
