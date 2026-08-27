import { supabase } from '../lib/supabase'

// NOTE: as Edge Functions têm o equivalente destes predicados em
// `supabase/functions/_shared/access.ts` (mesma semântica). Uma Edge Function
// não empacota `src/`, por isso a regra vive nos dois lugares — mudou aqui,
// muda lá.

export async function getUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}

export function isSuperAdmin(profile) {
  return (
    profile?.user_type === 'super_admin' ||
    profile?.role === 'ROLE_SUPER_ADMIN'
  )
}

// Super Admin sempre tem acesso total ao app — inclusive as telas de Gestão
// (staff). Antes, um Super Admin identificado só pela role legada
// (`ROLE_SUPER_ADMIN`, sem `user_type`) caía fora de isStaffTier e perdia a
// seção de Gestão na Sidebar.
export function isStaffTier(profile) {
  return profile?.user_type === 'staff' || isSuperAdmin(profile)
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
