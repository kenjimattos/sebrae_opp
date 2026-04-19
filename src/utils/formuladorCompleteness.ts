// Regras de conclusão de cada etapa do Formulador.
// Uma etapa só é "concluída" quando todos os campos obrigatórios estão preenchidos.
// Arrays dinâmicos exigem pelo menos uma entrada não vazia.

import type { FormuladorState } from '@/types/formulador'
import { etapasFormulador } from '@/data/formulador-etapas'

function nonEmpty(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

function anyNonEmpty(arr: string[] | undefined): boolean {
  return Array.isArray(arr) && arr.some(nonEmpty)
}

export function isEtapaCompleta(slug: string, state: FormuladorState): boolean {
  switch (slug) {
    case 'identificacao': {
      const d = state.identificacao
      return nonEmpty(d.titulo) && nonEmpty(d.responsavel) && nonEmpty(d.orgao) && nonEmpty(d.duracao)
    }
    case 'justificativa': {
      const d = state.justificativa
      return nonEmpty(d.problema) && nonEmpty(d.evidencias) && nonEmpty(d.impacto)
    }
    case 'objetivos': {
      const d = state.objetivos
      return nonEmpty(d.geral) && anyNonEmpty(d.especificos)
    }
    case 'publico-alvo': {
      const d = state.publicoAlvo
      return nonEmpty(d.principal) && nonEmpty(d.secundario) && nonEmpty(d.estimativa)
    }
    case 'plano-acao': {
      const d = state.planoAcao
      return nonEmpty(d.atividades) && nonEmpty(d.metodologia)
    }
    case 'cronograma': {
      const d = state.cronograma
      return nonEmpty(d.fases) && nonEmpty(d.marcos)
    }
    case 'indicadores': {
      const d = state.indicadores
      return anyNonEmpty(d.resultado) && anyNonEmpty(d.impacto) && anyNonEmpty(d.quantitativas)
    }
    case 'orcamento': {
      const d = state.orcamento
      return d.rubricas.some((r) => nonEmpty(r.label) && nonEmpty(r.valor))
    }
    case 'sustentabilidade': {
      const d = state.sustentabilidade
      return nonEmpty(d.continuidade) && nonEmpty(d.parcerias)
    }
    case 'governanca': {
      const d = state.governanca
      return nonEmpty(d.gestao) && nonEmpty(d.monitoramento) && nonEmpty(d.prestacaoContas)
    }
    default:
      return false
  }
}

export function countEtapasCompletas(state: FormuladorState): number {
  return etapasFormulador.reduce((acc, e) => (isEtapaCompleta(e.slug, state) ? acc + 1 : acc), 0)
}
