import { eventMatchesDatePresets, normalizeDate, eventMatchesDateRange } from './dateFilters'
import { MODALITY_LABELS } from './constants'

export { normalizeDate }

export function filterEvents(events, filters, categories, options = {}) {
  const { excludePast, sortBy = 'next_date', sortDir = 'asc' } = options
  let result = excludePast
    ? events.filter((event) => !event.is_past)
    : [...events]

  if (filters.q?.trim()) {
    const term = filters.q.toLowerCase()
    result = result.filter(
      (event) =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term)
    )
  }

  if (filters.categories?.length > 0) {
    const categoryNames = new Set(filters.categories)
    result = result.filter((event) =>
      categories.some(
        (c) => event.category_ids?.includes(c.id) && categoryNames.has(c.name)
      )
    )
  }

  if (filters.modalities?.length > 0) {
    const values = new Set(filters.modalities.map((m) => MODALITY_LABELS[m]))
    result = result.filter((event) => values.has(event.modality))
  }

  if (filters.price === 'free') {
    result = result.filter((event) => event.is_free)
  } else if (filters.price === 'paid') {
    result = result.filter((event) => !event.is_free)
  }

  if (filters.lemaEdu) {
    result = result.filter((event) => event.is_lema_edu)
  }

  if (filters.state) {
    result = result.filter((event) => event.state === filters.state)
  }

  if (filters.datePresets?.length > 0) {
    result = result.filter((event) =>
      eventMatchesDatePresets(event.min_date, event.max_date, filters.datePresets)
    )
  }

  if (filters.dateFrom || filters.dateTo) {
    result = result.filter((event) =>
      eventMatchesDateRange(event.min_date, event.max_date, filters.dateFrom, filters.dateTo)
    )
  }

  const fallbackDate = sortBy === 'max_date'
    ? new Date('0000-01-01')
    : new Date('9999-12-31')

  return result.sort((a, b) => {
    const da = normalizeDate(a[sortBy]) || fallbackDate
    const db = normalizeDate(b[sortBy]) || fallbackDate
    return sortDir === 'desc' ? db - da : da - db
  })
}
