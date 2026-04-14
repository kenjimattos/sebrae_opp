// Dados dos casos de sucesso — arquivo separado para fácil edição
// Imagens: substituir pelos assets reais quando disponíveis

export interface CasoSucesso {
  id: string
  cidade: string
  titulo: string
  descricao: string
  imagem: string
}

export const casosSucesso: CasoSucesso[] = [
  {
    id: 'belo-horizonte',
    cidade: 'BELO HORIZONTE - MG',
    titulo: 'Tempo médio caiu de 12 para 3 dias',
    descricao: 'Redução de 70% no tempo de abertura de empresas',
    imagem: '/images/cases/belo-horizonte.jpg',
  },
  {
    id: 'maringa',
    cidade: 'MARINGÁ - PR',
    titulo: 'Polo de inovação referência no sul do país',
    descricao: '87 startups incubadas e conexão direta entre universidades e pequenos negócios de tecnologia',
    imagem: '/images/cases/maringa.jpg',
  },
  {
    id: 'sobral',
    cidade: 'SOBRAL - CE',
    titulo: 'Educação como motor do desenvolvimento',
    descricao: 'Município saiu da 1.366ª posição para o top 10 do IDEB, atraindo investimentos e gerando emprego qualificado',
    imagem: '/images/cases/sobral.jpg',
  },
  {
    id: 'joinville',
    cidade: 'JOINVILLE - SC',
    titulo: 'Da indústria tradicional ao ecossistema tech',
    descricao: 'Reinvenção do parque industrial com foco em tecnologia e inovação, gerando 4.500 novos empregos no setor',
    imagem: '/images/cases/joinville.jpg',
  },
  {
    id: 'vitoria-conquista',
    cidade: 'VITÓRIA DA CONQUISTA - BA',
    titulo: 'Hub regional de saúde e serviços',
    descricao: 'Investimento em infraestrutura de saúde transformou a cidade em referência para 80 municípios do entorno',
    imagem: '/images/cases/vitoria-conquista.jpg',
  },
]
