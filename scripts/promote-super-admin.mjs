// Script para garantir que a conta principal seja super_admin/ROLE_SUPER_ADMIN
// no Supabase cloud (apoia a migration 20260807000000_super_admin_roles.sql).
//
// Uso: node scripts/promote-super-admin.mjs [email]
// Email default: gabrielfernandes@lemaef.com.br
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envText = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim()
  }
}

const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] || 'gabrielfernandes@lemaef.com.br'

// SEC-005: promocao de role via service_role so deve rodar contra o Supabase
// local. Para o cloud, use o Painel Admin (gestao de usuarios).
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  console.error(
    'ABORTADO: este script so pode rodar contra o Supabase local ' +
      '(VITE_SUPABASE_URL deve ser http://127.0.0.1:54321).'
  )
  process.exit(1)
}

const adminClient = createClient(url, serviceKey)

async function main() {
  const { data: list } = await adminClient.auth.admin.listUsers()
  const target = list.users.find((u) => u.email === email)

  if (!target) {
    console.error(`Usuario nao encontrado: ${email}`)
    process.exit(1)
  }

  await adminClient.auth.admin.updateUserById(target.id, {
    user_metadata: {
      name: target.user_metadata?.name || email,
      user_type: 'super_admin',
      role: 'ROLE_SUPER_ADMIN'
    }
  })

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ user_type: 'super_admin', role: 'ROLE_SUPER_ADMIN' })
    .eq('id', target.id)

  if (profileError) {
    console.error('Erro ao atualizar profile:', profileError)
    process.exit(1)
  }

  console.log(`${email} promovido para super_admin/ROLE_SUPER_ADMIN.`)
}

main().catch(console.error)
