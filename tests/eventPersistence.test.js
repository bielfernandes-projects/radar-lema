import { describe, it, expect, vi, beforeEach } from 'vitest'
import { persistEvent } from '../src/services/eventPersistence'

const { eventsPayloads, mockSupabase } = vi.hoisted(() => {
  const eventsPayloads = []
  const mockSupabase = {
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://url' } }),
        remove: () => Promise.resolve({ error: null })
      })
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        in: () => Promise.resolve({ data: [], error: null })
      }),
      insert: (payload) => {
        if (table === 'events') {
          eventsPayloads.push(payload)
          return {
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: 'new-event-id' }, error: null })
            })
          }
        }
        return Promise.resolve({ data: null, error: null })
      },
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        in: () => Promise.resolve({ data: null, error: null })
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  }
  return { eventsPayloads, mockSupabase }
})

vi.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase
}))

const baseForm = {
  title: 'Evento',
  description: 'Descricao',
  modality: 'online',
  is_lema_edu: false,
  is_free: true,
  price_from: '',
  city: '',
  state: '',
  address: '',
  url: 'https://example.com',
  is_recurring: false,
  recurrence_freq: '',
  recurrence_until: '',
  category_ids: ['c1']
}

describe('persistEvent', () => {
  beforeEach(() => {
    eventsPayloads.length = 0
  })

  it('salva is_confirmed true quando is_tentative e false', async () => {
    await persistEvent({
      form: { ...baseForm, is_tentative: false },
      sessionsToSave: [],
      isEdit: false,
      isDuplicate: false,
      user: { id: 'u1' },
      photos: [],
      removedPhotoIds: []
    })

    expect(eventsPayloads[0].is_confirmed).toBe(true)
  })

  it('salva is_confirmed false quando is_tentative e true', async () => {
    await persistEvent({
      form: { ...baseForm, is_tentative: true },
      sessionsToSave: [],
      isEdit: false,
      isDuplicate: false,
      user: { id: 'u1' },
      photos: [],
      removedPhotoIds: []
    })

    expect(eventsPayloads[0].is_confirmed).toBe(false)
  })
})
