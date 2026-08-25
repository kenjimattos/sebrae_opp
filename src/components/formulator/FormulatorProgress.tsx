// Figma: Formulador/Progress (620:4417)
// Barra de progresso no topo do Formulador: "X% concluído" + ProgressBar + "Y/10 etapas • Etapa Atual: …".

import ProgressBar from '@/components/ui/ProgressBar'
import { formulatorSteps } from '@/data/formulator/steps'

interface FormulatorProgressProps {
  currentIndex: number     // 0..9 — índice da etapa atual (10 = conclusão)
  percent: number          // 0..100
  className?: string
}

export default function FormulatorProgress({
  currentIndex,
  percent,
  className = '',
}: FormulatorProgressProps) {
  const isFinalized = currentIndex >= formulatorSteps.length
  const stepName = isFinalized
    ? 'Conclusão'
    : formulatorSteps[currentIndex]?.name ?? ''
  const stepNum = isFinalized ? formulatorSteps.length : currentIndex + 1

  return (
    <div
      className={`glass flex flex-col items-start gap-sm w-full p-md rounded ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <p className="typo-body-bold">{Math.round(percent)}% concluído</p>
        <p className="typo-body">
          {stepNum}/{formulatorSteps.length} etapas • Etapa Atual: {stepName}
        </p>
      </div>
      <ProgressBar value={percent} />
    </div>
  )
}
