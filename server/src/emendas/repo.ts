import { getDb } from '../infra/db.js'
import type { EmendaDoc } from '../types/index.js'

// Todas as emendas (224 docs por esfera = ~448). O conjunto é pequeno e a rota
// devolve o estado inteiro de uma vez para o mapa, então não vale paginar nem
// filtrar por município aqui.
export async function listEmendas(): Promise<EmendaDoc[]> {
  return getDb().collection<EmendaDoc>('emendas').find().toArray()
}
