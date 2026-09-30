import { getDb } from '../infra/db.js'
import type { StateValueDoc } from '../types/index.js'

// Valores do grão estadual. A coleção é pequena (81 docs hoje: 8 indicadores com
// série histórica onde a fonte tem), e a rota devolve o estado inteiro de uma vez
// — a visão estadual mostra tudo junto, incluindo as séries. Não vale paginar.
export async function listStateValues(uf: string): Promise<StateValueDoc[]> {
  return getDb().collection<StateValueDoc>('stateValues').find({ uf }).toArray()
}
