// Peças do núcleo de IA que não dependem de fornecedor: o formato das
// mensagens, o teto de saída e a limpeza do texto antes de ir para a tela.

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Teto padrão de todas as tasks (MAX_TOKENS_BY_TASK está vazio). O chat pede ~150
// palavras e modelos estouram. É teto de segurança contra resposta desgovernada, não
// controle de tamanho: o tamanho quem absorve é o layout de cada superfície.
export const MAX_TOKENS = 800

/**
 * Prepara o texto do modelo para a tela. Pura e exportada de propósito: é a
 * única superfície onde texto não determinístico chega ao gestor sem revisão,
 * e testá-la não pode depender de simular a rede.
 *
 * **Remove a cadeia de raciocínio.** O cliente do Vertex já descarta as partes
 * marcadas como `thought`, mas o modelo pode escrever o raciocínio no próprio
 * texto — daí a defesa aqui. Pares `<think>…</think>` saem inteiros; um `<think>` **sem
 * fechamento** leva junto tudo o que vem depois dele, que é o caso de uma
 * resposta interrompida no meio do raciocínio.
 *
 * **O que esta função não faz é aparar a frase incompleta de uma resposta
 * truncada.** Fazer isso exige decidir onde termina uma frase, e nenhuma regra
 * acerta: `lastIndexOf('.')` parte "R$ 3.2" ao meio; exigir espaço depois do
 * ponto quebra quando o modelo não põe espaço; qualquer variante ainda corta em
 * "art. 5", "Lei n. 14.133" e no marcador de lista numerada. Todo erro dessa
 * família produz o mesmo dano: um fragmento entregue com cara de frase pronta.
 * Deixar a cauda truncada visível é pior de ler e melhor de confiar — parece
 * cortada porque está.
 *
 * Quem absorve tamanho variável é o layout (a análise recolhe e expande, o chat
 * rola), não o corte de texto.
 */
export function sanitizeCompletion(content: string): string {
  let text = content.replace(/<think>[\s\S]*?<\/think>/g, '')

  const abertoSemFechar = text.indexOf('<think>')
  if (abertoSemFechar !== -1) text = text.slice(0, abertoSemFechar)

  return text.trim()
}
