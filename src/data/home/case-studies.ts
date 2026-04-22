// Dados dos casos de sucesso — arquivo separado para fácil edição
// Fonte: artigos publicados em geocracia.com (CTA encaminha para a URL original)

export interface CaseStudy {
  id: string
  city: string
  title: string
  description: string
  image: string
  url: string
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'ponte-digital-para',
    city: 'PARÁ - PA',
    title: 'Corregedoria integra cadastro rural a cartórios',
    description:
      'Projeto Ponte Digital conecta via API o cadastro rural aos cartórios, automatizando títulos fundiários e ampliando o acesso ao registro formal.',
    image: '/images/cases/ponte-digital-para.png',
    url: 'https://geocracia.com/corregedoria-do-para-integra-cadastro-rural-a-cartorios-com-projeto-ponte-digital/',
  },
  {
    id: 'terraink-mapas-posters',
    city: 'BRASIL',
    title: 'Ferramenta gratuita transforma mapas em posters',
    description:
      'TerraInk gera posters cartográficos personalizados a partir de dados abertos do OpenStreetMap, democratizando o acesso à geoinformação.',
    image: '/images/cases/terraink-mapas-posters.png',
    url: 'https://geocracia.com/ferramenta-gratuita-transforma-mapas-em-posters-personalizados-a-partir-de-dados-abertos/',
  },
  {
    id: 'atlas-hidrogenio-verde-rn',
    city: 'RIO GRANDE DO NORTE - RN',
    title: 'Atlas do hidrogênio verde orienta investimentos',
    description:
      'RN lança Atlas do Hidrogênio Verde com dados técnicos que mapeiam áreas estratégicas e atraem investimentos em energia renovável.',
    image: '/images/cases/atlas-hidrogenio-verde-rn.jpg',
    url: 'https://geocracia.com/atlas-do-hidrogenio-verde-mapeia-areas-estrategicas-e-orienta-novos-investimentos-no-rio-grande-do-norte/',
  },
  {
    id: 'credito-rural-geoespacial',
    city: 'BRASIL',
    title: 'Crédito rural entra na era geoespacial',
    description:
      'Resolução CMN 5.193/24 incorpora critérios territoriais e socioambientais ao crédito agrícola, consolidando dados geoespaciais nas decisões financeiras.',
    image: '/images/cases/credito-rural-geoespacial.png',
    url: 'https://geocracia.com/credito-rural-entra-na-era-geoespacial-e-amplia-debate-sobre-uso-de-dados-e-seguranca-juridica/',
  },
]
