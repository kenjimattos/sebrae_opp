import brasilGeo from './brasil.json'

export interface Uf {
  /** Código IBGE de 2 dígitos. */
  id: string
  name: string
  /** "da Paraíba", "do Ceará", "de Pernambuco" — ver PREPOSICOES. */
  preposicao: Preposicao
}

export type Preposicao = 'da' | 'do' | 'de'

/** A única UF com dados. As outras são listadas, mas não selecionáveis. */
export const PB_UF_ID = '25'

// Contração com o artigo do nome: feminino "da", masculino "do", e "de" para os
// nomes que não levam artigo (Pernambuco, Goiás, São Paulo…). Mato Grosso e
// Mato Grosso do Sul ficam em "de", a forma dos próprios governos estaduais.
// Não dá para derivar do nome — "Pará" leva artigo e "Goiás" não —, então é
// tabela, conferida uma a uma.
const PREPOSICOES: Record<string, Preposicao> = {
  '11': 'de', // Rondônia
  '12': 'do', // Acre
  '13': 'do', // Amazonas
  '14': 'de', // Roraima
  '15': 'do', // Pará
  '16': 'do', // Amapá
  '17': 'do', // Tocantins
  '21': 'do', // Maranhão
  '22': 'do', // Piauí
  '23': 'do', // Ceará
  '24': 'do', // Rio Grande do Norte
  '25': 'da', // Paraíba
  '26': 'de', // Pernambuco
  '27': 'de', // Alagoas
  '28': 'de', // Sergipe
  '29': 'da', // Bahia
  '31': 'de', // Minas Gerais
  '32': 'do', // Espírito Santo
  '33': 'do', // Rio de Janeiro
  '35': 'de', // São Paulo
  '41': 'do', // Paraná
  '42': 'de', // Santa Catarina
  '43': 'do', // Rio Grande do Sul
  '50': 'de', // Mato Grosso do Sul
  '51': 'de', // Mato Grosso
  '52': 'de', // Goiás
  '53': 'do', // Distrito Federal
}

/** As 27 UFs em ordem alfabética, lidas da própria malha — uma fonte só. */
export const UFS: Uf[] = brasilGeo.features
  .map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    preposicao: PREPOSICOES[f.properties.id] ?? 'de',
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
