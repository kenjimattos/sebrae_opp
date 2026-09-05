import { describe, expect, it } from 'vitest'
import { sanitizeCompletion } from '../../api/_lib/openrouter.js'

// Única superfície onde texto não determinístico chega ao gestor sem revisão.

describe('sanitizeCompletion · cadeia de raciocínio', () => {
  it('remove o par <think>…</think> e mantém a resposta', () => {
    const bruto = '<think>Vou pensar no problema.</think>O município tem 400 mil habitantes.'
    expect(sanitizeCompletion(bruto)).toBe('O município tem 400 mil habitantes.')
  })

  it('remove vários pares', () => {
    const bruto = '<think>a</think>Primeira.<think>b</think> Segunda.'
    expect(sanitizeCompletion(bruto)).toBe('Primeira. Segunda.')
  })

  it('<think> sem fechamento não vaza o raciocínio', () => {
    // Acontece quando a resposta é interrompida no meio do raciocínio: sem a
    // tag de fechamento, um regex de par completo não removeria nada e o
    // rascunho de pensamento apareceria como se fosse a resposta.
    const bruto = 'Resposta pronta.<think>Agora preciso conferir se o dado de'
    expect(sanitizeCompletion(bruto)).toBe('Resposta pronta.')
  })

  it('quando só há raciocínio truncado, sobra vazio', () => {
    // O chamador trata vazio como resposta ausente e mostra erro — melhor que
    // exibir a cadeia de raciocínio como se fosse a resposta.
    expect(sanitizeCompletion('<think>Deixa eu pensar')).toBe('')
  })

  it('texto sem <think> passa intacto, markdown incluído', () => {
    const bruto = '## Diagnóstico\n\n- **MPEs**: 12.400\n- Crescimento: 3,2%\n\nVer detalhe.'
    expect(sanitizeCompletion(bruto)).toBe(bruto)
  })

  it('apara só o espaço em volta', () => {
    expect(sanitizeCompletion('\n  Uma análise curta.  \n')).toBe('Uma análise curta.')
  })
})

describe('sanitizeCompletion · resposta truncada fica visível', () => {
  // Decisão travada: NADA é aparado. Definir onde termina uma frase não tem
  // regra que acerte, e todo erro dessa família produz o mesmo dano — um
  // fragmento entregue com cara de frase pronta. Tamanho quem absorve é o
  // layout: a análise recolhe e expande, o chat rola.

  it('não corta a frase incompleta do fim', () => {
    const bruto = 'Primeira frase. Segunda frase. Terceira ficou pela met'
    expect(sanitizeCompletion(bruto)).toBe(bruto)
  })

  it('não parte número — o caso que nenhuma regra de fim de frase acertava', () => {
    // Com lastIndexOf('.') isto virava "Primeira frase. O custo é de R$ 3."
    const bruto = 'Primeira frase. O custo é de R$ 3.2'
    expect(sanitizeCompletion(bruto)).toBe(bruto)
  })

  it.each([
    ['abreviação com número', 'Segue a Lei n. 14.133 e prevê contratação dir'],
    ['artigo de lei', 'Conforme o art. 5 da lei, o município dev'],
    ['lista numerada', 'Metas:\n1. Ampliar crédito\n2. Reduzir burocr'],
    ['sem espaço depois do ponto', 'Primeira frase.Segunda frase truncada aqu'],
  ])('%s sai inteiro', (_label, bruto) => {
    expect(sanitizeCompletion(bruto)).toBe(bruto)
  })
})
