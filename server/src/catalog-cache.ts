import { loadCatalog, type Catalog } from './repo.js'

// A estrutura (agendas + indicadores + placements) muda raramente e é igual para
// todos os municípios. Carrega uma vez e reutiliza. Chame invalidate() se um
// deploy do ETL alterar o catálogo sem reiniciar a API.
let cached: Promise<Catalog> | null = null

export function getCatalog(): Promise<Catalog> {
  if (!cached) cached = loadCatalog()
  return cached
}

export function invalidateCatalog(): void {
  cached = null
}
