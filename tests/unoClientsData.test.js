import { describe, it, expect, vi } from 'vitest'

const callUnoProxy = vi.fn()
vi.mock('../src/services/unoProxy', () => ({
  fetchClientesList: (...args) => callUnoProxy('clientesUNO', ...args),
  fetchOwnUnoClient: (...args) => callUnoProxy('clienteUNO', ...args)
}))

const { fetchUnoClients, fetchOwnUnoClientName } = await import('../src/services/unoClientsData')

describe('services/unoClientsData', () => {
  it('fetchUnoClients usa o municipio ja formatado (Cidade - UF) e ordena por nome', async () => {
    callUnoProxy.mockResolvedValueOnce([
      { id: 580, municipio: 'Cruzeta - RN' },
      { id: 192, municipio: 'Demonstração - Lema' }
    ])
    const result = await fetchUnoClients()
    expect(result).toEqual([
      { uno_client_id: '580', name: 'Cruzeta - RN' },
      { uno_client_id: '192', name: 'Demonstração - Lema' }
    ])
  })

  it('fetchUnoClients cai para nome_rpps quando falta municipio', async () => {
    callUnoProxy.mockResolvedValueOnce([{ id: 5, nome_rpps: 'INSTITUTO X' }])
    const result = await fetchUnoClients()
    expect(result).toEqual([{ uno_client_id: '5', name: 'INSTITUTO X' }])
  })

  it('fetchOwnUnoClientName resolve o nome do proprio vinculo', async () => {
    callUnoProxy.mockResolvedValueOnce([{ id: 192, municipio: 'Demonstração - Lema' }])
    const name = await fetchOwnUnoClientName()
    expect(name).toBe('Demonstração - Lema')
  })

  it('fetchOwnUnoClientName retorna vazio sem cliente vinculado', async () => {
    callUnoProxy.mockResolvedValueOnce([])
    const name = await fetchOwnUnoClientName()
    expect(name).toBe('')
  })
})
