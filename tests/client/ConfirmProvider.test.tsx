import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import ConfirmProvider from '@/hooks/ConfirmProvider'
import { useConfirm } from '@/hooks/useConfirm'

// A regra do "uma vez por sessão" falha em silêncio nos dois sentidos: se
// grudar cedo demais, o aviso nunca aparece; se não grudar, volta a cada clique
// e vira o diálogo que se fecha no reflexo. Nenhum dos dois dá erro na tela.
//
// `fireEvent` em vez de `user-event`: o projeto não tem essa dependência e
// nenhum destes casos depende de digitação real ou de foco encadeado.

const MENSAGEM = 'O texto será trocado.'

const OPCOES = {
  title: 'Substituir o texto?',
  message: MENSAGEM,
  confirmLabel: 'Substituir',
  cancelLabel: 'Manter o meu',
  once: 'ia',
}

/** Botão que registra o resultado de cada chamada, para as asserções lerem. */
function Sujeito({ once = true }: { once?: boolean }) {
  const confirm = useConfirm()
  const [resultados, setResultados] = useState<string[]>([])

  return (
    <>
      <button
        onClick={() =>
          void confirm(once ? OPCOES : { ...OPCOES, once: undefined }).then((ok) =>
            setResultados((r) => [...r, ok ? 'sim' : 'não']),
          )
        }
      >
        Aprimorar
      </button>
      <p data-testid="resultados">{resultados.join(',')}</p>
    </>
  )
}

function montar(props: { once?: boolean } = {}) {
  render(
    <ConfirmProvider>
      <Sujeito {...props} />
    </ConfirmProvider>,
  )
}

const clicar = (nome: string) => fireEvent.click(screen.getByRole('button', { name: nome }))
const aberto = () => screen.queryByText(MENSAGEM) !== null
const resultados = async (esperado: string) =>
  waitFor(() => expect(screen.getByTestId('resultados').textContent).toBe(esperado))

describe('ConfirmProvider', () => {
  it('pergunta na primeira vez e não pergunta de novo depois do sim', async () => {
    montar()

    clicar('Aprimorar')
    expect(aberto()).toBe(true)
    clicar('Substituir')
    await resultados('sim')

    clicar('Aprimorar')
    expect(aberto()).toBe(false)
    await resultados('sim,sim')
  })

  it('cancelar não marca nada: quem disse não continua sendo perguntado', async () => {
    montar()

    clicar('Aprimorar')
    clicar('Manter o meu')
    await resultados('não')

    clicar('Aprimorar')
    expect(aberto()).toBe(true)
  })

  it('Escape fecha e responde não — o caminho fácil preserva o trabalho', async () => {
    montar()

    clicar('Aprimorar')
    fireEvent.keyDown(document, { key: 'Escape' })
    await resultados('não')
    expect(aberto()).toBe(false)
  })

  it('sem `once`, pergunta sempre', async () => {
    montar({ once: false })

    clicar('Aprimorar')
    clicar('Substituir')
    await resultados('sim')

    clicar('Aprimorar')
    expect(aberto()).toBe(true)
  })
})
