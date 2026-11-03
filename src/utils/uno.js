/**
 * Helpers do modulo UNO: rotulos de mes, leitura do fim da carteira e a
 * juncao das Novidades UNO. (Os calculos do Dashboard agora vem prontos da API
 * `dashboardCliente` — ver utils/unoDashboard.js.)
 */

export const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

/**
 * parseFimCarteira: extrai { month, year } de "M/AAAA" (sem zero a esquerda) —
 * campo que clientesUNO/clienteUNO devolvem com o ultimo mes em que o cliente
 * tem carteira calculada. E o mesmo limite que o seletor de mes do
 * unoapp.com.br aplica pra esse cliente (clientes sem atualizacao recente de
 * cota ficam parados nesse mes, mesmo com o mes calendario ja fechado).
 */
export function parseFimCarteira(value) {
  const str = String(value ?? '').trim()
  const m = str.match(/^(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return { month: Number(m[1]), year: Number(m[2]) }
}

const normTitle = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * mergeNovidades: junta os avisos do staff (uno_updates) com as melhorias do sininho do UNO,
 * da mais nova pra mais antiga. Aviso manual com o mesmo titulo de uma melhoria do UNO some
 * (a versao do UNO e a fonte); os demais avisos seguem.
 */
export function mergeNovidades(avisos, melhorias) {
  const unoTitles = new Set(melhorias.map((m) => normTitle(m.improvement_title)))
  return [
    ...avisos
      .filter((a) => !unoTitles.has(normTitle(a.title)))
      .map((a) => ({ kind: 'aviso', id: a.id, date: a.created_at, item: a })),
    ...melhorias.map((m) => ({ kind: 'melhoria', id: `uno-${m.improvement_id}`, date: m.improvement_date, item: m }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
}
