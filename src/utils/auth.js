import { supabase } from '../lib/supabase'

export async function getUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}

export function isStaffTier(profile) {
  return profile?.user_type === 'staff' || profile?.user_type === 'super_admin'
}

export function isSuperAdmin(profile) {
  return (
    profile?.user_type === 'super_admin' ||
    profile?.role === 'ROLE_SUPER_ADMIN'
  )
}
