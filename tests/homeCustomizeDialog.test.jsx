import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomeCustomizeDialog from '../src/components/home/HomeCustomizeDialog'
import { HOME_BLOCKS } from '../src/config/homeBlocks'
import { resolveHomeLayout } from '../src/utils/homeLayout'

const defaults = resolveHomeLayout(null, HOME_BLOCKS)

function setup(layout = defaults) {
  const onSave = vi.fn().mockResolvedValue()
  const onClose = vi.fn()
  render(<HomeCustomizeDialog open layout={layout} onSave={onSave} onClose={onClose} />)
  return { onSave, onClose }
}

describe('HomeCustomizeDialog', () => {
  it('nao deixa desligar o ultimo bloco ligado', () => {
    const onlyOne = defaults.map((i) => ({ ...i, visible: i.id === 'noticias' }))
    setup(onlyOne)
    expect(screen.getByRole('switch', { name: /Notícias de mercado/ })).toBeDisabled()
  })

  it('desce um bloco com o botao e salva a nova ordem', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Descer Próximos eventos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0].slice(0, 2).map((i) => i.id)).toEqual(['noticias', 'eventos'])
  })

  it('liga o dashboard e salva', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('switch', { name: /Dashboard do UNO/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0].find((i) => i.id === 'dashboard-uno').visible).toBe(true)
  })

  it('"Voltar ao padrao" restaura o rascunho', async () => {
    const custom = defaults.map((i) => ({ ...i, visible: i.id === 'artigos' }))
    const { onSave } = setup(custom)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao padrão' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toEqual(defaults)
  })

  it('mostra erro e mantem o painel aberto se salvar falhar', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('x'))
    const onClose = vi.fn()
    render(<HomeCustomizeDialog open layout={defaults} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
