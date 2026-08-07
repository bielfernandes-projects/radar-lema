import { supabase } from '../lib/supabase'

const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`

async function callAdminFunction(action, payload) {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const res = await fetch(ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`
    },
    body: JSON.stringify({ action, ...payload })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || 'Erro ao executar a operação.')
  }

  return res.json()
}

export const adminApi = {
  create: (payload) => callAdminFunction('create', payload),
  update: (payload) => callAdminFunction('update', payload),
  resetPassword: (payload) => callAdminFunction('reset_password', payload),
  remove: (payload) => callAdminFunction('delete', payload)
}

export const USER_TYPES = [
  { value: 'client', label: 'Cliente (visualiza eventos)' },
  { value: 'staff', label: 'Staff (gerencia eventos)' },
  { value: 'super_admin', label: 'Super Admin (painel + usuários)' }
]

export const ROLE_BY_USER_TYPE = {
  client: 'ROLE_VIEWER',
  staff: 'ROLE_ADMIN',
  super_admin: 'ROLE_SUPER_ADMIN'
}

export const ROLE_LABELS = {
  ROLE_VIEWER: 'ROLE_VIEWER',
  ROLE_ADMIN: 'ROLE_ADMIN',
  ROLE_SUPER_ADMIN: 'ROLE_SUPER_ADMIN'
}
