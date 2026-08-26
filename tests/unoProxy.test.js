import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callUnoProxy, fetchUnoDashboard, fetchEvolucaoAnual, fetchClientesList, fetchOwnUnoClient } from '../src/services/unoProxy'

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

  it('fetchEvolucaoAnual: chama evolucaoAnualCliente com ano e client_id', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ metas: {}, rentabilidades: {}, evolucaoPatrimonio: {} }))
    await fetchEvolucaoAnual(2026, '455')
    const url = String(vi.mocked(fetch).mock.calls[0][0])
    expect(url).toContain('endpoint=evolucaoAnualCliente')
    expect(url).toContain('ano=2026')
    expect(url).toContain('client_id=455')
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

  it('fetchUnoDashboard: um demonstrativo + um evolucaoAnualCliente por ano no periodo', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    const period = { month: 6, year: 2026, startDate: '01/06/2026', endDate: '30/06/2026' }
    await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls).toHaveLength(2)
    expect(calls.some((u) => u.includes('endpoint=demonstrativoFundosCliente') && u.includes('mes=6') && u.includes('ano=2026'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=evolucaoAnualCliente') && u.includes('ano=2026'))).toBe(true)
  })

  it('fetchUnoDashboard: uma chamada a evolucaoAnualCliente por ano civil coberto pelo periodo', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    const period = { month: 8, year: 2026, startDate: '01/09/2023', endDate: '31/08/2026' }
    await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    const evolucaoCalls = calls.filter((u) => u.includes('endpoint=evolucaoAnualCliente'))
    expect(evolucaoCalls).toHaveLength(4) // 2023, 2024, 2025, 2026
    for (const ano of [2023, 2024, 2025, 2026]) {
      expect(evolucaoCalls.some((u) => u.includes(`ano=${ano}`))).toBe(true)
    }
  })

  it('fetchUnoDashboard: demonstrativo do mes corrente com 400 faz fallback p/ mes anterior', async () => {
    const seq = [
      jsonResponse({ message: 'Request failed with status code 400' }, 400),
      jsonResponse([]),
      jsonResponse([{ fund_id: 1 }])
    ]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 8, year: 2026, startDate: '14/07/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls[0]).toContain('endpoint=demonstrativoFundosCliente')
    expect(calls[0]).toContain('mes=8')
    expect(calls.filter((u) => u.includes('mes=7'))).toHaveLength(1)
    expect(result.demonstrativo).toEqual([{ fund_id: 1 }])
  })

  it('fetchUnoDashboard: demonstrativo do mes corrente OK nao faz fallback', async () => {
    const seq = [jsonResponse([{ fund_id: 1 }]), jsonResponse([])]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 8, year: 2026, startDate: '14/07/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls).toHaveLength(2)
    expect(calls.filter((u) => u.includes('mes=7'))).toHaveLength(0)
    expect(result.demonstrativo).toEqual([{ fund_id: 1 }])
  })

  it('fetchUnoDashboard: repassa clientId como client_id em todas as chamadas', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    const period = {
      month: 6,
      year: 2026,
      startDate: '01/06/2026',
      endDate: '30/06/2026',
      clientId: '455'
    }
    await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls.every((u) => u.includes('client_id=455'))).toBe(true)
  })

  it('fetchUnoDashboard: expoe as respostas de evolucaoAnualCliente em evolucoes', async () => {
    const evolucaoBody = { metas: { '6/2026': { mes: 0.5 } }, rentabilidades: {}, evolucaoPatrimonio: {} }
    const seq = [jsonResponse([]), jsonResponse(evolucaoBody)]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 6, year: 2026, startDate: '01/06/2026', endDate: '30/06/2026' }
    const result = await fetchUnoDashboard(period)

    expect(result.evolucoes).toEqual([evolucaoBody])
  })
})
