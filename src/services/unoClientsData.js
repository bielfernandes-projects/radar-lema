import { fetchClientesList, fetchOwnUnoClient } from './unoProxy'

function formatClientName(row) {
  // outer_api/clientesUNO ja devolve "municipio" formatado como "Cidade - UF"
  // (mesmo texto que aparece no seletor de clientes do UNO).
  return row?.municipio || row?.nome_rpps || `Cliente ${row?.id}`
}

/** Lista todos os clientes reais do UNO (Super Admin apenas — a Edge Function rejeita outros papeis). */
export async function fetchUnoClients() {
  const rows = await fetchClientesList()
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({ uno_client_id: String(row.id), name: formatClientName(row) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Nome do cliente UNO vinculado ao proprio usuario (resolvido no servidor). */
export async function fetchOwnUnoClientName() {
  const row = await fetchOwnUnoClient()
  const record = Array.isArray(row) ? row[0] : row
  return record ? formatClientName(record) : ''
}
