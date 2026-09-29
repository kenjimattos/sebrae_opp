// Sigilo sobre o que está por trás da IA: modelo, fornecedor, infraestrutura.
// Duas camadas, porque uma só não segura: o SYSTEM_PROMPT (prompts.ts) pede
// sigilo, mas modelo gratuito obedece prompt de forma irregular — perguntado
// "qual modelo você é?", o chat respondeu "NVIDIA". O filtro abaixo é a
// garantia determinística que o prompt não dá.

// Frase fixa de quando o assunto é a própria IA. O prompt pede ao modelo que a
// use; o handler a impõe quando a resposta cita um nome proibido.
export const IDENTITY_REPLY =
  'Sou o assistente da PIPPA, do Sebrae Paraíba. Não posso compartilhar detalhes técnicos ' +
  'sobre como fui construído, mas posso ajudar com políticas públicas e os indicadores do ' +
  'seu município.'

// Fornecedores, modelos e intermediários de LLM. Fica de fora de propósito o
// que é palavra comum no domínio: "meta" (a meta do projeto, etapa 7 do
// Formulador) e "google" (fonte de dado legítima). Nome novo aqui não pode ser
// termo corrente em pt-BR — a resposta inteira vira a frase fixa, e um falso
// positivo apaga uma resposta boa sem aviso.
const MODEL_IDENTITY_PATTERN =
  /\b(?:nvidia|nemotron|openrouter|openai|chatgpt|gpt(?:-?\d\w*)?|anthropic|claude|gemini|llama|qwen|deepseek|mistral)\b/i

export function revealsModelIdentity(text: string): boolean {
  return MODEL_IDENTITY_PATTERN.test(text)
}
