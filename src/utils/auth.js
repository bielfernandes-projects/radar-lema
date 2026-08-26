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

export function isUnoClient(profile) {
  return profile?.is_uno_client === true
}

// Super Admin tem acesso total ao app, inclusive a conteudo/telas
// marcados como exclusivos para Cliente Lema (ex: Dashboard UNO,
// materiais exclusivos). Usar esta funcao em todo gate de exclusividade
// em vez de checar isUnoClient sozinho.
export function canAccessLemaExclusive(profile) {
  return isUnoClient(profile) || isSuperAdmin(profile)
}
