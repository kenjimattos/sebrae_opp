// Templates de prompt (pt-BR) por task. Toda a "personalidade" da IA vive aqui.
import type { AiFieldId, AiTaskRequest } from '../../src/types/ai.js'
import type { OpenRouterMessage } from './openrouter.js'

export const SYSTEM_PROMPT =
  'Você é o assistente de IA da Plataforma OPP (Observatório de Políticas Públicas) do Sebrae Paraíba. ' +
  'Você ajuda gestores públicos municipais da Paraíba a entender indicadores socioeconômicos e a formular ' +
  'projetos de desenvolvimento do ambiente de pequenos negócios. Responda sempre em português do Brasil, ' +
  'em tom claro, objetivo e profissional, sem formatação markdown (sem asteriscos, sem títulos), ' +
  'em no máximo 150 palavras, salvo instrução contrária.'

// Mesmo vocabulário de src/data/indicators/status-labels.ts (Bom/Atenção/
// Alerta). Duplicado aqui de propósito: api/_lib não importa código do
// frontend além de tipos.
const STATUS_PT: Record<string, string> = {
  success: 'Bom',
  warning: 'Atenção',
  alert: 'Alerta',
  none: 'Sem classificação',
}

// Instrução específica por campo do Formulador.
const FIELD_INSTRUCTIONS: Record<AiFieldId, { label: string; instruction: string }> = {
  'identification.title': {
    label: 'Título do Projeto',
    instruction:
      'Reescreva como um título de projeto público conciso, específico e atraente (máximo 12 palavras). ' +
      'Responda apenas com o título, sem aspas.',
  },
  'justification.problem': {
    label: 'Problema central',
    instruction:
      'Reescreva como uma formulação clara de problema público: situação atual, quem é afetado e a lacuna ' +
      'que o projeto ataca. Um parágrafo único.',
  },
  'justification.evidence': {
    label: 'Evidências e Dados',
    instruction:
      'Reescreva fundamentando com dados e indicadores. Se houver indicadores do município no contexto, ' +
      'cite-os explicitamente com seus valores. Um parágrafo único.',
  },
  'justification.impact': {
    label: 'Impacto da Inação',
    instruction:
      'Reescreva descrevendo as consequências concretas de não agir sobre o problema (econômicas e sociais). ' +
      'Um parágrafo único.',
  },
  'justification.policy': {
    label: 'Política pública associada',
    instruction:
      'Reescreva relacionando o projeto a políticas públicas reais aplicáveis a municípios brasileiros ' +
      '(ex.: Lei Geral da Micro e Pequena Empresa, Redesim, Cidade Empreendedora). Um parágrafo único.',
  },
  'objectives.general': {
    label: 'Objetivo Geral',
    instruction:
      'Reescreva como um objetivo geral de projeto: um único período iniciado por verbo no infinitivo, ' +
      'expressando a transformação pretendida. Responda apenas com o objetivo.',
  },
}

function statusPt(status: string): string {
  return STATUS_PT[status] ?? status
}

export function buildMessages(req: AiTaskRequest): OpenRouterMessage[] {
  switch (req.task) {
    case 'indicator-question': {
      const { indicator, municipality, question } = req
      const unit = indicator.unit ? ` ${indicator.unit}` : ''
      const context =
        `Contexto: no município de ${municipality.name} (PB), o indicador "${indicator.label}" ` +
        `tem valor ${indicator.value}${unit} e classificação "${statusPt(indicator.status)}".`
      return [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${context}\n\nPergunta do gestor sobre esse indicador: ${question}`,
        },
      ]
    }

    case 'improve-field': {
      const { field, text, municipality, context } = req
      const spec = FIELD_INSTRUCTIONS[field]
      const extra = context
        ? '\n\nContexto adicional do projeto:\n' +
          Object.entries(context)
            .filter(([, v]) => v.trim() !== '')
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')
        : ''
      const body =
        text.trim() === ''
          ? `O campo "${spec.label}" ainda está vazio. Redija uma sugestão inicial para ele. ${spec.instruction}`
          : `Texto atual do campo "${spec.label}":\n"""${text}"""\n\n${spec.instruction}`
      return [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Estou preenchendo um projeto de política pública para o município de ${municipality.name} (PB).` +
            `${extra}\n\n${body}\n\nResponda apenas com o texto final do campo, sem comentários.`,
        },
      ]
    }

    case 'generate-specific-objectives': {
      const { general, municipality, count } = req
      const n = count ?? 4
      return [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Projeto de política pública para o município de ${municipality.name} (PB).\n` +
            `Objetivo geral: """${general}"""\n\n` +
            `Gere ${n} objetivos específicos derivados desse objetivo geral. ` +
            'Cada um em uma linha própria, sem numeração e sem marcadores, começando com verbo no infinitivo. ' +
            'Responda apenas com as linhas dos objetivos.',
        },
      ]
    }

    case 'chat': {
      const { messages, municipality, indicatorsSummary } = req
      const summary = indicatorsSummary
        ? `\n\nIndicadores atuais de ${municipality.name}: ${indicatorsSummary}`
        : ''
      const system =
        `${SYSTEM_PROMPT}\n\nO gestor está analisando o município de ${municipality.name} (PB).${summary}`
      return [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ]
    }
  }
}
