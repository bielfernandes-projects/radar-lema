import { describe, it, expect, vi } from 'vitest'
import { fetchUnoClients } from '../src/services/unoClientsData'

describe('services/unoClientsData', () => {
  it('fetchUnoClients lista os clientes ordenados por nome', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ id: '1', uno_client_id: '192', name: 'Demonstração Lema' }],
            error: null
          }))
        }))
      }))
    }
    const result = await fetchUnoClients({ supabase })
    expect(result).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('uno_clients')
  })

  it('fetchUnoClients propaga erro da query', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: new Error('falha') }))
        }))
      }))
    }
    await expect(fetchUnoClients({ supabase })).rejects.toThrow('falha')
  })
})
