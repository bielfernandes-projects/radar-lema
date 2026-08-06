import { describe, expect, it } from 'vitest'
import { enrichEvents } from '../src/utils/events'
import { filterEvents, normalizeDate } from '../src/utils/filterEvents'

describe('normalizeDate', () => {
  it('converte string ISO para Date', () => {
    const d = normalizeDate('2026-09-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.getTime()).toBe(new Date('2026-09-15T00:00:00').getTime())
  })

  it('retorna null para entrada vazia', () => {
    expect(normalizeDate(null)).toBeNull()
    expect(normalizeDate(undefined)).toBeNull()
    expect(normalizeDate('')).toBeNull()
  })
})

describe('enrichEvents', () => {
  const events = [
    { id: 'e1', title: 'Evento 1' },
    { id: 'e2', title: 'Evento 2' }
  ]

  const photos = [
    { event_id: 'e1', public_url: 'https://example.com/photo1.jpg' }
  ]

  const sessions = [
    { event_id: 'e1', start_date: '2026-09-15', end_date: '2026-09-16', start_time: '09:00', end_time: '18:00' },
    { event_id: 'e1', start_date: '2026-10-01', end_date: '2026-10-01', start_time: '09:00', end_time: '12:00' },
    { event_id: 'e2', start_date: '2025-01-10', end_date: '2025-01-10', start_time: '09:00', end_time: '12:00' }
  ]

  const eventCategories = [
    { event_id: 'e1', category_id: 'c1' },
    { event_id: 'e1', category_id: 'c2' },
    { event_id: 'e2', category_id: 'c1' }
  ]

  const pastIds = new Set(['e2'])
  const ongoingIds = new Set([])

  it('adiciona cover_photo baseado nas fotos', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds)
    expect(result[0].cover_photo).toEqual(photos[0])
    expect(result[1].cover_photo).toBeUndefined()
  })

  it('adiciona category_ids a partir do relacionamento', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds, eventCategories)
    expect(result[0].category_ids).toEqual(['c1', 'c2'])
    expect(result[1].category_ids).toEqual(['c1'])
  })

  it('retorna category_ids vazio quando nao ha relacionamento', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds)
    expect(result[0].category_ids).toEqual([])
  })

  it('calcula min_date e max_date a partir das sessoes', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds)
    expect(result[0].min_date).toBe('2026-09-15')
    expect(result[0].max_date).toBe('2026-10-01')
    expect(result[1].min_date).toBe('2025-01-10')
    expect(result[1].max_date).toBe('2025-01-10')
  })

  it('marca is_past e is_ongoing corretamente', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds)
    expect(result[0].is_past).toBe(false)
    expect(result[1].is_past).toBe(true)
    expect(result[0].is_ongoing).toBe(false)
  })

  it('preserva is_confirmed no evento enriquecido', () => {
    const withFlag = [
      { id: 'e1', title: 'Evento 1', is_confirmed: false },
      { id: 'e2', title: 'Evento 2', is_confirmed: true }
    ]
    const result = enrichEvents(withFlag, photos, sessions, pastIds, ongoingIds)
    expect(result[0].is_confirmed).toBe(false)
    expect(result[1].is_confirmed).toBe(true)
  })

  it('adiciona sessions array a cada evento', () => {
    const result = enrichEvents(events, photos, sessions, pastIds, ongoingIds)
    expect(result[0].sessions).toHaveLength(2)
    expect(result[1].sessions).toHaveLength(1)
  })

  it('retorna array vazio quando events esta vazio', () => {
    const result = enrichEvents([], photos, sessions, pastIds, ongoingIds)
    expect(result).toEqual([])
  })
})

describe('filterEvents', () => {
  const categories = [
    { id: 'c1', name: 'Congresso' },
    { id: 'c2', name: 'Curso' }
  ]

  const events = [
    { id: 'e1', title: 'Congresso RPPS', description: 'Evento nacional', category_ids: ['c1'], modality: 'presencial', is_free: false, state: 'SP', min_date: '2026-09-15', max_date: '2026-09-16', next_date: '2026-09-15', is_past: false },
    { id: 'e2', title: 'Curso Online', description: 'Curso de previdencia', category_ids: ['c2'], modality: 'online', is_free: true, state: null, min_date: '2026-10-01', max_date: '2026-10-01', next_date: '2026-10-01', is_past: false },
    { id: 'e3', title: 'Evento Passado', description: 'Ja realizado', category_ids: ['c1'], modality: 'presencial', is_free: false, state: 'RJ', min_date: '2025-01-10', max_date: '2025-01-10', next_date: '2025-01-10', is_past: true }
  ]

  it('retorna todos os eventos sem filtros', () => {
    const result = filterEvents(events, {}, categories)
    expect(result).toHaveLength(3)
  })

  it('exclui eventos passados com excludePast', () => {
    const result = filterEvents(events, {}, categories, { excludePast: true })
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('filtra por termo de busca no titulo', () => {
    const result = filterEvents(events, { q: 'congresso' }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e1')
  })

  it('filtra por termo de busca na descricao', () => {
    const result = filterEvents(events, { q: 'previdencia' }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e2')
  })

  it('filtra por categorias', () => {
    const result = filterEvents(events, { categories: ['Curso'] }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e2')
  })

  it('filtra por multi-categoria (evento em varias categorias)', () => {
    const multi = [
      { ...events[0], id: 'e4', category_ids: ['c1', 'c2'] }
    ]
    const result = filterEvents(multi, { categories: ['Curso'] }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e4')
  })

  it('filtra por modalidades', () => {
    const result = filterEvents(events, { modalities: ['Online'] }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e2')
  })

  it('filtra por preco gratuitos', () => {
    const result = filterEvents(events, { price: 'free' }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e2')
  })

  it('filtra por preco pagos', () => {
    const result = filterEvents(events, { price: 'paid' }, categories)
    expect(result).toHaveLength(2)
  })

  it('filtra por estado', () => {
    const result = filterEvents(events, { state: 'SP' }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e1')
  })

  it('ordena por next_date ascendente por padrao', () => {
    const result = filterEvents(events, {}, categories)
    expect(result[0].id).toBe('e3')
    expect(result[1].id).toBe('e1')
    expect(result[2].id).toBe('e2')
  })

  it('ordena por max_date descendente', () => {
    const result = filterEvents(events, {}, categories, { sortBy: 'max_date', sortDir: 'desc' })
    expect(result[0].id).toBe('e2')
    expect(result[1].id).toBe('e1')
  })

  it('combina multiplos filtros', () => {
    const result = filterEvents(events, { q: 'RPPS', categories: ['Congresso'] }, categories)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e1')
  })
})
