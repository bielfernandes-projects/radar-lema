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

export function monthsAgoRange(months, refMonth, refYear) {
  const end = new Date(refYear, refMonth, 0)
  const start = new Date(refYear, refMonth - months, 1)
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

export function rangeForPeriod(period, refMonth, refYear) {
  return period === 'ano' ? yearRange(refYear) : monthsAgoRange(Number(period), refMonth, refYear)
}

/**
 * parseDiaUltimaCota: extrai { year, month } de "DD/MM/AAAA".
 */
export function parseDiaUltimaCota(dia) {
  const str = String(dia ?? '').trim()
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return { year: Number(m[3]), month: Number(m[2]) }
}

/**
 * yearsInRange: lista os anos (inteiros) cobertos por um intervalo
 * "DD/MM/YYYY" (inclusive nas duas pontas). Usado para saber quantas
 * chamadas a evolucaoAnualCliente (uma por ano) sao necessarias.
 */
export function yearsInRange(startDate, endDate) {
  const startYear = Number(String(startDate).split('/')[2])
  const endYear = Number(String(endDate).split('/')[2])
  const years = []
  for (let y = startYear; y <= endYear; y++) years.push(y)
  return years
}

/**
 * monthsBetween: lista ordenada de { month, year } entre duas datas
 * "DD/MM/YYYY" (inclusive), um item por mes.
 */
export function monthsBetween(startDate, endDate) {
  const [, , sm, sy] = String(startDate).match(/(\d{2})\/(\d{2})\/(\d{4})/) || []
  const [, , em, ey] = String(endDate).match(/(\d{2})\/(\d{2})\/(\d{4})/) || []
  if (!sm || !em) return []
  let month = Number(sm)
  let year = Number(sy)
  const endMonth = Number(em)
  const endYear = Number(ey)
  const out = []
  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push({ month, year })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return out
}

/**
 * mergeEvolucaoAnual: junta as respostas de evolucaoAnualCliente de varios
 * anos (um objeto { metas, rentabilidades, evolucaoPatrimonio } por ano,
 * cada um com chaves "M/AAAA") numa unica estrutura, mesma forma. Essa e a
 * fonte oficial do UNO para Patrimonio/Rentabilidade/Meta mes a mes — nada
 * disso e recalculado a partir dos fundos crus.
 */
export function mergeEvolucaoAnual(perYearResponses) {
  const metas = {}
  const rentabilidades = {}
  const evolucaoPatrimonio = {}
  for (const r of perYearResponses || []) {
    Object.assign(metas, r?.metas || {})
    Object.assign(rentabilidades, r?.rentabilidades || {})
    Object.assign(evolucaoPatrimonio, r?.evolucaoPatrimonio || {})
  }
  return { metas, rentabilidades, evolucaoPatrimonio }
}

/**
 * buildEvolucaoSeries: converte a estrutura mergeada + a janela de meses
 * pedida na serie ordenada usada pelos graficos/cards do dashboard.
 */
export function buildEvolucaoSeries(merged, months) {
  return months.map(({ month, year }) => {
    const key = `${month}/${year}`
    const patrimonioRaw = merged.evolucaoPatrimonio?.[key]
    const rentMes = merged.rentabilidades?.[key]?.mes
    const metaMes = merged.metas?.[key]?.mes
    return {
      key,
      label: `${MONTH_ABBR[month - 1]}/${year}`,
      month,
      year,
      patrimonio: patrimonioRaw !== undefined && patrimonioRaw !== null ? Number(patrimonioRaw) : null,
      rentMes: rentMes !== undefined && rentMes !== null ? Number(rentMes) : null,
      metaMes: metaMes !== undefined && metaMes !== null ? Number(metaMes) : null
    }
  })
}

/**
 * compoundPercent: composicao de uma serie de percentuais mensais
 * (ex: rentabilidade mes a mes) no acumulado do periodo — produto de
 * (1 + v/100), nao soma linear. Ignora meses sem valor (null/undefined).
 */
export function compoundPercent(values) {
  let acc = 1
  let hasValue = false
  for (const v of values || []) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) continue
    acc *= 1 + Number(v) / 100
    hasValue = true
  }
  return hasValue ? (acc - 1) * 100 : null
}
