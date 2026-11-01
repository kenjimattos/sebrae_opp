import { loadCatalog, type Catalog } from './catalog.js'

// A estrutura (agendas + indicadores + placements) muda raramente e é igual para
// todos os municípios. Carrega uma vez e reutiliza. Nada chama invalidateCatalog()
// hoje: catálogo alterado pelo ETL só aparece reiniciando a API.
let cached: Promise<Catalog> | null = null

export function getCatalog(): Promise<Catalog> {
  if (!cached) cached = loadCatalog()
  return cached
}

export function invalidateCatalog(): void {
  cached = null
}
