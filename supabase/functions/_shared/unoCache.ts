/**
 * Cache servidor das respostas do UNO (tabela `uno_cache`) — fonte única para a Edge Function.
 *
 * Cada consulta ao UNO que passa por demonstrativo/evolução gasta pageview do ComDinheiro
 * (limite mensal). A cópia guardada só é refeita quando alguém pede "Atualizar".
 */

// Só estes endpoints chegam ao ComDinheiro; o resto (clienteUNO etc.) passa direto.
export const CACHEABLE_ENDPOINTS = ["demonstrativoFundosCliente", "evolucaoAnualCliente"]

// Cliente real pode atualizar o próprio dado no máximo 1x por hora (Super Admin sem trava).
export const REFRESH_COOLDOWN_MS = 60 * 60 * 1000

export function isCacheable(endpoint: string): boolean {
  return CACHEABLE_ENDPOINTS.includes(endpoint)
}

/**
 * 'serve' = devolve a cópia guardada; 'fetch' = consulta o UNO (e grava o resultado).
 * - sem `refresh`: usa a cópia se existir, senão consulta;
 * - `refresh` no demo só vale para Super Admin (o demo é compartilhado por todos);
 * - `refresh` de cliente comum respeita o intervalo mínimo.
 */
export function decideUnoCache(opts: {
  hasRow: boolean
  fetchedAt?: string | null
  refresh: boolean
  isSuperAdmin: boolean
  isDemo: boolean
  now?: number
}): "serve" | "fetch" {
  const { hasRow, fetchedAt, refresh, isSuperAdmin, isDemo, now = Date.now() } = opts
  if (!hasRow) return "fetch"
  if (!refresh) return "serve"
  if (isDemo && !isSuperAdmin) return "serve"
  if (isSuperAdmin) return "fetch"
  const age = now - new Date(fetchedAt ?? 0).getTime()
  return age < REFRESH_COOLDOWN_MS ? "serve" : "fetch"
}
