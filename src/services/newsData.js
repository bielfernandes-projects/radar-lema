import { supabase as _supabase } from '../lib/supabase'

export async function fetchNews({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export async function fetchNewsById(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Notícia não encontrada.')
  return data
}
