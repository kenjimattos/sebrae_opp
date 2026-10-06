import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SectionEstado from '@/components/sections/SectionEstado'
import type { StateData } from '@/types/estado'

// Comportamento do painel estadual: o que o toggle faz (destacar, não filtrar),
// que tema sem indicador não entra, e que nada aqui vira semáforo.

const data: StateData = {
  uf: '25',
  name: 'Paraíba',
  indicators: [
    {
      id: 'uf-populacao',
      label: 'População total',
      value: '4.164.468',
      numericValue: 4164468,
      referenceYear: '2025',
      breakdown: {
        posicao: { entreUfs: 14, totalUfs: 27, entreNordeste: 5, totalNordeste: 9, normalizado: false },
      },
      series: [
        { referenceYear: '2024', value: '4.145.040', numericValue: 4145040 },
        { referenceYear: '2025', value: '4.164.468', numericValue: 4164468 },
      ],
    },
    {
      id: 'uf-emprego-porte',
      label: 'Emprego em micro e pequenas empresas',
      value: '300.186',
      numericValue: 300186,
      referenceYear: '2025',
      breakdown: {
        porFaixa: { 'Microempresa (ME)': 144737, 'Empresa de Pequeno Porte (EPP)': 155449 },
        posicao: {
          entreUfs: 18,
          totalUfs: 27,
          entreNordeste: 5,
          totalNordeste: 9,
          normalizado: true,
          valorNormalizado: 72.08,
          unidadeNormalizada: '/1k hab.',
        },
      },
      series: [{ referenceYear: '2025', value: '300.186', numericValue: 300186 }],
    },
  ],
}

vi.mock('@/hooks/useEstado', () => ({
  useEstado: () => ({ data, loading: false, error: null }),
}))

function cardOf(label: string): HTMLElement {
  const heading = screen.getByText(label)
  const card = heading.closest('article')
  if (!card) throw new Error(`card de ${label} não encontrado`)
  return card
}

describe('SectionEstado', () => {
  it('mostra os indicadores servidos, com valor e posição', () => {
    render(<SectionEstado />)
    expect(screen.getByText('4.164.468')).toBeTruthy()
    expect(screen.getByText('300.186')).toBeTruthy()
    expect(screen.getByText('14ª')).toBeTruthy()
    expect(screen.getAllByText(/de 27 UFs/).length).toBe(2)
  })

  it('o tema recua os cards de fora, mas não os remove — a grade não se mexe', () => {
    render(<SectionEstado />)
    expect(cardOf('População total').className).not.toContain('opacity-40')

    fireEvent.click(screen.getByRole('tab', { name: 'Empresas' }))

    expect(cardOf('População total').className).toContain('opacity-40')
    expect(cardOf('Emprego em micro e pequenas empresas').className).not.toContain('opacity-40')
    // continua na tela: destacar não é filtrar
    expect(screen.getByText('4.164.468')).toBeTruthy()
  })

  it('Visão geral acende todos de novo', () => {
    render(<SectionEstado />)
    fireEvent.click(screen.getByRole('tab', { name: 'Empresas' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Visão geral' }))
    expect(cardOf('População total').className).not.toContain('opacity-40')
  })

  it('tema sem indicador não entra no toggle — escolhê-lo apagaria o painel', () => {
    render(<SectionEstado />)
    expect(screen.queryByRole('tab', { name: 'Saúde' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Educação' })).toBeNull()
    expect(screen.getByRole('tab', { name: 'Demografia e desenvolvimento' })).toBeTruthy()
  })

  it('a posição per capita vem rotulada; a bruta não ganha o rótulo', () => {
    render(<SectionEstado />)
    expect(cardOf('Emprego em micro e pequenas empresas').textContent).toContain('Posição per capita')
    expect(cardOf('População total').textContent).not.toContain('per capita')
  })

  it('não desenha gráfico de linha nem as barras de porte', () => {
    const { container } = render(<SectionEstado />)
    expect(container.querySelector('svg polyline')).toBeNull()
    expect(screen.queryByText('Microempresa (ME)')).toBeNull()
  })

  it('não pinta status: nenhuma classe de semáforo no painel', () => {
    const { container } = render(<SectionEstado />)
    expect(container.querySelector('[class*="status-"]')).toBeNull()
    expect(container.querySelector('[class*="text-success"],[class*="text-alert"],[class*="text-warning"]')).toBeNull()
  })
})
