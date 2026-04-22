// Conteúdo do AIAssistant por etapa.
// Placeholder estático v1 — no futuro será gerado por LLM.
// Todas as etapas compartilham o mesmo conjunto de ações; a descrição e os exemplos variam.

import type { AIAssistantContent } from '@/components/formulator/AIAssistant'

const DEFAULT_ACTIONS = ['Gerar sugestão', 'Melhorar texto', 'Adaptar para edital', 'Validar conteúdo']

const DEFAULT_EXAMPLES = [
  '"Programa de Digitalização de Microempresas de Campina Grande"',
  '"Projeto de Capacitação Empreendedora Jovem - PB"',
]

const DEFAULT_DESCRIPTION =
  'A identificação clara do projeto facilita sua aprovação. Utilize um título objetivo que reflita o problema a ser resolvido.'

export const aiAssistantByStep: Record<string, AIAssistantContent> = {
  identificacao: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  justificativa: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  objetivos: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  'publico-alvo': {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  'plano-acao': {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  cronograma: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  indicadores: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  orcamento: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  sustentabilidade: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
  governanca: {
    description: DEFAULT_DESCRIPTION,
    examples: DEFAULT_EXAMPLES,
    actions: DEFAULT_ACTIONS,
  },
}
