// Confirmações de sobrescrita do Formulador.
//
// Quatro botões de IA trocam conteúdo já digitado pelo texto gerado: aprimorar
// um campo, gerar objetivos específicos, sugerir rubricas e gerar indicadores.
// Os três últimos substituem a LISTA INTEIRA, não acrescentam. Existe "Desfazer"
// em todos, mas ele vive no estado local da etapa: sai da etapa e volta, o botão
// não está mais lá e o texto original acabou — não há histórico em lugar nenhum.
// Daí a confirmação vir antes, e só quando há o que perder.

import type { BudgetItem } from '@/types/formulator'
import type { ConfirmOptions } from '@/hooks/useConfirm'

/** Um item de lista conta como preenchido quando tem texto de verdade. */
export function filledCount(items: string[]): number {
  return items.filter((t) => t.trim() !== '').length
}

/** Rubrica preenchida = tem nome ou valor. Zerar o valor também é perda. */
export function filledBudgetCount(items: BudgetItem[]): number {
  return items.filter((r) => r.label.trim() !== '' || r.value.trim() !== '').length
}

function plural(n: number, singular: string, pluralWord: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${pluralWord}`
}

// `label` é opcional porque o título do AiField também é: alguns campos vêm
// rotulados de fora. Sem rótulo, a frase fala do campo sem nomeá-lo.
export function confirmReplaceField(label?: string): ConfirmOptions {
  const alvo = label ? `em "${label}"` : 'neste campo'
  return {
    title: 'Substituir o texto?',
    message: `O texto que você escreveu ${alvo} será trocado pelo da IA. Dá para desfazer enquanto você não sair desta etapa.`,
    confirmLabel: 'Substituir',
    cancelLabel: 'Manter o meu',
  }
}

export function confirmReplaceList(
  n: number,
  singular: string,
  pluralWord: string,
): ConfirmOptions {
  return {
    title: 'Substituir a lista?',
    message: `Você já preencheu ${plural(n, singular, pluralWord)}. A IA vai trocar a lista inteira, não acrescentar. Dá para desfazer enquanto você não sair desta etapa.`,
    confirmLabel: 'Substituir',
    cancelLabel: 'Manter as minhas',
  }
}

export function confirmReplaceBudget(n: number): ConfirmOptions {
  return {
    title: 'Substituir o orçamento?',
    message: `Você já preencheu ${plural(n, 'rubrica', 'rubricas')}. A IA vai trocar a lista inteira e os valores em reais voltam a zero. Dá para desfazer enquanto você não sair desta etapa.`,
    confirmLabel: 'Substituir',
    cancelLabel: 'Manter o meu',
  }
}

export const CONFIRM_CHANGE_MUNICIPALITY: ConfirmOptions = {
  title: 'Trocar de município?',
  message:
    'O formulário mostra o projeto do município selecionado. Ao trocar, a tela passa a mostrar o do novo município. O que você escreveu fica guardado e volta a aparecer se você selecionar este município de novo.',
  confirmLabel: 'Trocar de município',
  cancelLabel: 'Ficar aqui',
}
