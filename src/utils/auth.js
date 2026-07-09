import { supabase } from '../lib/supabase'

export async function getUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}
