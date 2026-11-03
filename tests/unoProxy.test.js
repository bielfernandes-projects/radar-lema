import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  callUnoProxy,
  fetchUnoDashboard,
  fetchClientesList,
  fetchOwnUnoClient,
  fetchUnoClients,
  fetchUnoMelhorias
} from '../src/services/unoProxy'

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

function jsonResponse(body, status = 200) {
  const ok = status >= 200 && status < 300
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
  }
}

describe('services/unoProxy', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('callUnoProxy: 403 lanca Acesso restrito a Clientes Lema.', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse('', 403))
    await expect(callUnoProxy('fundosCliente', {})).rejects.toThrow(
      'Acesso restrito a Clientes Lema.'
    )
  })

  it('callUnoProxy: anexa status e extrai message do corpo JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ message: 'Request failed with status code 400' }, 400)
    )
    try {
      await callUnoProxy('x', {})
      expect.unreachable('deveria lancar')
    } catch (err) {
      expect(err.status).toBe(400)
      expect(err.message).toBe('Request failed with status code 400')
    }
  })

  it('fetchClientesList: chama clientesUNO', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    await fetchClientesList()
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('endpoint=clientesUNO')
  })

  it('fetchOwnUnoClient: chama clienteUNO', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    await fetchOwnUnoClient()
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('endpoint=clienteUNO')
  })

  it('fetchUnoClients: expoe fimCarteira parseado de fim_carteira', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([
        { id: 192, municipio: 'DEMONSTRAÇÃO - LEMA', fim_carteira: '7/2026' },
        { id: 5, nome_rpps: 'RPPS SEM CARTEIRA', fim_carteira: null }
      ])
    )
    const clients = await fetchUnoClients()
    expect(clients.find((c) => c.uno_client_id === '192').fimCarteira).toEqual({ month: 7, year: 2026 })
    expect(clients.find((c) => c.uno_client_id === '5').fimCarteira).toBeNull()
  })

  it('fetchUnoDashboard: UMA chamada a dashboardCliente com periodo e client_id', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ competencia: '09/2026' }))
    const result = await fetchUnoDashboard({ clientId: '455', period: '12' })
    expect(fetch).toHaveBeenCalledTimes(1)
    const url = String(vi.mocked(fetch).mock.calls[0][0])
    expect(url).toContain('endpoint=dashboardCliente')
    expect(url).toContain('periodo=12')
    expect(url).toContain('client_id=455')
    expect(result).toEqual({ competencia: '09/2026' })
  })

  it('fetchUnoDashboard: sem mes/ano o UNO usa a ultima carteira fechada; com mes e ano envia os dois', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}))
    await fetchUnoDashboard({ clientId: '1', period: 'ano' })
    expect(String(vi.mocked(fetch).mock.calls[0][0])).not.toMatch(/mes=|ano=/)
    await fetchUnoDashboard({ clientId: '1', period: 'ano', month: 7, year: 2026 })
    const url = String(vi.mocked(fetch).mock.calls[1][0])
    expect(url).toContain('mes=7')
    expect(url).toContain('ano=2026')
  })

  it('fetchUnoDashboard: erro do UNO (mes sem carteira) vira Error com a mensagem e o status', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ message: 'Não há rentabilidade calculada para a carteira do cliente em 11/2026' }, 400)
    )
    await expect(fetchUnoDashboard({ period: '12', month: 11, year: 2026 })).rejects.toMatchObject({
      message: 'Não há rentabilidade calculada para a carteira do cliente em 11/2026',
      status: 400
    })
  })

  it('fetchUnoMelhorias: devolve rows de melhoriasUNO', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ rows: [{ improvement_id: 32 }], rowCount: 1 }))
    expect(await fetchUnoMelhorias()).toEqual([{ improvement_id: 32 }])
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('endpoint=melhoriasUNO')
  })
})
