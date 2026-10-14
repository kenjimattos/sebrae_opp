import brasilGeo from './brasil.json'

export interface Uf {
  /** Código IBGE de 2 dígitos. */
  id: string
  name: string
}

/** A única UF com dados. As outras são listadas, mas não selecionáveis. */
export const PB_UF_ID = '25'

/** As 27 UFs em ordem alfabética, lidas da própria malha — uma fonte só. */
export const UFS: Uf[] = brasilGeo.features
  .map((f) => ({ id: f.properties.id, name: f.properties.name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
