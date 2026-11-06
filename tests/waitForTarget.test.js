import { describe, it, expect, afterEach } from 'vitest'
import { waitForTarget } from '../src/tour/waitForTarget'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('waitForTarget', () => {
  it('resolve assim que o alvo aparece, antes do tempo limite', async () => {
    setTimeout(() => {
      document.body.innerHTML = '<div data-tour="x"></div>'
    }, 60)
    const start = Date.now()
    await waitForTarget('[data-tour="x"]', 2000, 10)
    expect(document.querySelector('[data-tour="x"]')).not.toBeNull()
    expect(Date.now() - start).toBeLessThan(1500)
  })

  it('resolve na hora se o alvo ja existe', async () => {
    document.body.innerHTML = '<div data-tour="y"></div>'
    const start = Date.now()
    await waitForTarget('[data-tour="y"]', 2000, 10)
    expect(Date.now() - start).toBeLessThan(100)
  })

  it('resolve ao estourar o tempo se o alvo nunca aparece', async () => {
    const start = Date.now()
    await waitForTarget('[data-tour="nunca"]', 80, 10)
    expect(Date.now() - start).toBeGreaterThanOrEqual(70)
    expect(document.querySelector('[data-tour="nunca"]')).toBeNull()
  })
})
