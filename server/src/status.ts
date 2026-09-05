import type { IndicatorValueDoc, StatusType, Threshold } from './types.js'

// A régua da classificação NÃO é tabela hardcoded: vem do campo `threshold` de
// cada documento em `indicators`. O banco é a fonte única.
//
// E o número classificado é `numericValue`, NUNCA `rawValue`. O ETL calcula um
// float por município e deriva os dois campos dele: `numericValue` guarda o
// número com a precisão da fonte, `rawValue` é a string de exibição — em padrão
// BR, com unidade, arredondada. Os cortes oficiais discriminam justamente na
// casa que o arredondamento come: um IGM de 5,008 é exibido "5,01" e o corte do
// CFA é 5,01. Classificar pelo texto erra para o lado otimista. Hoje nenhum
// semáforo servido muda com isso (as divergências do banco estão em anos que
// `pickValue` não retorna ou em valores suprimidos por `isLowConfidence`), mas
// a classe de erro voltaria a cada avanço do ano de referência default.
export function computeStatus(
  threshold: Threshold | undefined,
  value: Pick<IndicatorValueDoc, 'rawValue' | 'numericValue'> | undefined,
): StatusType {
  if (!threshold || !value) return 'none'

  // 'enum' é o único caso que classifica por texto — a faixa é um mapa de
  // rótulos, não de números.
  if (threshold.kind === 'enum') {
    return threshold.map[String(value.rawValue ?? '').trim()] ?? 'none'
  }

  const n = value.numericValue
  // Sem número = sem medida (ex.: os 27 municípios 'sem-dados' da Redesim, que
  // gravam numericValue: null). Não se reconstrói o valor a partir do rawValue:
  // `numericValue` é obrigatório no schema (database/setup.mongodb.js), então a
  // falta dele é ausência de dado — não licença para adivinhar a partir de um
  // texto que já perdeu casas decimais.
  if (typeof n !== 'number' || !Number.isFinite(n)) return 'none'

  if (threshold.kind === 'higher-better') {
    if (n >= threshold.success) return 'success'
    if (n >= threshold.warning) return 'warning'
    return 'alert'
  }

  // lower-better
  if (n <= threshold.success) return 'success'
  if (n <= threshold.warning) return 'warning'
  return 'alert'
}
