// Ponto único de import dos tipos do servidor (`from '../types/index.js'`).
// A separação em dois arquivos é por motivo de mudança: `docs.ts` acompanha o
// ETL, `api.ts` acompanha o frontend.
export type * from './docs.js'
export type * from './api.js'
