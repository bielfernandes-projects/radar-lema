import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const state = { install: vi.fn(), canPrompt: false, isInstalled: false, isIOS: false }
vi.mock('../src/hooks/usePWAInstall', () => ({ usePWAInstall: () => state }))

import InstallGuide from '../src/tour/InstallGuide'

beforeEach(() => {
  Object.assign(state, { install: vi.fn(), canPrompt: false, isInstalled: false, isIOS: false })
})

describe('InstallGuide', () => {
  it('ja instalado: avisa que esta pronto', () => {
    state.isInstalled = true
    render(<InstallGuide />)
    expect(screen.getByText(/já está na sua tela inicial/)).toBeInTheDocument()
  })

  it('navegador permite instalar: botao grande dispara a instalacao', () => {
    state.canPrompt = true
    render(<InstallGuide />)
    fireEvent.click(screen.getByRole('button', { name: 'Instalar agora' }))
    expect(state.install).toHaveBeenCalledTimes(1)
  })

  it('iPhone: 3 passos com Compartilhar e Adicionar a Tela de Inicio', () => {
    state.isIOS = true
    render(<InstallGuide />)
    expect(screen.getByRole('img', { name: /Safari/ })).toBeInTheDocument()
    expect(screen.getByText(/botão de compartilhar/)).toBeInTheDocument()
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Instalar agora' })).toBeNull()
  })

  it('Android: 3 passos com os tres pontinhos e Instalar aplicativo', () => {
    render(<InstallGuide />)
    expect(screen.getByRole('img', { name: /três pontinhos/ })).toBeInTheDocument()
    expect(screen.getByText(/Instalar aplicativo/)).toBeInTheDocument()
  })
})
