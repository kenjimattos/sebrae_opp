// Cache de resposta pronta, em memória do processo. Mesma ideia do
// catalog-cache.ts, com duas diferenças que importam sob carga:
//
// 1. **Guarda a Promise, não o valor.** Cem requisições simultâneas com o cache
//    frio compartilham uma única leitura do banco — a segunda em diante espera a
//    primeira em vez de abrir a sua. Sem isso, o pico de acesso vira pico de
//    query, que é exatamente o momento em que o banco não pode receber um.
// 2. **Tem TTL.** O catálogo só muda em deploy do ETL e pode viver para sempre;
//    os valores por município mudam quando o ETL roda, sem avisar a API. O TTL é
//    o preço de não precisar reiniciar o serviço depois de cada carga.
//
// Erro não fica cacheado: a entrada é removida, e a próxima requisição tenta de
// novo. É o que faz o 503 de `emendas` voltar a 200 assim que os seeds rodam,
// em vez de ficar preso pelo TTL inteiro.
const TTL_MS = Number(process.env.PAYLOAD_CACHE_TTL_MS ?? 5 * 60_000)

interface Entry {
  at: number
  value: Promise<unknown>
}

const entries = new Map<string, Entry>()

export function cachedPayload<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>

  const value = load().catch((err) => {
    entries.delete(key)
    throw err
  })
  entries.set(key, { at: Date.now(), value })
  return value
}

export function invalidatePayloads(): void {
  entries.clear()
}

// Segundos de `Cache-Control` para as rotas de leitura. Alinhado ao TTL: não
// adianta o servidor segurar 5 min e mandar o navegador perguntar de novo a cada
// clique — trocar de município e voltar deve sair da memória do navegador.
export const CACHE_SECONDS = Math.round(TTL_MS / 1000)
