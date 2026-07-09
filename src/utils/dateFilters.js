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

function normalizeDate(dateInput) {
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
