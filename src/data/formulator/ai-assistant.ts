// Conteúdo do AIAssistant por etapa (descrição + exemplos + ações).
// v1: ações reais (ligadas ao LLM via useFormulatorAi) só em identificação,
// justificativa e objetivos — as demais etapas são só conteúdo (actions: []).

import type { AIAssistantContent } from '@/components/formulator/AIAssistant'

export const aiAssistantByStep: Record<string, AIAssistantContent> = {
  identificacao: {
    description:
      'A identificação clara do projeto facilita sua aprovação. Utilize um título objetivo que reflita o problema a ser resolvido.',
    examples: [
      '"Programa de Digitalização de Microempresas de Campina Grande"',
      '"Projeto de Capacitação Empreendedora Jovem - PB"',
    ]
  },
  justificativa: {
    description:
      'Uma boa justificativa conecta o problema aos dados do diagnóstico. A IA pode fundamentar as evidências com os indicadores em alerta do seu município.',
    examples: [
      '"O município apresenta tempo de abertura de empresas acima da média estadual..."',
      '"Segundo o diagnóstico, 3 indicadores estão em situação de alerta..."',
    ]
  },
  objetivos: {
    description:
      'O objetivo geral expressa a transformação pretendida; os específicos, os passos mensuráveis para alcançá-la. A IA pode derivar os específicos do geral.',
    examples: [
      '"Reduzir o tempo médio de abertura de empresas no município"',
      '"Capacitar 200 empreendedores em gestão financeira até 2027"',
    ]
  },
  'publico-alvo': {
    description:
      'Delimite quem o projeto beneficia diretamente (empreendedores, MEIs) e indiretamente (famílias, comunidade). Números ajudam a dimensionar.',
    examples: [
      '"150 MEIs do setor de comércio e serviços"',
      '"Jovens de 18 a 29 anos em situação de vulnerabilidade"',
    ]
  },
  'plano-acao': {
    description:
      'Descreva as atividades que materializam cada objetivo específico: o quê, como e quem executa.',
    examples: [
      '"Mutirão de formalização na sala do empreendedor"',
      '"Oficinas quinzenais de gestão financeira com o Sebrae"',
    ]
  },
  cronograma: {
    description:
      'Distribua as atividades no tempo com marcos verificáveis. Prazos realistas transmitem credibilidade ao avaliador.',
    examples: [
      '"Mês 1–2: mobilização e inscrições"',
      '"Mês 6: primeira turma capacitada (marco intermediário)"',
    ]
  },
  indicadores: {
    description:
      'Defina como medir o sucesso: indicadores com linha de base, meta e fonte de verificação. Os indicadores do diagnóstico desta plataforma são um bom ponto de partida.',
    examples: [
      '"Tempo médio de abertura de empresas: de 48h para 24h"',
      '"Número de MEIs formalizados: +15% em 12 meses"',
    ]
  },
  orcamento: {
    description:
      'Detalhe os recursos por categoria (pessoal, material, serviços) e vincule cada despesa a uma atividade do plano de ação.',
    examples: [
      '"Consultoria de capacitação: R$ 30.000"',
      '"Material didático e divulgação: R$ 8.000"',
    ]
  },
  sustentabilidade: {
    description:
      'Mostre como os resultados continuam após o fim do projeto: institucionalização, parcerias permanentes, fontes de receita.',
    examples: [
      '"Sala do empreendedor incorporada à estrutura da secretaria"',
      '"Convênio permanente com o Sebrae para capacitações"',
    ]
  },
  governanca: {
    description:
      'Defina quem gere, monitora e presta contas: comitê gestor, papéis das secretarias e dos parceiros, rotina de acompanhamento.',
    examples: [
      '"Comitê gestor com secretaria, Sebrae e associação comercial"',
      '"Relatório trimestral de acompanhamento dos indicadores"',
    ]
  },
}
