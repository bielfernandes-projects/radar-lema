import { describe, it, expect } from 'vitest'
import { isStaffTier, isSuperAdmin, isUnoClient } from '../src/utils/auth'

describe('utils/auth', () => {
  it('isUnoClient retorna true apenas quando is_uno_client for true', () => {
    expect(isUnoClient({ is_uno_client: true })).toBe(true)
    expect(isUnoClient({ is_uno_client: false })).toBe(false)
    expect(isUnoClient({})).toBe(false)
    expect(isUnoClient(null)).toBe(false)
  })

  it('isUnoClient e ortogonal ao user_type', () => {
    expect(isUnoClient({ user_type: 'client', is_uno_client: true })).toBe(true)
    expect(isUnoClient({ user_type: 'staff', is_uno_client: false })).toBe(false)
  })

  it('isStaffTier e isSuperAdmin seguem o modelo de roles', () => {
    expect(isStaffTier({ user_type: 'staff' })).toBe(true)
    expect(isStaffTier({ user_type: 'super_admin' })).toBe(true)
    expect(isStaffTier({ user_type: 'client' })).toBe(false)
    expect(isSuperAdmin({ user_type: 'super_admin' })).toBe(true)
    expect(isSuperAdmin({ role: 'ROLE_SUPER_ADMIN' })).toBe(true)
    expect(isSuperAdmin({ user_type: 'staff' })).toBe(false)
  })
})
