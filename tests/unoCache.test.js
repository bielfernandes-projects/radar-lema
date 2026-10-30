import { describe, expect, it } from 'vitest'
import {
  decideUnoCache,
  isCacheable,
  REFRESH_COOLDOWN_MS
} from '../supabase/functions/_shared/unoCache.ts'

const NOW = Date.parse('2026-11-02T12:00:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()
const base = { hasRow: true, fetchedAt: ago(5 * 24 * 3600 * 1000), refresh: false, isSuperAdmin: false, isDemo: false, now: NOW }

describe('_shared/unoCache — decideUnoCache', () => {
  it('sem cópia guardada: consulta o UNO', () => {
    expect(decideUnoCache({ ...base, hasRow: false })).toBe('fetch')
    expect(decideUnoCache({ ...base, hasRow: false, refresh: true, isSuperAdmin: true })).toBe('fetch')
  })

  it('com cópia e sem refresh: serve a cópia, por mais antiga que seja', () => {
    expect(decideUnoCache(base)).toBe('serve')
    expect(decideUnoCache({ ...base, isDemo: true })).toBe('serve')
  })

  it('refresh no demo: só Super Admin consulta o UNO', () => {
    expect(decideUnoCache({ ...base, isDemo: true, refresh: true })).toBe('serve')
    expect(decideUnoCache({ ...base, isDemo: true, refresh: true, isSuperAdmin: true })).toBe('fetch')
  })

  it('refresh de Super Admin nunca esbarra no intervalo mínimo', () => {
    expect(decideUnoCache({ ...base, refresh: true, isSuperAdmin: true, fetchedAt: ago(1000) })).toBe('fetch')
  })

  it('refresh de cliente comum respeita o intervalo de 1h', () => {
    expect(decideUnoCache({ ...base, refresh: true, fetchedAt: ago(REFRESH_COOLDOWN_MS - 1000) })).toBe('serve')
    expect(decideUnoCache({ ...base, refresh: true, fetchedAt: ago(REFRESH_COOLDOWN_MS + 1000) })).toBe('fetch')
  })

  it('só demonstrativo e evolução anual entram no cache', () => {
    expect(isCacheable('demonstrativoFundosCliente')).toBe(true)
    expect(isCacheable('evolucaoAnualCliente')).toBe(true)
    expect(isCacheable('clienteUNO')).toBe(false)
    expect(isCacheable('fundosCliente')).toBe(false)
  })
})
