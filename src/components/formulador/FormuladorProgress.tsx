// Figma: Formulador/Progress (620:4417)
// Barra de progresso no topo do Formulador: "X% concluído" + ProgressBar + "Y/10 etapas • Etapa Atual: …".

import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { etapasFormulador } from '@/data/formulador-etapas'

interface FormuladorProgressProps {
  currentIndex: number     // 0..9 — índice da etapa atual (10 = conclusão)
  percent: number          // 0..100
  className?: string
}

export default function FormuladorProgress({
  currentIndex,
  percent,
  className = '',
}: FormuladorProgressProps) {
  const isFinalized = currentIndex >= etapasFormulador.length
  const nomeEtapa = isFinalized
    ? 'Conclusão'
    : etapasFormulador[currentIndex]?.nome ?? ''
  const etapaNum = isFinalized ? etapasFormulador.length : currentIndex + 1

  return (
    <Card
      padding="lg"
      radius="sm"
      className={`flex flex-col items-start gap-sm w-full ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <p className="typo-body-bold">{Math.round(percent)}% concluído</p>
        <p className="typo-body">
          {etapaNum}/{etapasFormulador.length} etapas • Etapa Atual: {nomeEtapa}
        </p>
      </div>
      <ProgressBar value={percent} />
    </Card>
  )
}
