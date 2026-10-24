// Dados das boas práticas — arquivo separado para fácil edição
// Fonte: curadoria "Boas Práticas PIPPA" (CTA encaminha para a URL original)

export interface CaseStudy {
  id: string
  city: string
  title: string
  description: string
  /** Ausente quando a fonte não oferece imagem utilizável; o cartão mostra um bloco neutro. */
  image?: string
  url: string
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'premio-prefeitura-empreendedora',
    city: 'BRASIL',
    title: 'Prêmio reconhece 27 municípios por melhora no ambiente de negócios',
    description:
      'A 13ª edição do Prêmio Sebrae Prefeitura Empreendedora recebeu 2.818 iniciativas de 1.934 municípios e premiou projetos em nove categorias, de compras governamentais a simplificação.',
    image: '/images/cases/premio-prefeitura-empreendedora.webp',
    url: 'https://agenciasebrae.com.br/economia-e-politica/conheca-os-municipios-reconhecidos-por-apoiar-o-empreendedorismo-brasileiro/',
  },
  {
    id: 'queimadas-casas-do-empreendedor',
    city: 'PARAÍBA - PB',
    title: 'Casas do Empreendedor descentralizam atendimento ao pequeno negócio',
    description:
      'Projeto municipal vence a categoria Sala do Empreendedor no Prêmio Sebrae e leva o atendimento ao empreendedor para fora da sede da prefeitura.',
    image: '/images/cases/queimadas-casas-do-empreendedor.jpg',
    url: 'https://agenciasebrae.com.br/economia-e-politica/sebrae-revela-os-vencedores-do-xi-premio-sebrae-prefeito-empreendedor/',
  },
  {
    id: 'indaial-sala-do-empreendedor',
    city: 'SANTA CATARINA - SC',
    title: 'Sala do Empreendedor concentra todo o cadastro de empresas',
    description:
      'Município integra a abertura de negócios num só ponto de atendimento e mobiliza pequenos negócios para as licitações, somando mais de R$ 13 milhões em compras da prefeitura.',
    image: '/images/cases/indaial-sala-do-empreendedor.webp',
    url: 'https://agenciasebrae.com.br/?p=3418',
  },
  {
    id: 'guarapuava-educacao-para-o-futuro',
    city: 'PARANÁ - PR',
    title: 'Programa municipal leva educação empreendedora à rede pública',
    description:
      'Projeto "Educação para o Futuro" implanta um Programa Municipal de Educação Empreendedora e Inovadora na rede pública e vence a categoria Empreendedorismo na Escola.',
    image: '/images/cases/guarapuava-educacao-para-o-futuro.webp',
    url: 'https://agenciasebrae.com.br/cultura-empreendedora/nove-projetos-vencem-etapa-parana-do-premio-sebrae-prefeitura-empreendedora/',
  },
  {
    id: 'recife-go-mei',
    city: 'PERNAMBUCO - PE',
    title: 'Plataforma municipal de MEIs vira programa nacional',
    description:
      'O GO MEI conecta microempreendedores a serviços de manutenção em prédios públicos e inspira o Contrata+Brasil, do governo federal.',
    image: '/images/cases/recife-go-mei.jpg',
    url: 'https://www.folhape.com.br/economia/governo-federal-adota-plataforma-da-prefeitura-do-recife-em-programa/391076/',
  },
  {
    id: 'contrata-mais-brasil',
    city: 'BRASIL',
    title: 'Plataforma federal abre compras públicas aos MEIs',
    description:
      'Contrata+Brasil elimina edital e estudo preliminar para pequenas contratações, padroniza o processo e mira um mercado de R$ 6 bilhões por ano.',
    image: '/images/cases/contrata-mais-brasil.jpg',
    url: 'https://convergenciadigital.com.br/governo/governo-lanca-plataforma-online-para-compras-publicas-de-meis-e-mira-em-r-6-bilhoes-por-ano',
  },
  {
    id: 'licenciamento-zero-portugal',
    city: 'PORTUGAL',
    title: 'Licenciamento Zero troca alvará por comunicação prévia',
    description:
      'Balcão único digital substitui a autorização prévia por mera comunicação para abrir estabelecimentos, num regime construído entre governo central e municípios.',
    image: '/images/cases/licenciamento-zero-portugal.jpg',
    url: 'https://sabiasque.pt/tecnologia/noticias/2160-nova-versao-do-licenciamento-zero-arranca-em-abrantes-agueda-e-tavira.html',
  },
  {
    id: 'nossocredito-es',
    city: 'ESPÍRITO SANTO - ES',
    title: 'Microcrédito orientado chega a R$ 1 bilhão em 20 anos',
    description:
      'Programa estadual oferta microcrédito com orientação técnica em todos os 78 municípios, com agente de crédito que analisa, orienta a aplicação e acompanha o investimento.',
    image: '/images/cases/nossocredito-es.jpg',
    url: 'https://www.es.gov.br/Noticia/programa-nossocredito-completa-20-anos-e-alcanca-a-marca-de-1-bilhao-em-microcredito-concedido',
  },
]
