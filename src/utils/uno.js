/**
 * Normalizacao dos dados da API do UNO (via uno-proxy) para o Dashboard UNO.
 * A API nao tem schema publico, entao os acessos sao tolerantes a variacao
 * de nomes de campo.
 */

export function asArray(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.result)) return payload.result
  if (payload && Array.isArray(payload.items)) return payload.items
  return []
}

export function pickField(record, patterns) {
  for (const [key, value] of Object.entries(record || {})) {
    if (patterns.some((p) => p.test(key))) return value
  }
  return undefined
}

export function parseCommaNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return value
  return Number(String(value).replace(',', '.')) || 0
}

export function normalizeFunds(rows) {
  return asArray(rows)
    .map((row) => {
      const cotas = Number(row?.cotas_investidas ?? row?.qtd_quota ?? 0)
      const cota = Number(row?.ultima_cota_mes ?? 0)
      const saldoCalc = cotas * cota
      const saldoDirect = Number(pickField(row, [/saldo/i]) ?? 0)
      return {
        name: String(pickField(row, [/fund_name/i, /nome/i, /fundo/i, /descricao/i]) ?? 'Fundo'),
        saldo: saldoCalc > 0 ? saldoCalc : saldoDirect,
        rendimento: parseCommaNumber(pickField(row, [/rendimento_financeiro/i, /rendimento(?!_percentual)/i])),
        percentual: Number(pickField(row, [/rendimento_percentual/i, /percentual/i]) ?? 0),
        varFundo: parseCommaNumber(pickField(row, [/^var/i])),
        volatilidade: parseCommaNumber(pickField(row, [/volatilidade/i]))
      }
    })
    .filter((fund) => fund.saldo > 0)
}

export function summarizeFunds(funds) {
  const totalSaldo = funds.reduce((acc, fund) => acc + fund.saldo, 0)
  const totalRendimento = funds.reduce((acc, fund) => acc + fund.rendimento, 0)
  return {
    totalSaldo,
    totalRendimento,
    quantidade: funds.length,
    rendimentoPercentual: totalSaldo > 0 ? (totalRendimento / totalSaldo) * 100 : 0
  }
}

export function pad2(value) {
  return String(value).padStart(2, '0')
}

export function monthRange(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    startDate: `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)}/${start.getFullYear()}`,
    endDate: `${pad2(end.getDate())}/${pad2(end.getMonth() + 1)}/${end.getFullYear()}`
  }
}

const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

function toDate(value) {
  if (value instanceof Date) return value
  const str = String(value ?? '').trim()
  if (!str) return null
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
  }
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  }
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function dateFromRow(row) {
  const ano = Number(pickField(row, [/^ano$/i]))
  const mes = Number(pickField(row, [/^mes$/i]))
  if (Number.isFinite(ano) && Number.isFinite(mes) && mes >= 1 && mes <= 12) {
    return new Date(ano, mes - 1, 1)
  }
  return toDate(pickField(row, [/compet/i, /periodo/i, /^data$/i]))
}

export function evolutionLabel(dateInput) {
  const date = toDate(dateInput)
  if (!date) return null
  return `${MONTH_ABBR[date.getMonth()]}/${date.getFullYear()}`
}

export function normalizeEvolution(rows) {
  return asArray(rows)
    .map((row) => {
      const label = evolutionLabel(dateFromRow(row))
      const valor = Number(pickField(row, [/patrimonio/i, /saldo/i, /^valor$/i]))
      if (!label || !Number.isFinite(valor)) return null
      return { label, valor }
    })
    .filter(Boolean)
}

export function normalizeDashboardMetrics(payload) {
  const rows = asArray(payload)
  const source = rows.length > 0 ? rows[rows.length - 1] : payload || {}
  const num = (pattern) => {
    const value = pickField(source, pattern)
    return value === undefined || value === null || value === '' ? null : Number(value)
  }
  return {
    patrimonio: num([/^patrimonio$/i]),
    rentabilidadeMes: num([/rentabil.*(mes|mês)/i]),
    rentabilidadeAcum: num([/rentabil.*(acum|acumulado)/i]),
    metaMes: num([/^meta.*(mes|mês)/i]),
    metaAcum: num([/^meta.*(acum|acumulado)/i]),
    gapMes: num([/^gap.*(mes|mês)/i]),
    gapAcum: num([/^gap.*(acum|acumulado)/i]),
    varValue: num([/^var[^\w]?/i, /^var_\d/i]),
    varLabel: String(pickField(source, [/^var.*(label|sub|sigla)/i]) ?? '')
  }
}

export function normalizeClientName(...payloads) {
  for (const payload of payloads) {
    if (!payload) continue
    const rows = asArray(payload)
    const source = rows.length > 0 ? rows[0] : payload
    const name = pickField(source, [/municipio/i, /cliente/i, /rpps/i, /nome/i, /razao/i, /razão/i, /empresa/i])
    if (name) return String(name)
  }
  return ''
}

export function monthsAgoRange(months) {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - (months - 1))
  start.setDate(1)
  return {
    startDate: `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)}/${start.getFullYear()}`,
    endDate: `${pad2(end.getDate())}/${pad2(end.getMonth() + 1)}/${end.getFullYear()}`
  }
}

export function yearRange(year) {
  return {
    startDate: `01/01/${year}`,
    endDate: `31/12/${year}`
  }
}

export function rangeForPeriod(period, year) {
  return period === 'ano' ? yearRange(year) : monthsAgoRange(Number(period))
}
