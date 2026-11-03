/**
 * Helpers para filtros de data por preset (este mes, proximo mes).
 */

export function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0]
  }
}

export function applyDatePresets(presets = []) {
  const now = new Date()
  return presets
    .map((preset) => {
      if (preset === 'this-month') {
        return getMonthRange(now.getFullYear(), now.getMonth())
      }
      if (preset === 'next-month') {
        return getMonthRange(now.getFullYear(), now.getMonth() + 1)
      }
      return null
    })
    .filter(Boolean)
}

export function normalizeDate(dateInput) {
  if (!dateInput) return null
  return new Date(`${dateInput}T00:00:00`)
}

export function eventMatchesDatePresets(eventMinDate, eventMaxDate, presets = []) {
  if (presets.length === 0) return true

  const min = normalizeDate(eventMinDate)
  const max = normalizeDate(eventMaxDate)
  if (!min || !max) return false

  const ranges = applyDatePresets(presets)
  return ranges.some((range) => {
    const from = normalizeDate(range.from)
    const to = normalizeDate(range.to)
    if (!from || !to) return false
    if (max < from) return false
    if (min > to) return false
    return true
  })
}

export function eventMatchesDateRange(eventMinDate, eventMaxDate, from, to) {
  const min = normalizeDate(eventMinDate)
  const max = normalizeDate(eventMaxDate)
  if (!min && !max) return false
  if (from) {
    const rangeFrom = normalizeDate(from)
    if (!rangeFrom || !max || max < rangeFrom) return false
  }
  if (to) {
    const rangeTo = normalizeDate(to)
    if (!rangeTo || !min || min > rangeTo) return false
  }
  return true
}

/** Param de data da URL so vale se for AAAA-MM-DD de uma data real; senao e ignorado. */
export function validIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return ''
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  // 2026-02-31 viraria 03/03: so vale se a data nao "rolou" para outro dia
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? value : ''
}

/** Busca textual vinda da URL: limita o tamanho para nao renderizar um texto gigante. */
export const MAX_SEARCH_LENGTH = 100

