export interface FormuladorCardData {
  titulo: string
  descricao: string
  buttonLabel: string
  buttonHref: string
}

export const formuladorCards: FormuladorCardData[] = [
  {
    titulo: 'Assistente de formulação de projetos',
    descricao: 'A IA analisa os principais desafios do município e sugere caminhos para estruturar um projeto de desenvolvimento local.',
    buttonLabel: 'Começar com a ajuda da IA',
    buttonHref: '#',
  },
  {
    titulo: 'Modelos de projeto',
    descricao: 'Acesse formatos estruturados como plano de ação, programas de apoio a pequenos negócios e projetos de captação de recursos.',
    buttonLabel: 'Ver modelos',
    buttonHref: '#',
  },
]
