import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StateHeader from '@/components/estado/StateHeader'
import { UFS } from '@/data/geo/ufs'

// A preposição é tabela, não regra: "Pará" leva artigo e "Goiás" não. Um erro
// aqui não quebra nada na tela — só escreve "da Ceará" no título.

const preposicao = (name: string) => UFS.find((u) => u.name === name)?.preposicao

describe('preposição por UF', () => {
  it('feminino, masculino e sem artigo', () => {
    expect(preposicao('Paraíba')).toBe('da')
    expect(preposicao('Bahia')).toBe('da')
    expect(preposicao('Ceará')).toBe('do')
    expect(preposicao('Rio Grande do Norte')).toBe('do')
    expect(preposicao('Pernambuco')).toBe('de')
    expect(preposicao('Goiás')).toBe('de')
    expect(preposicao('São Paulo')).toBe('de')
  })
})

describe('StateHeader', () => {
  it('escreve a preposição da UF mostrada', () => {
    const { rerender } = render(<StateHeader title="visão estadual" value="25" onChange={() => {}} />)
    expect(screen.getByText('visão estadual da')).toBeTruthy()
    rerender(<StateHeader title="visão estadual" value="23" onChange={() => {}} />)
    expect(screen.getByText('visão estadual do')).toBeTruthy()
    rerender(<StateHeader title="visão estadual" value="26" onChange={() => {}} />)
    expect(screen.getByText('visão estadual de')).toBeTruthy()
  })

  it('lista as 27 UFs e marca as indisponíveis', () => {
    const onChange = vi.fn()
    render(<StateHeader title="visão estadual" value="25" available={['25']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Paraíba, trocar estado' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(27)
    fireEvent.click(screen.getByRole('button', { name: 'Ceará (em breve)' }))
    expect(onChange).toHaveBeenCalledWith('23')
  })
})
