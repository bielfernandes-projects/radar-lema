import { supabase as _supabase } from '../lib/supabase'

export async function fetchArticles({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, subtitle, author, cover_url, visibility, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchArticleById(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error('Artigo não encontrado.')
  return data
}

export async function saveArticle(payload, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('articles')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id, { supabase } = { supabase: _supabase }) {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}
