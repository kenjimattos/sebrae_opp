import type { Agenda, StatusType } from '@/types/indicators'

// `bg` saiu do mapa: o Card referencia as classes `status-*-bg` diretamente no
// seu próprio `surfaceClass`, então a cópia aqui não tinha leitor.
export const statusStyles: Record<StatusType, { dot: string; glow: string }> = {
  success: { dot: 'status-success-dot', glow: 'status-success-glow' },
  warning: { dot: 'status-warning-dot', glow: 'status-warning-glow' },
  alert:   { dot: 'status-alert-dot',   glow: 'status-alert-glow' },
  // Sem faixa oficial: neutro, sem glow (não sinaliza cor).
  none:    { dot: 'status-neutral-dot', glow: '' },
}

// Pontuação por gravidade, para a média da agenda. Não é "pior status manda":
// distinguir 'warning' de 'alert' faz os amarelos só puxarem para vermelho
// quando há vermelhos de verdade na conta.
const STATUS_SCORE: Record<Exclude<StatusType, 'none'>, number> = {
  success: 2,
  warning: 1,
  alert: 0,
}

// Cor da agenda: média da gravidade dos indicadores que CLASSIFICAM.
//
//   média >= 1.5 → verde · >= 0.5 → amarelo · < 0.5 → vermelho
//
// `'none'` fica fora do numerador E do denominador. É o que faltava quando esta
// função foi desligada em 81c9df4: naquele momento a maioria dos indicadores era
// 'none' (em Campina: 3 verdes, 3 amarelos, 18 sem régua), e contá-los como zero
// pintaria quase toda agenda de vermelho — um agregado dominado por ausência de
// dado, não por desempenho. Agora que 17 dos 22 classificam a média volta a ter
// lastro, mas a exclusão continua sendo o que a mantém honesta.
//
// Agenda sem nenhum indicador classificável devolve 'none' (glow vazio), e é o
// resultado certo: hoje é o caso de *Acesso a crédito*, cujos dois indicadores
// são valor absoluto em R$ sem régua possível.
export function agendaStatus(agenda: Agenda): StatusType {
  const classificados = agenda.indicators.filter((i) => i.status !== 'none')
  if (classificados.length === 0) return 'none'

  const soma = classificados.reduce(
    (acc, i) => acc + STATUS_SCORE[i.status as Exclude<StatusType, 'none'>],
    0,
  )
  const media = soma / classificados.length

  if (media >= 1.5) return 'success'
  if (media >= 0.5) return 'warning'
  return 'alert'
}
