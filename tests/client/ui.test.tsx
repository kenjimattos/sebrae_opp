import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/buttons/Button'
import Chip from '@/components/ui/buttons/Chip'
import IconButton from '@/components/ui/buttons/IconButton'
import PillButton from '@/components/ui/buttons/PillButton'
import { buttonBaseClass } from '@/components/ui/buttons/button-styles'
import { X } from '@/components/icons'

// Só comportamento. Componente de apresentação testado por render quebra a cada
// mudança de classe sem pegar defeito — a exceção é a classe base dos botões,
// onde mora o anel de foco, e por isso ela tem um teste próprio.

describe('Modal · dispensa', () => {
  it('Escape fecha', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>conteúdo</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clique no backdrop fecha', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>conteúdo</Modal>)
    const backdrop = screen.getByRole('dialog').parentElement!
    fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clique DENTRO do painel não fecha', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}><p>conteúdo</p></Modal>)
    fireEvent.mouseDown(screen.getByText('conteúdo'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('fechado não registra nada: Escape não chama onClose', () => {
    const onClose = vi.fn()
    render(<Modal open={false} onClose={onClose}>conteúdo</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('outra tecla não fecha', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>conteúdo</Modal>)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('trava o scroll do body enquanto aberto e devolve ao desmontar', () => {
    const { unmount } = render(<Modal open onClose={() => {}}>conteúdo</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('o X do cabeçalho fecha', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Confirmar">conteúdo</Modal>)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('botões · disabled não dispara onClick', () => {
  it('Button', () => {
    const onClick = vi.fn()
    render(<Button label="Gerar" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('Chip', () => {
    const onClick = vi.fn()
    render(<Chip label="Agendas" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agendas' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('IconButton', () => {
    const onClick = vi.fn()
    render(<IconButton icon={X} aria-label="Fechar" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('PillButton', () => {
    const onClick = vi.fn()
    render(<PillButton label="Continuar" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('habilitado, cada um dispara uma vez', () => {
    const onClick = vi.fn()
    render(<Button label="Gerar" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('botões · a classe base, onde mora o anel de foco', () => {
  // `focus-visible:outline`, e não `ring`: box-shadow some em alto contraste
  // forçado, e o gap do outline-offset é transparente sobre qualquer fundo.
  const FOCO = [
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'focus-visible:outline-accent',
  ]

  it('a própria constante declara o anel de foco por outline', () => {
    for (const classe of FOCO) expect(buttonBaseClass).toContain(classe)
    expect(buttonBaseClass).not.toContain('ring')
  })

  it('a base inteira chega ao Button', () => {
    render(<Button label="Gerar" />)
    const el = screen.getByRole('button', { name: 'Gerar' })
    for (const classe of buttonBaseClass.split(' ')) expect(el).toHaveClass(classe)
  })

  it('e ao IconButton, que compartilha a mesma fonte', () => {
    render(<IconButton icon={X} aria-label="Fechar" />)
    const el = screen.getByRole('button', { name: 'Fechar' })
    for (const classe of buttonBaseClass.split(' ')) expect(el).toHaveClass(classe)
  })

  it('o PillButton tem a sua própria shell, mas o mesmo anel de foco', () => {
    render(<PillButton label="Continuar" />)
    const el = screen.getByRole('button', { name: /Continuar/ })
    for (const classe of FOCO) expect(el).toHaveClass(classe)
  })

  it('IconButton decorativo não é botão e não recebe foco', () => {
    render(<IconButton icon={X} decorative />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
