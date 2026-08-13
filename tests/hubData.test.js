import { describe, it, expect, vi } from 'vitest'
import { fetchNews, fetchNewsById } from '../src/services/newsData'
import { fetchUnoUpdates, fetchUnoUpdateById, saveUnoUpdate, deleteUnoUpdate } from '../src/services/unoUpdatesData'

describe('services/newsData', () => {
  it('fetchNews ordena por published_at desc e devolve a lista', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [{ id: 'n1', title: 'Notícia' }],
              error: null
            }))
          }))
        }))
      }))
    }

    const result = await fetchNews({ supabase })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Notícia')
    expect(supabase.from).toHaveBeenCalledWith('news')
  })

  it('fetchNews propaga erro da query', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: null, error: new Error('falha') }))
          }))
        }))
      }))
    }

    await expect(fetchNews({ supabase })).rejects.toThrow('falha')
  })

  it('fetchNewsById busca por id', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'n1', title: 'X' },
              error: null
            }))
          }))
        }))
      }))
    }

    const result = await fetchNewsById('n1', { supabase })
    expect(result.id).toBe('n1')
    expect(supabase.from).toHaveBeenCalledWith('news')
  })

  it('fetchNewsById lanca quando nao encontra', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'vazio' } }))
          }))
        }))
      }))
    }

    await expect(fetchNewsById('n1', { supabase })).rejects.toThrow(
      'Notícia não encontrada.'
    )
  })
})

describe('services/unoUpdatesData', () => {
  it('fetchUnoUpdates devolve a lista ordenada', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: [{ id: 'u1' }], error: null }))
        }))
      }))
    }

    const result = await fetchUnoUpdates({ supabase })
    expect(result).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('uno_updates')
  })

  it('fetchUnoUpdateById busca por id', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'u1', title: 'Novidade' },
              error: null
            }))
          }))
        }))
      }))
    }

    const result = await fetchUnoUpdateById('u1', { supabase })
    expect(result.title).toBe('Novidade')
  })

  it('saveUnoUpdate faz upsert e devolve a linha salva', async () => {
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'u1', title: 'Nova' },
              error: null
            }))
          }))
        }))
      }))
    }

    const result = await saveUnoUpdate({ title: 'Nova' }, { supabase })
    expect(result.title).toBe('Nova')
    expect(supabase.from).toHaveBeenCalledWith('uno_updates')
  })

  it('saveUnoUpdate propaga erro do upsert', async () => {
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: new Error('falha') }))
          }))
        }))
      }))
    }

    await expect(saveUnoUpdate({}, { supabase })).rejects.toThrow('falha')
  })

  it('deleteUnoUpdate remove por id', async () => {
    const supabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }))
    }

    await expect(deleteUnoUpdate('u1', { supabase })).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('uno_updates')
  })

  it('deleteUnoUpdate propaga erro', async () => {
    const supabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: new Error('falha') }))
        }))
      }))
    }

    await expect(deleteUnoUpdate('u1', { supabase })).rejects.toThrow('falha')
  })
})
