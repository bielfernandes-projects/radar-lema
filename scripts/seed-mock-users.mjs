// Script auxiliar para criar usuarios mockados no Supabase cloud.
// `supabase db reset` local aplica a migration 0012, mas no cloud o insert
// direto em auth.users pode nao ser suficiente para o GoTrue. Neste caso,
// rode este script apos `supabase db push`.
//
// Uso: node scripts/seed-mock-users.mjs
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

const adminClient = createClient(url, serviceKey)

const mocks = [
  {
    email: 'admin@lema.com',
    password: 'lema123',
    name: 'Admin Lema',
    user_type: 'super_admin',
    role: 'ROLE_SUPER_ADMIN'
  },
  {
    email: 'dirigente@lema.com',
    password: 'lema123',
    name: 'Dirigente RPPS',
    user_type: 'client',
    role: 'ROLE_VIEWER'
  }
]

async function main() {
  for (const mock of mocks) {
    const { data: list } = await adminClient.auth.admin.listUsers()
    const existing = list.users.find((u) => u.email === mock.email)
    if (existing) {
      await adminClient.auth.admin.deleteUser(existing.id)
      console.log(`Removido usuario existente: ${mock.email}`)
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: mock.email,
      password: mock.password,
      email_confirm: true,
      user_metadata: {
        name: mock.name,
        user_type: mock.user_type,
        role: mock.role
      }
    })

    if (error) {
      console.error(`Erro ao criar ${mock.email}:`, error)
      continue
    }

    console.log(`Criado ${mock.email}: ${data.user.id}`)

    // Reforca dados do profile (o trigger cria, mas garantimos user_type/role).
    await adminClient.from('profiles').delete().eq('id', data.user.id)
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: data.user.id,
      email: mock.email,
      name: mock.name,
      user_type: mock.user_type,
      role: mock.role
    })
    if (profileError) {
      console.error(`Erro ao inserir profile ${mock.email}:`, profileError)
    }
  }

  // Atualiza created_by dos eventos de exemplo para o admin criado.
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', 'admin@lema.com')
    .single()
  if (adminProfile) {
    const { error } = await adminClient
      .from('events')
      .update({ created_by: adminProfile.id })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error('Erro ao atualizar created_by:', error)
    } else {
      console.log('created_by dos eventos atualizado.')
    }
  }
}

main().catch(console.error)
