import type { IndicatorValueDoc, StatusType, Threshold } from '../types/index.js'

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
// Qual dos dois números a régua lê.
//
// Faixa OFICIAL classifica `numericValue`, o valor na unidade da fonte — é o
// comportamento de sempre. Faixa RELATIVA (`provenance: 'relativo-pb'`, cortes
// por tercil entre os 223 municípios da PB) classifica `normalizedValue`, e só
// ele: metade desses indicadores é contagem bruta, que não se compara entre
// municípios porque mede o tamanho do município, não o desempenho. Cair no
// bruto quando falta o normalizado mediria uma contagem contra uma régua per
// capita — a mesma classe de erro que o bloco acima descreve para o rawValue,
// e com a mesma cara de funcionar.
//
// Daí `null` aqui ter um segundo significado, deliberado: **sem base de
// comparação**, que não é zero. É como os 109 municípios sem emissão de alvará
// na janela e os 73 sem contrato público a PJ saem do semáforo sem sumir da
// tela — eles seguem exibindo o valor, apenas não são classificados.
export function classifiedNumber(
  threshold: Threshold | undefined,
  value: Pick<IndicatorValueDoc, 'numericValue' | 'normalizedValue'> | undefined,
): number | null {
  if (!threshold || !value) return null
  const n =
    threshold.provenance === 'relativo-pb'
      ? value.normalizedValue
      : value.numericValue
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export function computeStatus(
  threshold: Threshold | undefined,
  value:
    | Pick<IndicatorValueDoc, 'rawValue' | 'numericValue' | 'normalizedValue'>
    | undefined,
): StatusType {
  if (!threshold || !value) return 'none'

  // 'enum' é o único caso que classifica por texto — a faixa é um mapa de
  // rótulos, não de números.
  if (threshold.kind === 'enum') {
    return threshold.map[String(value.rawValue ?? '').trim()] ?? 'none'
  }

  const n = classifiedNumber(threshold, value)
  // Sem número = sem medida (ex.: os 27 municípios 'sem-dados' da Redesim, que
  // gravam numericValue: null). Não se reconstrói o valor a partir do rawValue:
  // `numericValue` é obrigatório no schema (database/setup.mongodb.js), então a
  // falta dele é ausência de dado — não licença para adivinhar a partir de um
  // texto que já perdeu casas decimais.
  if (n === null) return 'none'

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
