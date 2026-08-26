import { supabase } from '../lib/supabase'

const UNO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uno-proxy`

async function fetchProxy(method, endpoint, params = {}, body = undefined) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const query = new URLSearchParams({ endpoint, ...params })
  const res = await fetch(`${UNO_PROXY_URL}?${query.toString()}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message
    if (res.status === 403) {
      message = 'Acesso restrito a Clientes Lema.'
    } else if (res.status === 401) {
      message = 'Sessão expirada. Faça login novamente.'
    } else {
      message = extractUnoErrorMessage(text) || 'Erro ao consultar a API do UNO.'
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return res.json()
}

export async function callUnoProxy(endpoint, params = {}) {
  return fetchProxy('GET', endpoint, params)
}

export async function callUnoProxyPost(endpoint, body = {}) {
  return fetchProxy('POST', endpoint, {}, body)
}

function extractUnoErrorMessage(text) {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text)
    return typeof parsed?.message === 'string' ? parsed.message : ''
  } catch {
    return text
  }
}

// O demonstrativo mensal so existe para meses fechados: enquanto o mes
// corrente ainda nao fechou, `demonstrativoFundosCliente` devolve 400 (a UNO
// repassa o erro do Comdinheiro ao consultar data futura). Faz fallback para
// o ultimo mes fechado quando o mes corrente responde 400.
async function fetchDemonstrativo(month, year, clientId) {
  const params = { consulting_id: '1', mes: String(month), ano: String(year), ...clientParam(clientId) }
  try {
    return await callUnoProxy('demonstrativoFundosCliente', params)
  } catch (err) {
    if (err?.status === 400) {
      const previous = new Date(year, month - 1, 1)
      previous.setMonth(previous.getMonth() - 1)
      return callUnoProxy('demonstrativoFundosCliente', {
        consulting_id: '1',
        mes: String(previous.getMonth() + 1),
        ano: String(previous.getFullYear()),
        ...clientParam(clientId)
      })
    }
    throw err
  }
}

function clientParam(clientId) {
  return clientId ? { client_id: String(clientId) } : {}
}

export async function fetchUnoDashboard(period) {
  const rangeParams = {
    consulting_id: '1',
    start_date: period.startDate,
    end_date: period.endDate,
    ...clientParam(period.clientId)
  }

  const [demonstrativo, fundos, movimentacoes, titulos, enquadramentos, disponibilidades, meta, metaAnual] =
    await Promise.all([
      fetchDemonstrativo(period.month, period.year, period.clientId),
      callUnoProxy('fundosCliente', rangeParams),
      callUnoProxy('movimentacoesCliente', rangeParams),
      callUnoProxy('titulosAnalise', rangeParams),
      callUnoProxy('enquadramentosCliente', rangeParams),
      callUnoProxy('disponibilidadesCliente', rangeParams),
      callUnoProxy('metaCliente', rangeParams),
      callUnoProxy('metaClientePorAno', { ano: String(period.year), ...clientParam(period.clientId) })
    ])

  return {
    demonstrativo,
    fundos,
    movimentacoes,
    titulos,
    enquadramentos,
    disponibilidades,
    meta,
    metaAnual
  }
}
