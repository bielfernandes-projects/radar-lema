import { describe, expect, it } from 'vitest'
import {
  isSuperAdminProfile,
  canAccessLemaExclusive,
  resolveUnoClientId
} from '../supabase/functions/_shared/access.ts'

// Regra crítica de isolamento entre RPPS na Edge Function uno-proxy.
describe('_shared/access — resolveUnoClientId', () => {
  const fallback = '192'

  it('cliente comum SEMPRE consulta o próprio vínculo, ignorando o client_id da requisição', () => {
    expect(
      resolveUnoClientId({
        isSuperAdmin: false,
        requestedClientId: '999', // tentativa de spoof
        ownClientId: '455',
        fallback
      })
    ).toBe('455')
  })

  it('cliente comum sem vínculo cai no fallback (nunca no client_id pedido)', () => {
    expect(
      resolveUnoClientId({ isSuperAdmin: false, requestedClientId: '999', ownClientId: null, fallback })
    ).toBe('192')
  })

  it('Super Admin pode escolher qualquer client_id', () => {
    expect(
      resolveUnoClientId({ isSuperAdmin: true, requestedClientId: '999', ownClientId: '455', fallback })
    ).toBe('999')
  })

  it('Super Admin sem client_id na requisição usa o próprio vínculo, depois o fallback', () => {
    expect(
      resolveUnoClientId({ isSuperAdmin: true, requestedClientId: null, ownClientId: '455', fallback })
    ).toBe('455')
    expect(
      resolveUnoClientId({ isSuperAdmin: true, requestedClientId: null, ownClientId: null, fallback })
    ).toBe('192')
  })
})

describe('_shared/access — predicados', () => {
  it('isSuperAdminProfile: user_type ou role legada', () => {
    expect(isSuperAdminProfile({ user_type: 'super_admin' })).toBe(true)
    expect(isSuperAdminProfile({ role: 'ROLE_SUPER_ADMIN' })).toBe(true)
    expect(isSuperAdminProfile({ user_type: 'client' })).toBe(false)
    expect(isSuperAdminProfile(null)).toBe(false)
  })

  it('canAccessLemaExclusive: Cliente Lema ou Super Admin', () => {
    expect(canAccessLemaExclusive({ is_uno_client: true })).toBe(true)
    expect(canAccessLemaExclusive({ user_type: 'super_admin', is_uno_client: false })).toBe(true)
    expect(canAccessLemaExclusive({ user_type: 'client', is_uno_client: false })).toBe(false)
  })
})
