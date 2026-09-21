// Modo "Análise do município" da aba Ambiente — só a análise gerada por IA, sem
// os cards de base econômica que o modo Panorâma põe acima dela. Substituiu o
// modo "Riscos estratégicos".
//
// `key={municipality.id}` é o que remonta o AIAnalysis ao trocar de município;
// sem isso a análise do município anterior ficaria na tela.

import { useMunicipality } from '@/hooks/useMunicipality'
import AIAnalysis from './AIAnalysis'

export default function ModeAnalysis() {
  const { municipality } = useMunicipality()

  return (
    <div className="flex flex-1 flex-col gap-sm min-h-0">
      <AIAnalysis key={municipality.id} className="self-end" />
    </div>
  )
}
