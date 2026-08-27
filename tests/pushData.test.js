import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { unsubscribePushForDevice } from '../src/services/pushData'

function fakeSupabase() {
  const del = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }))
  return { supabase: { from: vi.fn(() => ({ delete: del })) }, del }
}

describe('unsubscribePushForDevice', () => {
  const unsubscribe = vi.fn().mockResolvedValue(true)

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { getSubscription: () => Promise.resolve({ unsubscribe }) }
        })
      }
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('desinscreve no navegador e apaga a linha do usuário', async () => {
    const { supabase, del } = fakeSupabase()
    await unsubscribePushForDevice('u1', { supabase })
    expect(unsubscribe).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('push_subscriptions')
    expect(del).toHaveBeenCalled()
  })

  it('sem userId não toca no banco (mas ainda desinscreve o dispositivo)', async () => {
    const { supabase } = fakeSupabase()
    await unsubscribePushForDevice(undefined, { supabase })
    expect(unsubscribe).toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
