/**
 * Formatadores de apresentacao usados na UI do Radar Lema.
 */

import { REMINDER_UNITS, REMINDER_CHANNELS } from './constants'

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

export function formatReminderUnit(value, unit) {
  const unitConfig = REMINDER_UNITS.find((u) => u.value === unit)
  if (!unitConfig) return `${value}`
  return value === 1 ? unitConfig.label : unitConfig.plural
}

export function formatReminder(value, unit, channel) {
  const unitName = formatReminderUnit(value, unit)
  const channelLabel = REMINDER_CHANNELS.find((c) => c.value === channel)?.label || channel
  const base = `${value} ${unitName} antes`
  return channel ? `${base} • ${channelLabel}` : base
}

export function formatReminderMinutes(offsetMinutes, channel) {
  const { value, unit } = minutesToReminder(offsetMinutes)
  return formatReminder(value, unit, channel)
}

export function minutesToReminder(offsetMinutes) {
  const value = Number(offsetMinutes)
  const order = [...REMINDER_UNITS].sort((a, b) => b.minutes - a.minutes)
  const unitConfig = order.find((u) => value % u.minutes === 0) || REMINDER_UNITS[0]
  return { value: value / unitConfig.minutes, unit: unitConfig.value }
}
