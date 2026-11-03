import { describe, expect, it, vi } from 'vitest'
import { groupComments } from '../src/utils/comments'
import { contentPath } from '../src/utils/hub'
import { addComment, fetchCommentLikes, toggleCommentLike } from '../src/services/interactionsData'
import { fetchMyNotifications, markNotificationsRead } from '../src/services/notificationsData'
import { buildInteractionPush, groupByUser, contentPath as serverContentPath } from '../supabase/functions/_shared/interactionPush.ts'

describe('groupComments', () => {
  it('respostas ficam sob o comentario raiz, em ordem', () => {
    const list = [
      { id: 'a', parent_id: null },
      { id: 'b', parent_id: 'a' },
      { id: 'c', parent_id: null },
      { id: 'd', parent_id: 'a' }
    ]
    const grouped = groupComments(list)
    expect(grouped.map((c) => c.id)).toEqual(['a', 'c'])
    expect(grouped[0].replies.map((r) => r.id)).toEqual(['b', 'd'])
    expect(grouped[1].replies).toEqual([])
  })

  it('resposta cujo comentario raiz nao esta na lista (oculto) vira raiz, nao some', () => {
    expect(groupComments([{ id: 'b', parent_id: 'sumiu' }]).map((c) => c.id)).toEqual(['b'])
  })
})

describe('contentPath', () => {
  it('leva ao detalhe do conteudo; tipo desconhecido cai em /', () => {
    expect(contentPath('article', 'x')).toBe('/artigo/x')
    expect(contentPath('event', 'x')).toBe('/evento/x')
    expect(contentPath('news', 'x')).toBe('/noticia/x')
    expect(contentPath('uno_update', 'x')).toBe('/novidade/x')
    expect(contentPath('outro', 'x')).toBe('/')
    expect(serverContentPath('article', 'x')).toBe(contentPath('article', 'x'))
  })
})

describe('interactionsData: respostas e curtidas em comentarios', () => {
  it('addComment envia parent_id so quando e resposta', async () => {
    const insert = vi.fn(() => ({ select: () => ({ single: () => ({ data: { id: 'n' }, error: null }) }) }))
    const supabase = { from: () => ({ insert }) }
    await addComment('article', 'a1', 'u1', 'oi', { supabase })
    expect(insert).toHaveBeenLastCalledWith({ content_type: 'article', content_id: 'a1', user_id: 'u1', body: 'oi' })
    await addComment('article', 'a1', 'u1', 'oi', { supabase, parentId: 'c9' })
    expect(insert).toHaveBeenLastCalledWith({ content_type: 'article', content_id: 'a1', user_id: 'u1', body: 'oi', parent_id: 'c9' })
  })

  it('fetchCommentLikes conta por comentario e marca os do proprio usuario', async () => {
    const rows = [
      { comment_id: 'c1', user_id: 'me' },
      { comment_id: 'c1', user_id: 'x' },
      { comment_id: 'c2', user_id: 'x' }
    ]
    const supabase = { from: () => ({ select: () => ({ in: () => ({ data: rows, error: null }) }) }) }
    const map = await fetchCommentLikes(['c1', 'c2', 'c3'], 'me', { supabase })
    expect(map.get('c1')).toEqual({ count: 2, liked: true })
    expect(map.get('c2')).toEqual({ count: 1, liked: false })
    expect(map.get('c3')).toEqual({ count: 0, liked: false })
  })

  it('toggleCommentLike insere ao curtir e apaga ao descurtir', async () => {
    const insert = vi.fn(() => ({ error: null }))
    const eq2 = vi.fn(() => ({ error: null }))
    const del = vi.fn(() => ({ eq: () => ({ eq: eq2 }) }))
    const supabase = { from: () => ({ insert, delete: del }) }
    await toggleCommentLike('c1', 'u1', false, { supabase })
    expect(insert).toHaveBeenCalledWith({ comment_id: 'c1', user_id: 'u1' })
    await toggleCommentLike('c1', 'u1', true, { supabase })
    expect(del).toHaveBeenCalled()
  })
})

describe('notificationsData', () => {
  it('lista da view do usuario, mais novas primeiro, e marca como lidas pelo RPC', async () => {
    const limit = vi.fn(() => ({ data: [{ id: 'n1' }], error: null }))
    const order = vi.fn(() => ({ limit }))
    const supabase = { from: vi.fn(() => ({ select: () => ({ order }) })), rpc: vi.fn(() => ({ error: null })) }
    expect(await fetchMyNotifications(30, { supabase })).toEqual([{ id: 'n1' }])
    expect(supabase.from).toHaveBeenCalledWith('v_my_notifications')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    await markNotificationsRead({ supabase })
    expect(supabase.rpc).toHaveBeenCalledWith('mark_notifications_read')
  })
})

describe('push de interacoes (supabase/functions/_shared/interactionPush)', () => {
  const like = { id: '1', user_id: 'u', kind: 'comment_like', actor_name: 'Ana', content_type: 'article', content_id: 'a1', snippet: 'ótimo texto' }
  const reply = { ...like, id: '2', kind: 'comment_reply', actor_name: 'Beto', snippet: 'concordo' }

  it('uma interacao: aviso especifico com link para o conteudo', () => {
    expect(buildInteractionPush([like])).toEqual({ title: 'Ana curtiu seu comentário', body: 'ótimo texto', url: '/artigo/a1' })
    expect(buildInteractionPush([reply]).title).toBe('Beto respondeu ao seu comentário')
  })

  it('varias interacoes viram um resumo unico', () => {
    const push = buildInteractionPush([like, reply])
    expect(push.body).toBe('Você tem 2 novas interações nos seus comentários.')
    expect(push.url).toBe('/')
  })

  it('agrupa por usuario destinatario', () => {
    const grouped = groupByUser([like, { ...reply, user_id: 'v' }, { ...like, id: '3' }])
    expect(grouped.get('u')).toHaveLength(2)
    expect(grouped.get('v')).toHaveLength(1)
  })
})
