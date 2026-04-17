// Dispatcher das 10 etapas do Formulador.
// Cada slug mapeia para o componente específico. Placeholder enquanto as etapas
// reais ainda não foram implementadas (step 6 do plano).

interface StepFormProps {
  slug: string
}

export function StepForm({ slug }: StepFormProps) {
  return (
    <div className="flex items-center justify-center typo-body text-inactive h-[400px]">
      Etapa "{slug}" em construção
    </div>
  )
}
