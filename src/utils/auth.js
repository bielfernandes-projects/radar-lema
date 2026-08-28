import { supabase } from '../lib/supabase'

// NOTE: as Edge Functions têm o equivalente destes predicados em
// `supabase/functions/_shared/access.ts` (mesma semântica). Uma Edge Function
// não empacota `src/`, por isso a regra vive nos dois lugares — mudou aqui,
// muda lá.

export async function getUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || null
}

// Regra de senha forte usada no cadastro e na redefinição de senha. Retorna
// string de erro ou '' quando válida (mesmo estilo de src/utils/eventForm.js).
// O Supabase (config.toml [auth]) aplica a mesma regra no servidor.
export function validatePassword(pwd) {
  if (pwd.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (!/[a-z]/.test(pwd)) return 'A senha deve conter ao menos uma letra minúscula.'
  if (!/[A-Z]/.test(pwd)) return 'A senha deve conter ao menos uma letra maiúscula.'
  if (!/[0-9]/.test(pwd)) return 'A senha deve conter ao menos um número.'
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'A senha deve conter ao menos um símbolo.'
  return ''
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
