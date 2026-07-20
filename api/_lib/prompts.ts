// Templates de prompt (pt-BR) por task. Toda a "personalidade" da IA vive aqui.
import type { AiFieldId, AiTaskRequest } from '../../src/types/ai.js'
import type { OpenRouterMessage } from './openrouter.js'

export const SYSTEM_PROMPT =
  'Você é o assistente de IA da Plataforma OPP (Observatório de Políticas Públicas) do Sebrae Paraíba. ' +
  'Você ajuda gestores públicos municipais da Paraíba a entender indicadores socioeconômicos e a formular ' +
  'projetos de desenvolvimento do ambiente de pequenos negócios. Responda sempre em português do Brasil, ' +
  'em tom claro, objetivo e profissional. Seja conciso (até ~150 palavras) e sempre termine a resposta ' +
  'com uma frase completa.'

// Superfícies conversacionais (chat, modal do indicador) renderizam markdown
// leve via MarkdownLite no frontend.
const RICH_TEXT_NOTE =
  ' Você pode usar formatação leve em markdown: **negrito**, itálico e listas numeradas ou com hífen ' +
  '(máximo 3 itens). Não use títulos (#), tabelas nem blocos de código.'

// Tasks cujo resultado entra em campos de formulário (input/textarea) — lá
// markdown apareceria literal.
const PLAIN_TEXT_NOTE =
  ' Responda em texto puro, sem nenhuma formatação markdown — o texto vai direto para dentro de um ' +
  'campo de formulário.'

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
  'targetAudience.primary': {
    label: 'Público-alvo Principal',
    instruction:
      'Reescreva descrevendo os beneficiários diretos do projeto: perfil, setor de atuação e porte ' +
      '(ex.: MEIs, micro e pequenas empresas). Um parágrafo único. Não invente quantidades ou números ' +
      'que não estejam no contexto.',
  },
  'targetAudience.secondary': {
    label: 'Público Secundário',
    instruction:
      'Reescreva descrevendo os beneficiários indiretos e demais atores envolvidos ou impactados pelo ' +
      'projeto. Um parágrafo único.',
  },
  'actionPlan.activities': {
    label: 'Atividades Previstas',
    instruction:
      'Reescreva como uma lista de atividades, uma por linha, cada uma iniciando com verbo no infinitivo ' +
      'e conectada aos objetivos do projeto. Sem numeração e sem marcadores.',
  },
  'actionPlan.methodology': {
    label: 'Metodologia',
    instruction:
      'Reescreva descrevendo como as atividades serão executadas: abordagem, etapas de trabalho e ' +
      'responsabilidades em termos genéricos. Um parágrafo único.',
  },
  'timeline.phases': {
    label: 'Fases do projeto',
    instruction:
      'Reescreva dividindo o projeto em fases com períodos relativos (ex.: Mês 1–3), uma fase por linha, ' +
      'coerentes com a duração informada no contexto. Não invente datas absolutas.',
  },
  'timeline.milestones': {
    label: 'Marcos e Entregas',
    instruction:
      'Reescreva listando marcos verificáveis e entregas concretas do projeto, um por linha, coerentes ' +
      'com as fases e atividades do contexto. Sem numeração e sem marcadores.',
  },
  'sustainability.continuity': {
    label: 'Estratégia de Continuidade',
    instruction:
      'Reescreva descrevendo como os resultados se manterão após o fim do projeto: institucionalização, ' +
      'fontes de recursos e rotinas permanentes. Um parágrafo único.',
  },
  'sustainability.partnerships': {
    label: 'Parcerias Institucionais',
    instruction:
      'Reescreva descrevendo parcerias institucionais plausíveis para municípios da Paraíba ' +
      '(ex.: Sebrae, associações comerciais, governo estadual) e o papel de cada uma na continuidade ' +
      'do projeto. Um parágrafo único.',
  },
  'governance.management': {
    label: 'Estrutura de Gestão',
    instruction:
      'Reescreva descrevendo a estrutura de gestão do projeto: instância gestora (ex.: comitê gestor), ' +
      'papéis e responsabilidades. Um parágrafo único.',
  },
  'governance.monitoring': {
    label: 'Monitoramento e Avaliação',
    instruction:
      'Reescreva descrevendo a rotina de acompanhamento do projeto: frequência, responsáveis e uso dos ' +
      'indicadores do projeto na avaliação. Um parágrafo único.',
  },
  'governance.accountability': {
    label: 'Prestação de Contas',
    instruction:
      'Reescreva descrevendo a prestação de contas do projeto: tipos de relatório, frequência e ' +
      'destinatários (ex.: câmara municipal, sociedade civil). Um parágrafo único.',
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
        { role: 'system', content: SYSTEM_PROMPT + RICH_TEXT_NOTE },
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
        { role: 'system', content: SYSTEM_PROMPT + PLAIN_TEXT_NOTE },
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
        { role: 'system', content: SYSTEM_PROMPT + PLAIN_TEXT_NOTE },
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
        `${SYSTEM_PROMPT}${RICH_TEXT_NOTE}\n\nO gestor está analisando o município de ${municipality.name} (PB).${summary}`
      return [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ]
    }
  }
}
