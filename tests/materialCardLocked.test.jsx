import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MaterialCard from '../src/components/MaterialCard'

// Material travado nao pode ser um beco sem saida: clicar tem que abrir o CTA
// de consultor, o mesmo usado no Dashboard UNO.

const getMaterialUrl = vi.fn().mockResolvedValue('https://example.com/doc.pdf')
vi.mock('../src/services/materialsData', () => ({
  getMaterialUrl: (...args) => getMaterialUrl(...args)
}))

let currentProfile = null
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: currentProfile })
}))

const exclusiveMaterial = {
  id: 'mat-1',
  title: 'Resolucao CMN 4.963-2021',
  description: 'Disponivel apenas para Clientes Lema.',
  visibility: 'lema_client',
  storage_path: 'materials/cmn-4963.pdf',
  file_name: 'cmn-4963.pdf',
  file_type: 'application/pdf',
  file_size: 1_300_000,
  created_at: '2026-08-13T12:00:00Z'
}

const CTA_TITLE = /Funcao exclusiva para Clientes Lema|Função exclusiva para Clientes Lema/

describe('MaterialCard travado', () => {
  it('abre o CTA de consultor quando um nao-cliente clica no material exclusivo', async () => {
    currentProfile = { user_type: 'client', role: 'ROLE_VIEWER', is_uno_client: false }

    render(<MaterialCard material={exclusiveMaterial} />)

    const button = screen.getByRole('button', { name: /Abrir/i })
    expect(button).not.toBeDisabled()

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(CTA_TITLE)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /Falar com um consultor/i })).toBeInTheDocument()
    // O arquivo em si continua inacessivel.
    expect(getMaterialUrl).not.toHaveBeenCalled()
  })

  it('abre o material de verdade quando o usuario e Cliente Lema', async () => {
    currentProfile = { user_type: 'client', role: 'ROLE_VIEWER', is_uno_client: true }

    render(<MaterialCard material={exclusiveMaterial} />)

    fireEvent.click(screen.getByRole('button', { name: /Abrir/i }))

    await waitFor(() => {
      expect(getMaterialUrl).toHaveBeenCalledWith(
        exclusiveMaterial.storage_path,
        exclusiveMaterial.file_name,
        { download: false }
      )
    })
    expect(screen.queryByText(CTA_TITLE)).toBeNull()
  })
})
