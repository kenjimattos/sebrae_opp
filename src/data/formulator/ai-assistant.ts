// Conteúdo do AIAssistant por etapa.
// Placeholder estático v1 — no futuro será gerado por LLM.
// Todas as etapas compartilham o mesmo conjunto de ações; a descrição e os exemplos variam.

import type { AIAssistantContent } from '@/components/formulador/AIAssistant'

const ACOES_PADRAO = ['Gerar sugestão', 'Melhorar texto', 'Adaptar para edital', 'Validar conteúdo']

const DEFAULT_EXEMPLOS = [
  '"Programa de Digitalização de Microempresas de Campina Grande"',
  '"Projeto de Capacitação Empreendedora Jovem - PB"',
]

const DEFAULT_DESCRICAO =
  'A identificação clara do projeto facilita sua aprovação. Utilize um título objetivo que reflita o problema a ser resolvido.'

export const aiAssistantByEtapa: Record<string, AIAssistantContent> = {
  identificacao: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  justificativa: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  objetivos: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  'publico-alvo': {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  'plano-acao': {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  cronograma: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  indicadores: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  orcamento: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  sustentabilidade: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
  governanca: {
    descricao: DEFAULT_DESCRICAO,
    exemplos: DEFAULT_EXEMPLOS,
    acoes: ACOES_PADRAO,
  },
}
