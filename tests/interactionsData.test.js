import { describe, it, expect, vi } from 'vitest'
import {
  fetchLikeStatus,
  toggleLike,
  fetchComments,
  addComment,
  deleteComment,
  toggleCommentHidden,
  fetchModerationQueue
} from '../src/services/interactionsData'

function buildSupabase(routes = {}) {
  const supabase = {
    from: vi.fn((table) => routes[table] || { select: () => Promise.resolve({ data: [], error: null }) }),
    storage: {}
  }
  return supabase
}

describe('services/interactionsData', () => {
  it('fetchLikeStatus retorna liked e count', async () => {
    let eqCall = 0
    const supabase = {
      from: vi.fn(() => {
        if (eqCall === 0) {
          eqCall += 1
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  count: 3,
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => ({
                    data: { id: 'l1' },
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }
      })
    }

    const result = await fetchLikeStatus('article', 'c1', 'u1', { supabase })
    expect(result).toEqual({ liked: true, count: 3 })
  })

  it('toggleLike insere quando nao curtido', async () => {
    const insert = vi.fn(() => ({ error: null }))
    const supabase = buildSupabase({ likes: { insert } })
    await toggleLike('article', 'c1', 'u1', false, { supabase })
    expect(insert).toHaveBeenCalledWith({
      content_type: 'article',
      content_id: 'c1',
      user_id: 'u1'
    })
  })

  it('toggleLike deleta quando ja curtido', async () => {
    const del = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      }))
    }))
    const supabase = buildSupabase({ likes: { delete: del } })
    await toggleLike('article', 'c1', 'u1', true, { supabase })
    expect(del).toHaveBeenCalled()
  })

  it('fetchComments ordena por created_at asc', async () => {
    const order = vi.fn(() => ({ data: [{ id: 'c1' }], error: null }))
    const supabase = buildSupabase({
      comments: {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ order }))
          }))
        }))
      }
    })
    const result = await fetchComments('event', 'e1', { supabase })
    expect(result).toHaveLength(1)
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('addComment insere e retorna o comentario', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'c1', body: 'oi' }, error: null }))
      }))
    }))
    const supabase = buildSupabase({ comments: { insert } })
    const result = await addComment('event', 'e1', 'u1', 'oi', { supabase })
    expect(result.id).toBe('c1')
    expect(insert).toHaveBeenCalledWith({
      content_type: 'event',
      content_id: 'e1',
      user_id: 'u1',
      body: 'oi'
    })
  })

  it('toggleCommentHidden atualiza hidden', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
    const supabase = buildSupabase({ comments: { update } })
    await toggleCommentHidden('c1', true, { supabase })
    expect(update).toHaveBeenCalledWith({ hidden: true })
  })

  it('deleteComment deleta por id', async () => {
    const del = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
    const supabase = buildSupabase({ comments: { delete: del } })
    await deleteComment('c1', { supabase })
    expect(del).toHaveBeenCalled()
  })

  it('fetchModerationQueue busca na view', async () => {
    const order = vi.fn(() => ({ data: [{ id: 'c1' }], error: null }))
    const supabase = buildSupabase({
      v_comments_with_content: {
        select: vi.fn(() => ({ order }))
      }
    })
    const result = await fetchModerationQueue({ supabase })
    expect(result).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('v_comments_with_content')
  })
})
