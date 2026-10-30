import { supabase } from '../lib/supabase'
import { yearsInRange, parseFimCarteira } from '../utils/uno'

const UNO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uno-proxy`

// A API do UNO tem rate limit de 20 chamadas por minuto (429 acima disso) e o Dashboard
// dispara uma por ano do período + o demonstrativo (+ até 12 do fallback de mês). Janela
// deslizante de 18/min (folga p/ outras abas), 2 em voo, e 429 residual refeito com espera.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 18
const MAX_IN_FLIGHT = 2
const RETRY_429_DELAYS_MS = [5000, 15000]
const sentAt = []
let inFlight = 0
const waiting = []
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Só para testes: zera a janela de rate limit, que é estado do módulo. */
export function resetUnoRateLimit() {
  sentAt.length = 0
}

async function throttle() {
  for (;;) {
    const now = Date.now()
    while (sentAt.length && now - sentAt[0] >= WINDOW_MS) sentAt.shift()
    if (sentAt.length < MAX_PER_WINDOW) {
      sentAt.push(now)
      return
    }
    await sleep(sentAt[0] + WINDOW_MS - now + 20)
  }
}

async function withSlot(task) {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise((resolve) => waiting.push(resolve))
  inFlight += 1
  try {
    return await task()
  } finally {
    inFlight -= 1
    waiting.shift()?.()
  }
}

// A Edge Function uno-proxy só aceita GET (endpoint + params na query string).
// `refresh` pede ao servidor para refazer a consulta ao UNO (senão ele serve a cópia guardada).
// Devolve também quando a cópia foi feita (header x-uno-fetched-at; ISO, ou null).
async function fetchProxyMeta(endpoint, params = {}, { refresh = false } = {}) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const query = new URLSearchParams({ endpoint, ...params, ...(refresh && { refresh: '1' }) })
  const request = async () => {
    await throttle()
    return fetch(`${UNO_PROXY_URL}?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`
      }
    })
  }

  const res = await withSlot(async () => {
    let r = await request()
    for (const delay of RETRY_429_DELAYS_MS) {
      if (r.status !== 429) break
      await sleep(delay)
      r = await request()
    }
    return r
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

  return { data: await res.json(), fetchedAt: res.headers?.get?.('x-uno-fetched-at') || null }
}

export async function callUnoProxy(endpoint, params = {}) {
  return (await fetchProxyMeta(endpoint, params)).data
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

// O demonstrativo mensal so existe para meses fechados: enquanto um mes nao
// fechou (o mes calendario corrente, ou qualquer mes sem atualizacao de cota
// pro cliente — ex. um cliente que so atualiza esporadicamente), a UNO
// devolve 400. Anda pra tras ate achar o ultimo mes fechado (limite de 12
// tentativas pra nao entrar em loop se o cliente nao tiver dado nenhum).
async function fetchDemonstrativo(month, year, clientId, attemptsLeft = 12, refresh = false) {
  const params = { consulting_id: '1', mes: String(month), ano: String(year), ...clientParam(clientId) }
  try {
    const { data, fetchedAt } = await fetchProxyMeta('demonstrativoFundosCliente', params, { refresh })
    return { data, month, year, fetchedAt }
  } catch (err) {
    if (err?.status === 400 && attemptsLeft > 0) {
      const previous = new Date(year, month - 1, 1)
      previous.setMonth(previous.getMonth() - 1)
      // o refresh vale só p/ o mes pedido: os anteriores saem da copia guardada (cada um custa pageview)
      return fetchDemonstrativo(previous.getMonth() + 1, previous.getFullYear(), clientId, attemptsLeft - 1)
    }
    throw err
  }
}

function clientParam(clientId) {
  return clientId ? { client_id: String(clientId) } : {}
}

// evolucaoAnualCliente devolve, por ano, o Patrimonio/Rentabilidade/Meta
// mes a mes exatamente como o UNO calcula (mesma fonte que o dashboard real
// do UNO usa) — uma chamada por ano civil coberto pelo periodo selecionado.
function fetchEvolucaoMeta(ano, clientId, opts) {
  return fetchProxyMeta('evolucaoAnualCliente', { consulting_id: '1', ano: String(ano), ...clientParam(clientId) }, opts)
}

export async function fetchEvolucaoAnual(ano, clientId) {
  return (await fetchEvolucaoMeta(ano, clientId)).data
}

export async function fetchClientesList() {
  return callUnoProxy('clientesUNO', { consulting_id: '1' })
}

export async function fetchOwnUnoClient() {
  return callUnoProxy('clienteUNO', { consulting_id: '1' })
}

// outer_api/clientesUNO ja devolve "municipio" formatado como "Cidade - UF"
// (mesmo texto que aparece no seletor de clientes do UNO).
function formatClientName(row) {
  return row?.municipio || row?.nome_rpps || `Cliente ${row?.id}`
}

/** Lista todos os clientes reais do UNO (Super Admin apenas — a Edge Function rejeita outros papeis). */
export async function fetchUnoClients() {
  const rows = await fetchClientesList()
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      uno_client_id: String(row.id),
      name: formatClientName(row),
      fimCarteira: parseFimCarteira(row.fim_carteira)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Nome do cliente UNO vinculado ao proprio usuario (resolvido no servidor). */
export async function fetchOwnUnoClientName() {
  const row = await fetchOwnUnoClient()
  const record = Array.isArray(row) ? row[0] : row
  return record ? formatClientName(record) : ''
}

/** Ultimo mes com carteira calculada pro cliente vinculado ao proprio usuario. */
export async function fetchOwnUnoClientFimCarteira() {
  const row = await fetchOwnUnoClient()
  const record = Array.isArray(row) ? row[0] : row
  return parseFimCarteira(record?.fim_carteira)
}

export async function fetchUnoDashboard(period, { refresh = false } = {}) {
  const years = yearsInRange(period.startDate, period.endDate)

  const [demonstrativo, ...evolucaoMetas] = await Promise.all([
    fetchDemonstrativo(period.month, period.year, period.clientId, 12, refresh),
    ...years.map((ano) => fetchEvolucaoMeta(ano, period.clientId, { refresh }))
  ])
  const evolucoes = evolucaoMetas.map((m) => m.data)
  // Idade do dado na tela = a da copia mais antiga entre as consultas (null se nao veio de cache).
  const dates = [demonstrativo.fetchedAt, ...evolucaoMetas.map((m) => m.fetchedAt)].filter(Boolean)
  const fetchedAt = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null

  // month/year devolvidos podem ser anteriores aos pedidos (fallback do
  // fetchDemonstrativo) — o chamador usa isso pra corrigir o mes selecionado
  // na tela quando o mes pedido nao tinha dado fechado.
  return { demonstrativo: demonstrativo.data, demonstrativoMonth: demonstrativo.month, demonstrativoYear: demonstrativo.year, evolucoes, fetchedAt }
}
