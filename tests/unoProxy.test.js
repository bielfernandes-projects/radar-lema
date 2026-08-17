import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callUnoProxy, fetchUnoDashboard } from '../src/services/unoProxy'

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

  it('fetchUnoDashboard: envia endpoint e params corretos em cada chamada', async () => {
    const responses = Array.from({ length: 8 }, () => jsonResponse([]))
    vi.mocked(fetch).mockImplementation(async () => responses.shift())

    const period = { month: 6, year: 2026, startDate: '01/06/2026', endDate: '30/06/2026' }
    await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls[0]).toContain('endpoint=demonstrativoFundosCliente')
    expect(calls[0]).toContain('mes=6')
    expect(calls[0]).toContain('ano=2026')
    expect(calls.some((u) => u.includes('endpoint=fundosCliente'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=movimentacoesCliente'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=titulosAnalise'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=enquadramentosCliente'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=disponibilidadesCliente'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=metaCliente&'))).toBe(true)
    expect(calls.some((u) => u.includes('endpoint=metaClientePorAno'))).toBe(true)
  })

  it('fetchUnoDashboard: demonstrativo do mes corrente com 400 faz fallback p/ mes anterior', async () => {
    const seq = [
      jsonResponse({ message: 'Request failed with status code 400' }, 400),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([{ fund_id: 1 }])
    ]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 8, year: 2026, startDate: '14/07/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls.length).toBeGreaterThanOrEqual(8)
    expect(calls[0]).toContain('endpoint=demonstrativoFundosCliente')
    expect(calls[0]).toContain('mes=8')
    expect(calls[0]).toContain('ano=2026')
    expect(calls.filter((u) => u.includes('mes=7'))).toHaveLength(1)
    expect(calls.filter((u) => u.includes('mes=7'))[0]).toContain('ano=2026')
    expect(result.demonstrativo).toEqual([{ fund_id: 1 }])
  })

  it('fetchUnoDashboard: demonstrativo do mes corrente OK nao faz fallback', async () => {
    const seq = [
      jsonResponse([{ fund_id: 1 }]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([])
    ]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 8, year: 2026, startDate: '14/07/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    expect(calls).toHaveLength(8)
    expect(calls[0]).toContain('mes=8')
    expect(calls.filter((u) => u.includes('mes=7'))).toHaveLength(0)
    expect(result.demonstrativo).toEqual([{ fund_id: 1 }])
  })

  it('fetchUnoDashboard: retorna metaAnual junto com os demais dados', async () => {
    const seq = [
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([]),
      jsonResponse([{ patrimonio: 100 }]),
      jsonResponse([{ patrimonio: 200 }])
    ]
    vi.mocked(fetch).mockImplementation(async () => seq.shift())

    const period = { month: 8, year: 2026, startDate: '14/07/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    expect(result.meta).toEqual([{ patrimonio: 100 }])
    expect(result.metaAnual).toEqual([{ patrimonio: 200 }])
  })
})
