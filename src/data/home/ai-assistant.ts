export const aiAssistantPlaceholder =
  'Ex: "Quais indicadores de educação estão em alerta em Campina Grande?"'

export interface AIActionButton {
  label: string
  variant: 'primary' | 'secondary' | 'tertiary'
}

export const aiActionButtons: AIActionButton[] = [
  { label: 'Analisar indicadores', variant: 'primary' },
  { label: 'Gerar relatório', variant: 'secondary' },
  { label: 'Comparar municípios', variant: 'tertiary' },
]
