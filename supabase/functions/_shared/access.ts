/**
 * Predicados de acesso do Radar — fonte única para as Edge Functions.
 *
 * O frontend tem o equivalente em `src/utils/auth.js` (mesma semântica); esta
 * cópia existe porque uma Edge Function só empacota o próprio diretório +
 * `_shared/`, não `src/`. Qualquer mudança de regra tem que bater nos dois.
 *
 * `resolveUnoClientId` é a regra crítica de isolamento entre RPPS: um cliente
 * comum sempre consulta o próprio vínculo (ignora qualquer `client_id` que o
 * front mande); só o Super Admin pode escolher outro.
 */

export interface AccessProfile {
  is_uno_client?: boolean | null
  user_type?: string | null
  role?: string | null
  uno_client_id?: string | null
}

export function isSuperAdminProfile(profile: AccessProfile | null | undefined): boolean {
  return profile?.user_type === "super_admin" || profile?.role === "ROLE_SUPER_ADMIN"
}

// Super Admin sempre passa, mesmo sem a flag de cliente.
export function canAccessLemaExclusive(profile: AccessProfile | null | undefined): boolean {
  return Boolean(profile?.is_uno_client) || isSuperAdminProfile(profile)
}

export function resolveUnoClientId(opts: {
  isSuperAdmin: boolean
  requestedClientId: string | null
  ownClientId: string | null | undefined
  fallback: string
}): string {
  const { isSuperAdmin, requestedClientId, ownClientId, fallback } = opts
  if (isSuperAdmin) return requestedClientId || ownClientId || fallback
  // Cliente comum: NUNCA honra o client_id da requisição.
  return ownClientId || fallback
}
