// Dados dos casos de sucesso — arquivo separado para fácil edição
// Fonte: artigos publicados em geocracia.com (CTA encaminha para a URL original)

export interface CasoSucesso {
  id: string
  cidade: string
  titulo: string
  descricao: string
  imagem: string
  url: string
}

export const casosSucesso: CasoSucesso[] = [
  {
    id: 'ponte-digital-para',
    cidade: 'PARÁ - PA',
    titulo: 'Corregedoria integra cadastro rural a cartórios',
    descricao:
      'Projeto Ponte Digital conecta via API o cadastro rural aos cartórios, automatizando títulos fundiários e ampliando o acesso ao registro formal.',
    imagem: '/images/cases/ponte-digital-para.png',
    url: 'https://geocracia.com/corregedoria-do-para-integra-cadastro-rural-a-cartorios-com-projeto-ponte-digital/',
  },
  {
    id: 'terraink-mapas-posters',
    cidade: 'BRASIL',
    titulo: 'Ferramenta gratuita transforma mapas em posters',
    descricao:
      'TerraInk gera posters cartográficos personalizados a partir de dados abertos do OpenStreetMap, democratizando o acesso à geoinformação.',
    imagem: '/images/cases/terraink-mapas-posters.png',
    url: 'https://geocracia.com/ferramenta-gratuita-transforma-mapas-em-posters-personalizados-a-partir-de-dados-abertos/',
  },
  {
    id: 'atlas-hidrogenio-verde-rn',
    cidade: 'RIO GRANDE DO NORTE - RN',
    titulo: 'Atlas do hidrogênio verde orienta investimentos',
    descricao:
      'RN lança Atlas do Hidrogênio Verde com dados técnicos que mapeiam áreas estratégicas e atraem investimentos em energia renovável.',
    imagem: '/images/cases/atlas-hidrogenio-verde-rn.jpg',
    url: 'https://geocracia.com/atlas-do-hidrogenio-verde-mapeia-areas-estrategicas-e-orienta-novos-investimentos-no-rio-grande-do-norte/',
  },
  {
    id: 'credito-rural-geoespacial',
    cidade: 'BRASIL',
    titulo: 'Crédito rural entra na era geoespacial',
    descricao:
      'Resolução CMN 5.193/24 incorpora critérios territoriais e socioambientais ao crédito agrícola, consolidando dados geoespaciais nas decisões financeiras.',
    imagem: '/images/cases/credito-rural-geoespacial.png',
    url: 'https://geocracia.com/credito-rural-entra-na-era-geoespacial-e-amplia-debate-sobre-uso-de-dados-e-seguranca-juridica/',
  },
]
