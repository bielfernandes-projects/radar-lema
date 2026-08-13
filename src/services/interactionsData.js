import { supabase as _supabase } from '../lib/supabase'

export async function fetchLikeStatus(contentType, contentId, userId, { supabase } = { supabase: _supabase }) {
  const { count: total, error: countError } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('content_type', contentType)
    .eq('content_id', contentId)
  if (countError) throw countError

  let liked = false
  if (userId) {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    liked = Boolean(data)
  }

  return { liked, count: total ?? 0 }
}

export async function toggleLike(contentType, contentId, userId, currentlyLiked, { supabase } = { supabase: _supabase }) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ content_type: contentType, content_id: contentId, user_id: userId })
    if (error) throw error
  }
}

export async function fetchComments(contentType, contentId, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(name)')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addComment(contentType, contentId, userId, body, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ content_type: contentType, content_id: contentId, user_id: userId, body })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(id, { supabase } = { supabase: _supabase }) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

export async function toggleCommentHidden(id, hidden, { supabase } = { supabase: _supabase }) {
  const { error } = await supabase.from('comments').update({ hidden }).eq('id', id)
  if (error) throw error
}

export async function fetchModerationQueue({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('v_comments_with_content')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
