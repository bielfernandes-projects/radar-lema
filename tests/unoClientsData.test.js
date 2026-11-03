import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchUnoClients, fetchOwnUnoClientName } from '../src/services/unoProxy'

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'test-token' } },
        error: null
      }))
    }
  }
}))

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
})

// fetchUnoClients / fetchOwnUnoClientName moram junto do resto do acesso ao
// UNO em unoProxy.js (antes eram um pass-through solto em unoClientsData.js).
describe('unoProxy: clientes do UNO', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('fetchUnoClients usa o municipio ja formatado (Cidade - UF) e ordena por nome', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([
        { id: 580, municipio: 'Cruzeta - RN' },
        { id: 192, municipio: 'Demonstração - Lema' }
      ])
    )
    expect(await fetchUnoClients()).toEqual([
      { uno_client_id: '580', name: 'Cruzeta - RN' },
      { uno_client_id: '192', name: 'Demonstração - Lema' }
    ])
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('endpoint=clientesUNO')
  })

  it('fetchUnoClients cai para nome_rpps quando falta municipio', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([{ id: 5, nome_rpps: 'INSTITUTO X' }]))
    expect(await fetchUnoClients()).toEqual([{ uno_client_id: '5', name: 'INSTITUTO X' }])
  })

  it('fetchOwnUnoClientName resolve o nome do proprio vinculo', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([{ id: 192, municipio: 'Demonstração - Lema' }]))
    expect(await fetchOwnUnoClientName()).toBe('Demonstração - Lema')
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('endpoint=clienteUNO')
  })

  it('fetchOwnUnoClientName retorna vazio sem cliente vinculado', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    expect(await fetchOwnUnoClientName()).toBe('')
  })
})
