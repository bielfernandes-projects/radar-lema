import { supabase as _supabase } from '../lib/supabase'

export async function fetchUnoClients({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('uno_clients')
    .select('id, uno_client_id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}
