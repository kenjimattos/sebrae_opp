export const DATAPEDIA_URL =
  'https://datapedia.info/sebrae/conexao/po5aavozprm7z6+-ppswzktavzqb1p3k/ta6dedoanvp1a5d96p6hv9dq77dp64ia'

// Rótulos e textos do modo "Mapeamento de recursos". Os NÚMEROS não moram mais
// aqui: vêm de GET /api/emendas (ETLs em database/scripts/gerar_seed_emendas_*.py).
// Antes desta versão havia cinco valores estáticos do estado inteiro que já
// estavam defasados — o total pago, por exemplo, tinha saltado de 3,3 para 4,3 bi.

export const resourcesContent = {
  emendas: {
    title: 'Emendas federais e estaduais mapeadas',
    description:
      'Recursos destinados por parlamentares que podem financiar projetos estruturantes no município. Clique num município do mapa para ver os valores; passe o mouse para comparar.',
  },
  esferas: {
    federal: {
      label: 'Federais',
      titulo: 'Emendas federais',
      autores: 'deputados federais e senadores',
      // completa a frase "Pago …" acima da série anual
      notaAno: 'por ano do desembolso',
      qualidade: null as string | null,
    },
    estadual: {
      label: 'Estaduais',
      titulo: 'Emendas estaduais (ALPB)',
      autores: 'deputados estaduais',
      notaAno: 'por safra da emenda',
      qualidade:
        'Estimativa: a origem estadual não informa o município de destino em campo próprio — ele é inferido do texto da emenda. Cobre {cobertura} do valor; o restante vai para entidades e órgãos estaduais.',
    },
  },
  metricas: {
    empenhado: 'Empenhado',
    pago: 'Pago',
  },
  mapa: {
    legendaTitulo: 'Valor pago por município',
    legendaMenor: 'menor',
    legendaMaior: 'maior',
    semSelecao: 'Selecione um município no mapa ou no seletor acima',
  },
  estado: {
    titulo: 'Paraíba',
    // Frase curta: o resumo divide a linha com o botão do Datapedia, então
    // precisa caber em uma ou duas linhas estreitas.
    naoMunicipalizadoFederal: 'em aplicação estadual ou nacional',
    naoMunicipalizadoEstadual: 'para entidades e órgãos estaduais',
  },
  distribuicao: {
    description: 'Veja como os recursos federais estão distribuídos entre os municípios do estado.',
    mapAlt: 'Mapa de distribuição territorial das emendas — Datapedia',
    overlayLabel: 'Explorar emendas',
  },
  editais: {
    title: 'Editais e programas de financiamento',
    description:
      'Programas federais, estaduais e institucionais com recursos disponíveis para desenvolvimento econômico, inovação e fortalecimento de pequenos negócios.',
  },
  buttons: {
    explorarEmendas: 'Explorar emendas no Datapedia',
    verOportunidades: 'Ver oportunidades',
  },
} as const
