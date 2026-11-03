import { supabase } from '../lib/supabase'
import { parseFimCarteira } from '../utils/uno'

const UNO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uno-proxy`

// A Edge Function uno-proxy so aceita GET (endpoint + params na query string).
export async function callUnoProxy(endpoint, params = {}) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const query = new URLSearchParams({ endpoint, ...params })
  const res = await fetch(`${UNO_PROXY_URL}?${query.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`
    }
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

function extractUnoErrorMessage(text) {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text)
    return typeof parsed?.message === 'string' ? parsed.message : ''
  } catch {
    return text
  }
}

/**
 * Dashboard do cliente numa unica chamada (a propria API do UNO calcula tudo).
 * `month`/`year` juntos, ou nenhum dos dois: sem eles o UNO usa a ultima carteira fechada.
 * `period`: 'ano', '12', '24', '36', '48' ou '60'.
 */
export function fetchUnoDashboard({ clientId, month, year, period }) {
  return callUnoProxy('dashboardCliente', {
    periodo: period,
    ...(clientId && { client_id: String(clientId) }),
    ...(month && year && { mes: String(month), ano: String(year) })
  })
}

/** Melhorias e funcionalidades publicadas no sininho do UNO. */
export async function fetchUnoMelhorias() {
  const { rows } = await callUnoProxy('melhoriasUNO')
  return rows ?? []
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
