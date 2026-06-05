import TitleSubtitle from '@/components/ui/TitleSubtitle'
import Button from '@/components/ui/buttons/Button'
import { resourcesContent } from '@/data/home/resources'
import { useNavigate } from 'react-router-dom'

export default function ModeEditais() {
  const navigate = useNavigate()

  return (
   <>
    <div className="flex flex-col items-end gap-2xl glass p-lg rounded-sm">
      <TitleSubtitle
        title={resourcesContent.editais.title}
        subtitle={resourcesContent.editais.description}
        className="w-full"
      />
      <Button label={resourcesContent.buttons.verOportunidades} onClick={() => navigate('/oportunidades')} />
    </div>
  </>
  )
}
