// Figma: Economics/Analysis (368:834)
// Bloco de análise textual — futuro: conectado a LLM

interface EconomicsAnalysisProps {
  analise?: string
  className?: string
}

const defaultAnalise =
  'A economia local apresenta crescimento moderado do PIB per capita e melhora nos índices de competitividade, porém mantém alta dependência do setor público e parcela significativa da população em faixa de baixa renda. O fortalecimento das MPE e a diversificação produtiva são caminhos prioritários.'

export default function EconomicsAnalysis({ analise = defaultAnalise, className = '' }: EconomicsAnalysisProps) {
  return (
    <div
      className={`bg-[var(--semantic-surface-primary)] rounded-[var(--radius-sm)] px-[var(--spacing-xl)] py-[var(--spacing-md)] flex flex-col gap-xs w-full ${className}`}
    >
      <h4 className="typo-body-bold">
        Análise
      </h4>
      <p className="typo-body">
        {analise}
      </p>
    </div>
  )
}
