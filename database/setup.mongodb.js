// Setup do banco da OPP: cria as 5 coleções (com validadores de schema) e os
// índices. Idempotente — pode rodar quantas vezes quiser.
//
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script
// ANTES dos scripts de seed (database/seed/*.mongodb.js).
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db

// validationAction: 'warn' => o validador documenta o schema e registra avisos,
// mas não bloqueia escrita (seguro para evoluir). Troque para 'error' quando o
// schema estiver estável e você quiser rejeitar documentos fora do padrão.
function ensureCollection(name, jsonSchema) {
  const validator = { $jsonSchema: jsonSchema }
  if (database.getCollectionNames().includes(name)) {
    database.runCommand({ collMod: name, validator, validationLevel: 'moderate', validationAction: 'warn' })
    print(`coleção '${name}': validador atualizado`)
  } else {
    database.createCollection(name, { validator, validationLevel: 'moderate', validationAction: 'warn' })
    print(`coleção '${name}': criada`)
  }
}

// --- municipalities: 1 doc por município (IBGE). _id = código IBGE (string). ---
ensureCollection('municipalities', {
  bsonType: 'object',
  required: ['_id', 'name', 'slug'],
  properties: {
    _id: { bsonType: 'string', description: 'código IBGE de 7 dígitos' },
    name: { bsonType: 'string' },
    slug: { bsonType: 'string' },
    rfCode: { bsonType: ['string', 'null'], description: 'código de município da Receita Federal (id_municipio_rf); usado pelo ETL do lake (RF Estabelecimentos)' },
  },
})

// --- agendas: estrutura fixa das 6 agendas da OPP. _id = id da agenda. ---
ensureCollection('agendas', {
  bsonType: 'object',
  required: ['_id', 'name', 'order'],
  properties: {
    _id: { bsonType: 'string' },
    name: { bsonType: 'string' },
    order: { bsonType: ['int', 'long', 'double'] },
  },
})

// --- indicators: catálogo de indicadores. Um mesmo indicador pode aparecer em
// mais de uma seção (agenda e/ou socialeconomic) via `placements`. ---
ensureCollection('indicators', {
  bsonType: 'object',
  required: ['_id', 'label', 'placements'],
  properties: {
    _id: { bsonType: 'string' },
    label: { bsonType: 'string' },
    threshold: {
      bsonType: 'object',
      description: 'régua de classificação; o status do indicador deriva dela',
      properties: {
        kind: { enum: ['higher-better', 'lower-better', 'enum'] },
        success: { bsonType: ['double', 'int'] },
        warning: { bsonType: ['double', 'int'] },
        map: { bsonType: 'object' },
      },
    },
    referenceYear: { bsonType: 'string', description: 'ano de referência exibido por padrão (vintage); o autoritativo por município está em indicatorValues.referenceYear' },
    unit: { bsonType: 'string', description: 'unidade/escala de exibição (ex: "h", "%", "R$", "índice (0–10)")' },
    description: { bsonType: 'string' },
    source: { bsonType: 'string' },
    sourceDataset: { bsonType: 'string' },
    placements: {
      bsonType: 'array',
      description: 'seções onde o indicador é exibido',
      items: {
        bsonType: 'object',
        required: ['section'],
        properties: {
          section: { enum: ['agenda', 'socialeconomic'] },
          agendaId: { bsonType: 'string', description: "ref agendas._id (quando section='agenda')" },
          order: { bsonType: ['int', 'long', 'double'] },
        },
      },
    },
  },
})

// --- indicatorValues: 1 doc por (município × indicador). ---
ensureCollection('indicatorValues', {
  bsonType: 'object',
  required: ['municipalityId', 'indicatorId', 'rawValue', 'referenceYear', 'isFictional'],
  properties: {
    municipalityId: { bsonType: 'string', description: 'ref municipalities._id (IBGE)' },
    indicatorId: { bsonType: 'string', description: 'ref indicators._id' },
    rawValue: { bsonType: 'string', description: 'valor de exibição em padrão BR (ex: "0,763")' },
    numericValue: { bsonType: ['double', 'int', 'null'], description: 'valor numérico parseado' },
    variation: {
      bsonType: ['object', 'string', 'null'],
      description:
        'variação vs. observação anterior da série (cards socialeconomic); opcional. ' +
        'Objeto estruturado { deltaPct, previousValue, previousYear, basis } quando há ' +
        'variação; string vazia/ausente quando não há (ex.: séries decenais idh-m/gini).',
      properties: {
        deltaPct: { bsonType: ['double', 'int'], description: 'delta percentual vs. período anterior' },
        previousValue: { bsonType: ['double', 'int'], description: 'valor da observação anterior' },
        previousYear: { bsonType: 'string', description: 'ano da observação anterior' },
        basis: {
          enum: ['edicao-anterior', 'yoy', 'yoy-media-anual'],
          description: 'cadência da comparação (varia por indicador)',
        },
      },
    },
    referenceYear: { bsonType: 'string', description: 'ano a que o dado se refere (vintage); faz parte da chave (histórico)' },
    source: { bsonType: ['string', 'null'] },
    isFictional: { bsonType: 'bool', description: 'true = dado de demonstração' },
    breakdown: { bsonType: 'object', description: 'sub-índices opcionais (ex: IDH-M e/l/r)' },
    updatedAt: { bsonType: 'date', description: 'timestamp de carga/atualização do registro no banco (NÃO é o ano do dado — esse é referenceYear)' },
  },
})

// --- emendas: emendas parlamentares por município × esfera (federal/estadual). ---
// Fica FORA de indicatorValues de propósito: não é indicador de agenda (não tem
// threshold nem semáforo) e o shape é outro — empenhado/pago com quebra por ano.
// Alimenta o modo "Mapeamento de recursos". Federal e estadual são docs separados
// porque a qualidade da atribuição municipal é diferente (ver `atribuicao`).
ensureCollection('emendas', {
  bsonType: 'object',
  required: ['_id', 'escopo', 'esfera', 'empenhado', 'pago', 'referenceYear', 'isFictional'],
  properties: {
    _id: { bsonType: 'string', description: "'<IBGE>:<esfera>' ou 'PB:<esfera>' para o estado" },
    escopo: { enum: ['municipio', 'estado'] },
    municipalityId: {
      bsonType: ['string', 'null'],
      description: "ref municipalities._id (IBGE); null quando escopo='estado'",
    },
    esfera: { enum: ['federal', 'estadual'] },
    valor: {
      bsonType: ['double', 'int'],
      description:
        'R$ destinado pela emenda (valor aprovado) — só no estadual, onde a origem publica ' +
        'esse número à parte da execução. No federal não existe: lá só há empenhado/pago',
    },
    empenhado: { bsonType: ['double', 'int'], description: 'R$ empenhado acumulado na janela' },
    pago: { bsonType: ['double', 'int'], description: 'R$ pago acumulado na janela' },
    rawEmpenhado: { bsonType: 'string', description: 'valor de exibição (ex: "R$ 195,14 mi")' },
    rawPago: { bsonType: 'string' },
    porAno: {
      bsonType: 'object',
      description:
        'quebra anual { "2024": { empenhado, pago } }. ATENÇÃO: o eixo muda por esfera — no ' +
        'FEDERAL é o ano do DOCUMENTO de despesa (quando o dinheiro se moveu), no ESTADUAL é ' +
        'a safra da emenda (a origem publica a execução agregada, sem data de documento). ' +
        'Não comparar as duas séries como se fossem a mesma coisa',
    },
    naoMunicipalizado: {
      bsonType: 'object',
      description:
        "só em escopo='estado': parcela de aplicação estadual/nacional que não entra em " +
        'nenhum dos 223 municípios',
    },
    nEmendas: { bsonType: ['int', 'long', 'double'] },
    nAutores: { bsonType: ['int', 'long', 'double'] },
    janela: { bsonType: 'object', description: '{ de, ate } — safra das emendas consideradas' },
    atribuicao: {
      enum: ['ibge', 'texto-beneficiario'],
      description:
        "como o município foi determinado. 'ibge' = campo estruturado na origem (federal, " +
        "exato). 'texto-beneficiario' = inferido do texto livre do objeto da emenda " +
        '(estadual, aproximado) — a UI deve rotular como estimativa',
    },
    referenceYear: { bsonType: 'string' },
    source: { bsonType: ['string', 'null'] },
    isFictional: { bsonType: 'bool', description: 'true = dado de demonstração' },
    updatedAt: { bsonType: 'date' },
  },
})

// --- Índices (createIndex é idempotente) ---
database.municipalities.createIndex({ slug: 1 }, { unique: true, name: 'uniq_slug' })

database.indicators.createIndex({ 'placements.section': 1 }, { name: 'by_placement_section' })

// chave natural / chave de upsert dos valores — 1 doc por município×indicador×ano
// (inclui o ano para suportar série histórica: ex. IDH-M 2010 e 2022 lado a lado).
// Remove o índice antigo {municipalityId, indicatorId} se existir, antes de recriar.
if (database.indicatorValues.getIndexes().some((i) => i.name === 'uniq_municipio_indicador')) {
  database.indicatorValues.dropIndex('uniq_municipio_indicador')
  print("índice antigo 'uniq_municipio_indicador' removido")
}
database.indicatorValues.createIndex(
  { municipalityId: 1, indicatorId: 1, referenceYear: 1 },
  { unique: true, name: 'uniq_municipio_indicador_ano' },
)
// consultas "todos os municípios de um indicador num ano" (ex: colorir o mapa)
database.indicatorValues.createIndex({ indicatorId: 1, referenceYear: 1 }, { name: 'by_indicador_ano' })

// emendas: "todos os municípios de uma esfera" (colorir o mapa) e lookup por município.
database.emendas.createIndex({ esfera: 1, escopo: 1 }, { name: 'by_esfera_escopo' })
database.emendas.createIndex({ municipalityId: 1, esfera: 1 }, { name: 'by_municipio_esfera' })

print('setup concluído: 5 coleções + índices prontos.')
