import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  callUnoProxy,
  fetchUnoDashboard,
  fetchEvolucaoAnual,
  fetchClientesList,
  fetchOwnUnoClient,
  fetchUnoClients,
  fetchOwnUnoClientFimCarteira,
  resetUnoRateLimit
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
    resetUnoRateLimit()
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

  it('callUnoProxy: refaz a chamada quando a UNO responde 429', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse('Too many requests', 429))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const promise = callUnoProxy('x', {})
    await vi.advanceTimersByTimeAsync(5000)
    await expect(promise).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('callUnoProxy: respeita o limite de 20/min (18 por janela de 60s)', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}))
    const all = Promise.all(Array.from({ length: 20 }, (_, n) => callUnoProxy('x', { n })))
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(18)
    await vi.advanceTimersByTimeAsync(60_000)
    await all
    expect(fetch).toHaveBeenCalledTimes(20)
    vi.useRealTimers()
  })

  it('callUnoProxy: nunca passa de 2 chamadas em paralelo', async () => {
    let active = 0
    let peak = 0
    vi.mocked(fetch).mockImplementation(async () => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1
      return jsonResponse({})
    })
    await Promise.all([1, 2, 3, 4, 5].map((n) => callUnoProxy('x', { n })))
    expect(peak).toBe(2)
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

  it('fetchUnoDashboard: refresh=1 só quando pedido, e só no mes pedido (os anteriores saem do cache)', async () => {
    const period = { month: 6, year: 2026, startDate: '01/06/2026', endDate: '30/06/2026' }

    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    await fetchUnoDashboard(period)
    expect(vi.mocked(fetch).mock.calls.some((c) => String(c[0]).includes('refresh=1'))).toBe(false)

    vi.mocked(fetch).mockClear()
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ message: 'x' }, 400)) // demonstrativo 6/2026
      .mockResolvedValue(jsonResponse([]))
    await fetchUnoDashboard(period, { refresh: true })
    const urls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]))
    const demonstrativos = urls.filter((u) => u.includes('endpoint=demonstrativoFundosCliente'))
    expect(demonstrativos[0]).toContain('refresh=1')
    expect(demonstrativos[1]).toContain('mes=5')
    expect(demonstrativos[1]).not.toContain('refresh=1')
    expect(urls.filter((u) => u.includes('endpoint=evolucaoAnualCliente')).every((u) => u.includes('refresh=1'))).toBe(true)
  })

  it('fetchUnoDashboard: fetchedAt é a data da cópia mais antiga (null se nada veio de cache)', async () => {
    const period = { month: 6, year: 2026, startDate: '01/06/2025', endDate: '30/06/2026' }
    const withDate = (body, iso) => ({ ...jsonResponse(body), headers: { get: (h) => (h === 'x-uno-fetched-at' ? iso : null) } })

    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    expect((await fetchUnoDashboard(period)).fetchedAt).toBeNull()

    vi.mocked(fetch).mockImplementation(async (url) =>
      String(url).includes('endpoint=demonstrativo')
        ? withDate([], '2026-11-02T10:00:00.000Z')
        : String(url).includes('ano=2025')
          ? withDate([], '2026-11-01T08:00:00.000Z')
          : withDate([], '2026-11-02T09:00:00.000Z')
    )
    expect((await fetchUnoDashboard(period)).fetchedAt).toBe('2026-11-01T08:00:00.000Z')
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

  it('fetchUnoDashboard: demonstrativo do mes corrente com 400 faz fallback p/ mes anterior e informa o mes usado', async () => {
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
    expect(result.demonstrativoMonth).toBe(7)
    expect(result.demonstrativoYear).toBe(2026)
  })

  it('fetchUnoDashboard: cliente sem dado ha varios meses anda pra tras ate achar um mes fechado', async () => {
    // fetchDemonstrativo roda em paralelo com a chamada a evolucaoAnualCliente
    // (Promise.all), entao a ordem de chegada dos fetches nao e deterministica —
    // responde com base no endpoint/mes pedidos em vez de uma fila sequencial.
    vi.mocked(fetch).mockImplementation(async (url) => {
      const u = new URL(String(url))
      if (u.searchParams.get('endpoint') === 'evolucaoAnualCliente') return jsonResponse([])
      const mes = u.searchParams.get('mes')
      if (mes === '5') return jsonResponse([{ fund_id: 9 }])
      return jsonResponse({ message: '400' }, 400)
    })

    const period = { month: 8, year: 2026, startDate: '14/04/2026', endDate: '14/08/2026' }
    const result = await fetchUnoDashboard(period)

    expect(result.demonstrativo).toEqual([{ fund_id: 9 }])
    expect(result.demonstrativoMonth).toBe(5)
    expect(result.demonstrativoYear).toBe(2026)
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
    expect(result.demonstrativoMonth).toBe(8)
    expect(result.demonstrativoYear).toBe(2026)
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

  it('fetchOwnUnoClientFimCarteira: parseia fim_carteira do proprio cliente', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([{ id: 192, fim_carteira: '7/2026' }]))
    const fimCarteira = await fetchOwnUnoClientFimCarteira()
    expect(fimCarteira).toEqual({ month: 7, year: 2026 })
  })
})
