import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDateRange,
  formatModality,
  formatPrice,
  formatSessionTime
} from '../src/utils/formatters'

describe('formatCurrency', () => {
  it('formata valor em reais', () => {
    expect(formatCurrency(500)).toBe('R$\xa0500,00')
  })

  it('retorna null para valores invalidos', () => {
    expect(formatCurrency(null)).toBeNull()
    expect(formatCurrency(undefined)).toBeNull()
  })
})

describe('formatPrice', () => {
  it('retorna Gratuito para evento gratuito', () => {
    expect(formatPrice({ is_free: true })).toBe('Gratuito')
  })

  it('retorna "A partir de" para evento pago', () => {
    expect(formatPrice({ is_free: false, price_from: 350 })).toBe(
      'A partir de R$\xa0350,00'
    )
  })
})

describe('formatDateRange', () => {
  it('formata data unica', () => {
    expect(formatDateRange('2026-07-12', '2026-07-12')).toBe(
      '12 de julho de 2026'
    )
  })

  it('formata intervalo no mesmo mes', () => {
    expect(formatDateRange('2026-07-12', '2026-07-14')).toBe(
      '12 a 14 de julho de 2026'
    )
  })

  it('formata intervalo em meses diferentes', () => {
    expect(formatDateRange('2026-07-30', '2026-08-02')).toBe(
      '30 de julho a 2 de agosto de 2026'
    )
  })
})

describe('formatModality', () => {
  it('traduz modalidade', () => {
    expect(formatModality('presencial')).toBe('Presencial')
    expect(formatModality('online')).toBe('Online')
    expect(formatModality('hibrido')).toBe('Híbrido')
  })
})

describe('formatSessionTime', () => {
  it('formata sessao em um unico dia', () => {
    expect(formatSessionTime('2026-07-12', '09:00:00', '2026-07-12', '18:00:00')).toBe(
      '12 de julho de 2026, 09:00 - 18:00'
    )
  })
})
