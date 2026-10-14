import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StateSelector from '@/components/layout/StateSelector'
import { UFS } from '@/data/geo/ufs'

// A seleção é fixa na Paraíba: as outras 26 UFs estão na lista, mas escolher
// uma não pode entrar na Home (não há dado delas) nem trocar o rótulo.

function abrir() {
  fireEvent.click(screen.getByRole('button', { name: 'Estado: Paraíba' }))
}

describe('StateSelector', () => {
  it('lista as 27 UFs, uma única vez cada', () => {
    expect(new Set(UFS.map((uf) => uf.id)).size).toBe(27)
    render(<StateSelector onEnter={() => {}} />)
    abrir()
    expect(screen.getAllByRole('listitem')).toHaveLength(27)
  })

  it('escolher a Paraíba entra', () => {
    const onEnter = vi.fn()
    render(<StateSelector onEnter={onEnter} />)
    abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Paraíba' }))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('escolher outra UF não entra e mantém a Paraíba', () => {
    const onEnter = vi.fn()
    render(<StateSelector onEnter={onEnter} />)
    abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Pernambuco (em breve)' }))
    expect(onEnter).not.toHaveBeenCalled()
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(screen.getByRole('button', { name: 'Estado: Paraíba' })).toBeTruthy()
  })
})
