import { describe, expect, it } from 'vitest'
import { parseFimCarteira } from '../src/utils/uno'

describe('parseFimCarteira', () => {
  it('extrai month e year de "M/AAAA" sem zero a esquerda', () => {
    expect(parseFimCarteira('7/2026')).toEqual({ month: 7, year: 2026 })
    expect(parseFimCarteira('12/2025')).toEqual({ month: 12, year: 2025 })
  })

  it('retorna null para formato invalido ou ausente', () => {
    expect(parseFimCarteira('2026-07')).toBeNull()
    expect(parseFimCarteira(null)).toBeNull()
    expect(parseFimCarteira(undefined)).toBeNull()
    expect(parseFimCarteira('')).toBeNull()
  })
})
