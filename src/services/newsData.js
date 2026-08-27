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

// Lista enxuta usada na Gestão do hub (sem limite: o staff quer ver tudo que
// pode excluir). As notícias são curadas — voltam na próxima ingestão se ainda
// estiverem no feed.
export async function fetchNewsAdmin({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, source, published_at')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteNews(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase.from('news').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Exclusão não permitida para esta notícia.')
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
