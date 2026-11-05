import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourTooltip from '../src/tour/TourTooltip'

function setup(index, size = 3) {
  const props = {
    index,
    size,
    step: { title: 'Menu', content: 'Texto do passo' },
    tooltipProps: { role: 'dialog' },
    // O joyride injeta aria-label em ingles nestes props; o cartao tem que sobrepor com PT-BR.
    backProps: { onClick: vi.fn(), 'aria-label': 'Back' },
    primaryProps: { onClick: vi.fn(), 'aria-label': 'Next' },
    skipProps: { onClick: vi.fn(), 'aria-label': 'Skip' }
  }
  render(<TourTooltip {...props} />)
  return props
}

describe('TourTooltip', () => {
  it('mostra o passo X de Y, titulo e conteudo', () => {
    setup(0)
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.getByText('Texto do passo')).toBeInTheDocument()
  })

  it('no primeiro passo nao tem Voltar e tem Proximo e Agora nao', () => {
    setup(0)
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agora não' })).toBeInTheDocument()
  })

  it('no ultimo passo o botao e Concluir e nao tem Agora nao', () => {
    setup(2)
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agora não' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
  })
})
