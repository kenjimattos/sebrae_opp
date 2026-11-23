// Termos de uso e aviso de privacidade da PIPPA — RASCUNHO para revisão do
// jurídico do Sebrae. Conteúdo editorial: mudou o texto de forma que o usuário
// precise ler de novo, mude também `TERMS_VERSION` (version.ts).
//
// Os trechos entre colchetes (`A_CONFIRMAR`) são dados que só o Sebrae sabe
// (razão social, canal do encarregado, foro) e NÃO podem ir a produção assim:
// o teste de `terms.test.ts` lista quantos faltam.

export const A_CONFIRMAR = '[a confirmar com o jurídico do Sebrae]'

export interface TermsSection {
  id: string
  title: string
  paragraphs: string[]
  items?: string[]
}

// Id do elemento de cada seção: âncora do índice e alvo do IntersectionObserver.
export const termsSectionId = (id: string) => `termos-${id}`

export const TERMS_TITLE = 'Termos de uso e aviso de privacidade'

export const TERMS_INTRO =
  'A PIPPA (Plataforma de Inteligência de Políticas Públicas Aplicada) é uma ferramenta do Sebrae Paraíba para apoiar quem formula e acompanha políticas públicas de desenvolvimento dos pequenos negócios. Ao entrar, você concorda com as regras abaixo.'

// "Em resumo": o que importa, em quatro linhas, antes do texto legal. NÃO substitui
// os termos — mexeu em uma seção que muda o sentido de uma destas linhas, mexa aqui.
export const TERMS_SUMMARY: string[] = [
  'Os dados são públicos e vêm de fontes oficiais. Confira na fonte antes de decidir.',
  'A IA pode errar. O que você digita nos campos de IA vai a um provedor contratado pelo Sebrae: não escreva dados pessoais.',
  'Do seu login usamos o identificador da conta e o nome. Guardamos apenas o registro deste aceite.',
  'Se recusar, você sai da plataforma. Se os termos mudarem, pedimos o aceite de novo.',
]

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'o-que-e',
    title: '1. O que é a plataforma',
    paragraphs: [
      'A PIPPA reúne, em um só lugar, indicadores dos 223 municípios da Paraíba e da visão estadual, o mapeamento de emendas parlamentares, trilhas de cursos e boas práticas e um formulador de projetos de política pública.',
      'Ela é uma ferramenta de apoio à decisão. Não substitui estudo técnico, parecer jurídico nem a consulta direta às fontes oficiais.',
    ],
  },
  {
    id: 'acesso',
    title: '2. Acesso e login',
    paragraphs: [
      'O acesso é feito com o login do Sebrae (AMEI). A conta é pessoal e intransferível: você responde pelo que é feito com ela e deve sair da plataforma ao usar um computador compartilhado.',
      'O Sebrae pode suspender o acesso de quem descumprir estes termos ou de quem deixar de ter vínculo que justifique o uso.',
    ],
  },
  {
    id: 'dados-exibidos',
    title: '3. Os dados exibidos',
    paragraphs: [
      'Os indicadores, as emendas e os demais dados vêm de bases públicas e de fontes oficiais, indicadas na própria plataforma. A PIPPA os organiza e apresenta, e a atualização acompanha a publicação de cada fonte: pode haver defasagem, lacunas e correções posteriores pela fonte.',
      'As cores de status (bom, atenção, alerta) têm duas origens, e a plataforma identifica qual é qual. Em alguns indicadores a faixa é a publicada pela própria fonte. Em outros é uma comparação relativa entre os municípios da Paraíba: nesse caso, "bom" significa estar entre os melhores do estado, e não atender a um padrão oficial.',
      'Valores de emendas federais e estaduais não são comparáveis entre si: cada esfera tem metodologia e período próprios.',
    ],
  },
  {
    id: 'ia',
    title: '4. Assistente de inteligência artificial',
    paragraphs: [
      'A plataforma tem recursos de IA (chat, explicação de indicadores, análise do município, leitura de emendas e apoio ao formulador). As respostas são geradas automaticamente, podem conter erros ou imprecisões e não constituem parecer técnico, jurídico ou posição oficial do Sebrae.',
      'Confira sempre os números e as conclusões com as fontes antes de usá-los em um documento, uma decisão ou uma publicação.',
      'Para gerar a resposta, o texto que você digita e os dados do município em tela são enviados a um provedor de inteligência artificial contratado pelo Sebrae. Não digite dados pessoais, sigilosos ou de terceiros nesses campos.',
    ],
  },
  {
    id: 'uso-adequado',
    title: '5. Uso adequado',
    paragraphs: ['Ao usar a PIPPA você se compromete a não:'],
    items: [
      'usar a plataforma, o assistente de IA ou a marca do Sebrae para finalidades alheias ao desenvolvimento municipal e às políticas públicas;',
      'automatizar o acesso (robôs, raspagem, consultas em massa) nem tentar burlar limites, controles de acesso ou mecanismos de segurança;',
      'tentar fazer o assistente ignorar suas instruções, revelar seu funcionamento interno ou produzir conteúdo fora do tema;',
      'compartilhar sua conta ou acessar a conta de outra pessoa;',
      'copiar ou redistribuir o conteúdo da plataforma como se fosse seu, ou de forma que induza a erro sobre a origem dos dados.',
    ],
  },
  {
    id: 'propriedade',
    title: '6. Propriedade intelectual',
    paragraphs: [
      'A plataforma, sua identidade visual e a organização dos dados pertencem ao Sebrae. Os dados de origem pública seguem as condições de uso de cada fonte.',
      'O que você escreve no formulador de projetos é seu. Ele fica salvo apenas no seu navegador e sai do seu computador somente quando você pede ao assistente de IA que o analise ou quando você o exporta.',
    ],
  },
  {
    id: 'privacidade',
    title: '7. Privacidade e dados pessoais (LGPD)',
    paragraphs: [
      `Controlador dos dados pessoais: ${A_CONFIRMAR} (razão social, CNPJ e endereço).`,
      'Que dados pessoais tratamos: o identificador da sua conta no login do Sebrae (AMEI) e o seu nome, para identificar a sessão e exibir seu nome na tela; e o registro do seu aceite destes termos (identificador, versão e data). Não recebemos sua senha, que fica com o AMEI, e não usamos seu e-mail.',
      'Para que usamos: permitir o acesso, comprovar o aceite destes termos e proteger a plataforma contra uso indevido e excesso de consultas. A base legal é a execução do serviço que você pediu ao entrar e o legítimo interesse do Sebrae em manter a plataforma segura.',
      'O que não guardamos: o texto das suas perguntas ao assistente e das respostas não é gravado em nossos registros. O rascunho do formulador fica só no seu navegador.',
      `Seus direitos: você pode pedir confirmação do tratamento, acesso, correção e eliminação dos seus dados, entre outros direitos previstos na Lei nº 13.709/2018. Canal do encarregado pelo tratamento de dados: ${A_CONFIRMAR}.`,
    ],
  },
  {
    id: 'analise-de-uso',
    title: '8. Análise de uso e cookies',
    paragraphs: [
      'Com o seu consentimento, usamos o Microsoft Clarity para entender como a plataforma é usada (mapas de calor e gravações da navegação: cliques, rolagem e telas visitadas) e melhorá-la. O consentimento é separado do aceite destes termos: você pode recusá-lo e continuar usando a plataforma normalmente, e pode revogá-lo quando quiser, no menu da conta. Sem o seu consentimento, o Clarity não é carregado.',
      'As gravações ocultam campos de texto, o que você escreve no formulador de projetos e no assistente de IA, e o seu nome. O Clarity recebe o identificador da sua conta no AMEI, que não revela quem você é, e guarda cookies próprios no seu navegador.',
      'A sua escolha fica guardada neste navegador. Em outro navegador ou computador, perguntamos de novo.',
    ],
  },
  {
    id: 'mudancas',
    title: '9. Mudanças nestes termos',
    paragraphs: [
      'Podemos atualizar estes termos. Quando a mudança for relevante, a plataforma pedirá que você leia e aceite a nova versão antes de continuar. A versão em vigor é a publicada nesta página.',
    ],
  },
  {
    id: 'foro',
    title: '10. Contato e foro',
    paragraphs: [
      `Dúvidas sobre estes termos: ${A_CONFIRMAR}.`,
      `Foro: ${A_CONFIRMAR}.`,
    ],
  },
]
