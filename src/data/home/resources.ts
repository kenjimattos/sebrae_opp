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
  funcao: {
    titulo: {
      federal: 'Emendas federais por função',
      estadual: 'Emendas estaduais por função',
    },
    subtitulo: 'acumulado de empenhado e pago',
    caption: {
      federal: 'Emendas federais do município por função orçamentária',
      estadual: 'Emendas estaduais do município por função orçamentária',
    },
    colunas: { funcao: 'Função', emAberto: 'Em aberto' },
    // Federal: o pago por função é o da emenda inteira (a função do empenho), não o da
    // linha de pagamento, que a origem rotula "Múltiplo". Estadual: a função vem exata
    // da execução, mas o município é inferido do texto — a ressalva é a do card.
    nota: {
      federal:
        'Cada emenda conta na função em que foi empenhada. Em aberto = empenhado menos pago.',
      estadual:
        'Estimativa: o município é inferido do texto da emenda. Em aberto = empenhado menos pago.',
    },
  },
  mapa: {
    legendaTitulo: 'Valor pago por município',
    legendaMenor: 'menor',
    legendaMaior: 'maior',
    semSelecao: 'Selecione um município no mapa ou no seletor acima',
  },
  estado: {
    titulo: 'Paraíba',
    naoMunicipalizadoFederal: 'em aplicação estadual ou nacional',
    naoMunicipalizadoEstadual: 'para entidades e órgãos estaduais',
  }
} as const
