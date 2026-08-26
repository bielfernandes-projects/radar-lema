import { supabase as _supabase } from '../lib/supabase'

export async function fetchUnoUpdates({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('uno_updates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchUnoUpdateById(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('uno_updates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Novidade não encontrada.')
  return data
}

export async function saveUnoUpdate(payload, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase.from('uno_updates').upsert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteUnoUpdate(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase.from('uno_updates').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Exclusão não permitida para esta novidade.')
}
