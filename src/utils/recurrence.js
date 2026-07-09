/**
 * Gera sessoes recorrentes a partir de uma sessao base.
 *
 * @param {object} baseSession - Primeira sessao com start_date, start_time, end_date, end_time.
 * @param {string} frequency - 'semanal', 'quinzenal' ou 'mensal'.
 * @param {string} untilDate - Data limite no formato YYYY-MM-DD.
 * @returns {object[]} Lista de sessoes geradas (inclui a base), com recurrence_instance: true.
 */
export function generateRecurringSessions(baseSession, frequency, untilDate) {
  if (!baseSession || !frequency || !untilDate) {
    return []
  }

  const intervalDays = getIntervalDays(frequency)
  if (intervalDays === null && frequency !== 'mensal') {
    return []
  }

  const sessions = []
  let currentStart = baseSession.start_date
  let currentEnd = baseSession.end_date

  while (compareDates(currentStart, untilDate) <= 0) {
    sessions.push({
      start_date: currentStart,
      start_time: baseSession.start_time,
      end_date: currentEnd,
      end_time: baseSession.end_time,
      recurrence_instance: true
    })

    if (frequency === 'mensal') {
      currentStart = addMonths(currentStart, 1)
      currentEnd = addMonths(currentEnd, 1)
    } else {
      currentStart = addDays(currentStart, intervalDays)
      currentEnd = addDays(currentEnd, intervalDays)
    }
  }

  return sessions
}

function getIntervalDays(frequency) {
  switch (frequency) {
    case 'semanal':
      return 7
    case 'quinzenal':
      return 14
    default:
      return null
  }
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

function formatDate(year, month, day) {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateStr, days) {
  const { year, month, day } = parseDate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function addMonths(dateStr, months) {
  const { year, month, day } = parseDate(dateStr)
  let totalMonths = (year * 12 + (month - 1)) + months
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1
  const lastDayOfMonth = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate()
  const newDay = Math.min(day, lastDayOfMonth)
  return formatDate(newYear, newMonth, newDay)
}

function compareDates(a, b) {
  const da = new Date(`${a}T00:00:00Z`).getTime()
  const db = new Date(`${b}T00:00:00Z`).getTime()
  if (da < db) return -1
  if (da > db) return 1
  return 0
}
