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
    buttonHref: '/formulador',
  }
]
