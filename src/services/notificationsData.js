import { supabase as _supabase } from '../lib/supabase'

/** Notificacoes do proprio usuario (curtidas e respostas nos comentarios dele), mais novas primeiro. */
export async function fetchMyNotifications(limit = 30, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('v_my_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function markNotificationsRead({ supabase } = { supabase: _supabase }) {
  const { error } = await supabase.rpc('mark_notifications_read')
  if (error) throw error
}
