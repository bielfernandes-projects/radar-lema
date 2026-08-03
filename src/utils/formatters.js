/**
 * Formatadores de apresentacao usados na UI do Radar Lema.
 */

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value))
}

export function formatPrice(event) {
  if (event.is_free) {
    return 'Gratuito'
  }
  const formatted = formatCurrency(event.price_from)
  return formatted ? `A partir de ${formatted}` : 'A partir de R$ 0,00'
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]

function formatDate(dateInput) {
  const date =
    dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00`)
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return { day, month, year }
}

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return ''

  const start = formatDate(startDate)
  const end = formatDate(endDate)

  if (start.year !== end.year) {
    return `${start.day} de ${start.month} de ${start.year} a ${end.day} de ${end.month} de ${end.year}`
  }

  if (start.month !== end.month) {
    return `${start.day} de ${start.month} a ${end.day} de ${end.month} de ${start.year}`
  }

  if (start.day !== end.day) {
    return `${start.day} a ${end.day} de ${start.month} de ${start.year}`
  }

  return `${start.day} de ${start.month} de ${start.year}`
}

export function formatModality(modality) {
  const map = {
    presencial: 'Presencial',
    online: 'Online',
    hibrido: 'Híbrido'
  }
  return map[modality] || modality
}

export function formatSessionTime(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime || !endDate || !endTime) return ''

  const { day, month, year } = formatDate(startDate)
  const sameDay = startDate === endDate
  const datePart = sameDay
    ? `${day} de ${month} de ${year}`
    : `${day} de ${month} a ${formatDate(endDate).day} de ${formatDate(endDate).month} de ${formatDate(endDate).year}`

  const start = startTime.slice(0, 5)
  const end = endTime.slice(0, 5)
  return `${datePart}, ${start} - ${end}`
}
