// Script auxiliar para importar os eventos da planilha "Lema Edu"
// (docs/input xlsx/Lema Edu .xlsx) no Supabase cloud.
//
// Regras:
// - Apenas insere eventos novos (NAO deleta nada).
// - Todos nascem como Lema Edu (is_lema_edu = true) e "A definir"
//   (is_confirmed = false) para o staff completar depois.
// - Categoria "Curso" para todos.
// - Cria uma sessao placeholder (09:00-18:00) na data mais confiavel
//   da planilha quando existir.
// - Idempotente: pula eventos que ja existem com o mesmo titulo e
//   is_lema_edu = true (pode rodar de novo sem duplicar).
//
// Uso: node scripts/seed-lema-edu-events.mjs
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

// SEC-005: este script escreve dados via service_role; so roda contra o
// Supabase local para nao poluir o projeto cloud.
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  console.error(
    'ABORTADO: este script so pode rodar contra o Supabase local ' +
      '(VITE_SUPABASE_URL deve ser http://127.0.0.1:54321).'
  )
  process.exit(1)
}

const adminClient = createClient(url, serviceKey)

// Cada evento: titulo, modalidade, cidade/UF, datas de referencia da planilha,
// status da turma e a data ISO usada na sessao placeholder (quando houver).
const EVENTS = [
  {
    title: 'CERTIFICAÇÃO GUARAMIRANGA',
    modality: 'presencial',
    city: 'Guaramiranga',
    state: 'CE',
    datasRef: '21 e 22/01',
    turma: 'Fechada',
    date: '2026-01-20'
  },
  {
    title: 'CERTIFICA RPPS ONLINE BÁSICO',
    modality: 'online',
    datasRef: '16,22 e 23',
    turma: 'Aberta',
    date: '2026-01-15'
  },
  {
    title: 'CURSO BNB - COLABORADORES',
    modality: 'presencial',
    city: 'Fortaleza',
    state: 'CE',
    datasRef: 'janeiro (sessões 27 e 28/01)',
    turma: 'Fechada',
    date: '2026-01-27'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO - EXCLUSIVO',
    modality: 'online',
    datasRef: '04, 10 E 11',
    turma: 'Fechada',
    date: '2026-02-03'
  },
  {
    title: 'CERTIFICAÇÃO GUARABIRA ASPREV PB',
    modality: 'presencial',
    city: 'Guarabira',
    state: 'PB',
    datasRef: '05 e 06/02',
    turma: 'Aberta',
    date: '2026-02-05'
  },
  {
    title: 'CERTIFICA RPPS - ONLINE',
    modality: 'online',
    datasRef: '20, 26 e 27/02',
    turma: 'Aberta',
    date: '2026-02-19'
  },
  {
    title: 'CERTIFICA RPPS ONLINE BÁSICO',
    modality: 'online',
    datasRef: '04, 10 e 11/03',
    turma: 'Aberta',
    date: '2026-03-03'
  },
  {
    title: '5.272 NA PRÁTICA - POLÍTICA DE INVESTIMENTOS E PRO-GESTÃO',
    modality: 'online',
    datasRef: '11 e 12/03/2026',
    turma: 'Fechada',
    date: '2026-03-10'
  },
  {
    title: 'IA PARA RPPS',
    modality: 'online',
    datasRef: '24 e 30/03',
    turma: 'Aberta',
    date: '2026-03-23'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO',
    modality: 'online',
    datasRef: '27, 30 e 31/3',
    turma: 'Aberta',
    date: '2026-03-26'
  },
  {
    title: 'APROVA RPPS',
    modality: 'online',
    datasRef: '19, 24, 26 e 01',
    turma: 'Aberta',
    date: '2026-03-17'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO - JOÃO RAMALHO - SP',
    modality: 'online',
    datasRef: '08, 14 e 15/04',
    turma: 'Fechada',
    date: '2026-04-07'
  },
  {
    title: 'CERTIFICA RPPS SÃO GONÇALO/RN - EXCLUSIVO',
    modality: 'presencial',
    city: 'São Gonçalo do Amarante',
    state: 'RN',
    datasRef: 'abril (início 16/04)',
    turma: 'Fechada',
    date: '2026-04-16'
  },
  {
    title: 'NOVA LICITAÇÃO - RIBEIRÃO PRETO',
    modality: 'presencial',
    city: 'Ribeirão Preto',
    state: 'SP',
    datasRef: '16 e 17/04',
    turma: 'Fechada',
    date: '2026-04-16'
  },
  {
    title: 'IA PARA RPPS',
    modality: 'online',
    datasRef: '22 e 24/4',
    turma: 'Aberta',
    date: '2026-04-20'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO - EXCLUSIVO',
    modality: 'online',
    datasRef: '23, 29 e 30/4',
    turma: 'Aberta',
    date: '2026-04-22'
  },
  {
    title: '5272 NA PRÁTICA CABEDELO - ASPREVPB',
    modality: 'presencial',
    city: 'João Pessoa',
    state: 'PB',
    datasRef: 'abril (início 24/04)',
    turma: 'Fechada',
    date: '2026-04-24'
  },
  {
    title: 'RPPS NA PRÁTICA',
    modality: 'presencial',
    city: 'Caruaru',
    state: 'PE',
    datasRef: 'abril (início 27/04)',
    turma: 'Fechada',
    date: '2026-04-27'
  },
  {
    title: '5272 NA PRÁTICA FORTALEZA',
    modality: 'presencial',
    city: 'Fortaleza',
    state: 'CE',
    datasRef: 'abril (início 24/04)',
    turma: 'Fechada',
    date: '2026-04-24'
  },
  {
    title: 'PDL - RIBEIRÃO PRETO',
    modality: 'presencial',
    city: 'Ribeirão Preto',
    state: 'SP',
    datasRef: '28 e 29/04',
    turma: 'Fechada',
    date: '2026-04-28'
  },
  {
    title: 'CAMAÇARI - Gestão Previdenciária + RCP + RPPS Invest',
    modality: 'presencial',
    city: 'Camaçari',
    state: 'BA',
    datasRef: '12 e 13/05',
    turma: 'Fechada',
    date: '2026-05-12'
  },
  {
    title: 'CERTIFICA RPPS ONLINE EXCLUSIVO',
    modality: 'online',
    datasRef: '12, 18 e 19/5',
    turma: null,
    date: '2026-05-11'
  },
  {
    title: 'CERTIFICA RPPS INTERMEDIÁRIO - BELÉM',
    modality: 'presencial',
    city: 'Belém',
    state: 'PA',
    datasRef: '20 e 21/05',
    turma: 'Aberta',
    date: '2026-05-20'
  },
  {
    title: 'CERTIFICA RPPS PETROLINA',
    modality: 'presencial',
    city: 'Petrolina',
    state: 'PE',
    datasRef: '12 e 13/05',
    turma: 'Fechada',
    date: '2026-05-12'
  },
  {
    title: 'RPPS INVEST RJ',
    modality: 'presencial',
    city: 'Rio de Janeiro',
    state: 'RJ',
    datasRef: '18 e 19/05',
    turma: 'Aberta',
    date: '2026-05-18'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO - EXCLUSIVO',
    modality: 'online',
    datasRef: '12,18 e 19',
    turma: 'Aberta',
    date: '2026-06-11'
  },
  {
    title: 'CERTIFICA RPPS ITAREMA',
    modality: 'presencial',
    city: 'Itarema',
    state: 'CE',
    datasRef: '30/06 e 01/07',
    turma: 'Fechada',
    date: '2026-06-30'
  },
  {
    title: 'CERTIFICA RPPS Coronel Fabriciano',
    modality: 'presencial',
    city: 'Coronel Fabriciano',
    state: 'MG',
    datasRef: '19, 24 e 25',
    turma: 'Fechada',
    date: '2026-06-18'
  },
  {
    title: 'APROVA RPPS GRAVADO',
    modality: 'presencial',
    city: 'Coronel Fabriciano + Itabira',
    state: 'MG',
    datasRef: 'junho (data a confirmar)',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'CERTIFICA RPPS - ARACAJU',
    modality: 'online',
    datasRef: 'junho (início 30/06)',
    turma: 'Fechada',
    date: '2026-06-30'
  },
  {
    title: 'RPPS INVEST MARAGOGI',
    modality: 'presencial',
    city: 'Maragogi',
    state: 'AL',
    datasRef: '02 e 03/07',
    turma: 'Aberta',
    date: '2026-07-02'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO - EXCLUSIVO',
    modality: 'online',
    datasRef: '08,14 e 15',
    turma: 'Aberta',
    date: '2026-07-07'
  },
  {
    title: 'CERT MACEIÓ - EX s/ AVANÇADO',
    modality: 'presencial',
    city: 'Maceió',
    state: 'AL',
    datasRef: 'junho (início 23/06)',
    turma: 'Fechada',
    date: '2026-06-23'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO',
    modality: 'online',
    datasRef: '17,23 E 24',
    turma: 'Aberta',
    date: '2026-07-16'
  },
  {
    title: 'Prestação de Contas/ Audiência Pública CEARÁ-MIRIM',
    modality: 'presencial',
    city: 'Ceará-Mirim',
    state: 'RN',
    datasRef: 'julho (início 22/07)',
    turma: 'Fechada',
    date: '2026-07-22'
  },
  {
    title: 'CERTIFICA RPPS - Dr. Severiano',
    modality: 'presencial',
    city: 'Dr. Severiano',
    state: 'RN',
    datasRef: '23 e 24/08',
    turma: 'Fechada',
    date: '2026-08-23'
  },
  {
    title: 'CERTIFICA RPPS ONLINE INTERMEDIÁRIO',
    modality: 'online',
    datasRef: '24, 30 e 31/7',
    turma: 'Aberta',
    date: '2026-07-23'
  },
  {
    title: 'CERTIFICA RPPS - Camaçari - BA - online',
    modality: 'online',
    datasRef: '13 e 14 ago',
    turma: 'Fechada',
    date: '2026-08-13'
  },
  {
    title: 'CERTIFICA RPPS AÇAILANDIA/MA',
    modality: 'presencial',
    city: 'Açailândia',
    state: 'MA',
    datasRef: '06 e 07/08',
    turma: 'Fechada',
    date: '2026-08-06'
  },
  {
    title: 'CERTIFICA RPPS - MARACAJU/MS',
    modality: 'online',
    datasRef: 'DATA A DEFINIR',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'CERTIFICA RPPS - BENTO GONÇALVES',
    modality: 'presencial',
    city: 'Bento Gonçalves',
    state: 'RS',
    datasRef: 'DATA A DEFINIR',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'RPPS INVEST NATAL',
    modality: 'presencial',
    city: 'Natal',
    state: 'RN',
    datasRef: 'agosto (fim 07/08)',
    turma: 'Fechada',
    date: '2026-08-07'
  },
  {
    title: 'IA PARA RPPS',
    modality: 'online',
    datasRef: '10 e 12/08',
    turma: 'Fechada',
    date: '2026-08-10'
  },
  {
    title: 'Prestação de Contas/ Audiência Pública Eusébio',
    modality: 'presencial',
    city: 'Eusébio',
    state: 'CE',
    datasRef: 'DATA A DEFINIR',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'CERTIFICA RPPS SÃO GABRIEL DA PALHA - ES',
    modality: 'presencial',
    city: 'São Gabriel da Palha',
    state: 'ES',
    datasRef: '20 e 21/08',
    turma: 'Aberta',
    date: '2026-08-20'
  },
  {
    title: 'RPPS INVEST FEIRA DE SANTANA',
    modality: 'presencial',
    city: 'Feira de Santana',
    state: 'BA',
    datasRef: '20 e 21/08',
    turma: 'Aberta',
    date: '2026-08-20'
  },
  {
    title: 'RPPS INVEST MOC',
    modality: 'presencial',
    city: 'Montes Claros',
    state: 'MG',
    datasRef: 'agosto (data a confirmar)',
    turma: 'Aberta',
    date: null
  },
  {
    title: 'CERTIFICA RPPS - JURU - PE',
    modality: 'presencial',
    city: 'Juru',
    state: 'PE',
    datasRef: 'DATA A DEFINIR',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'CONSELHO ATIVO - Jardim do Seridó - RN',
    modality: 'online',
    datasRef: 'DATA A DEFINIR',
    turma: 'Fechada',
    date: null
  },
  {
    title: 'IMERSÃO EM COMPLIANCE',
    modality: 'online',
    datasRef: '05, 06 e 07/08',
    turma: null,
    date: '2026-08-05'
  },
  {
    title: 'Certifica RPPS - Itapipoca - CE',
    modality: 'presencial',
    city: 'Itapipoca',
    state: 'CE',
    datasRef: '12 e 13/08',
    turma: 'Aberta',
    date: '2026-08-12'
  }
]

function buildDescription(event) {
  const parts = ['Evento Lema Edu importado da planilha "Lema Edu".']
  if (event.datasRef) parts.push(`Datas na planilha: ${event.datasRef}.`)
  if (event.turma) parts.push(`Turma: ${event.turma}.`)
  if (event.city) parts.push(`Local: ${event.city}${event.state ? `/${event.state}` : ''}.`)
  parts.push('Detalhes, programação e inscrição a definir.')
  return parts.join(' ')
}

async function main() {
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', 'admin@lema.com')
    .single()

  let createdBy = adminProfile?.id

  if (!createdBy) {
    const { data: superAdmins } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_type', 'super_admin')
      .limit(1)
    createdBy = superAdmins?.[0]?.id
  }

  if (!createdBy) {
    console.error('Não encontrei nenhum perfil admin/super_admin para usar como created_by.')
    process.exit(1)
  }
  console.log(`created_by: ${createdBy}`)

  const { data: cursoCategory } = await adminClient
    .from('categories')
    .select('id')
    .eq('name', 'Curso')
    .single()
  if (!cursoCategory) {
    console.error('Não encontrei a categoria "Curso".')
    process.exit(1)
  }
  const cursoId = cursoCategory.id

  // Chave de dedup: titulo + data da primeira sessao placeholder. Turmas do
  // mesmo curso (mesmo titulo) tem datas diferentes e devem ser mantidas.
  const { data: existing } = await adminClient
    .from('events')
    .select('title, event_sessions(start_date)')
    .eq('is_lema_edu', true)
  const existingKeys = new Set(
    (existing || []).map(
      (e) => `${e.title}::${e.event_sessions?.[0]?.start_date || ''}`
    )
  )
  const eventKey = (event) =>
    `${event.title.trim()}::${event.date || ''}`

  let inserted = 0
  let skipped = 0
  const errors = []

  for (const event of EVENTS) {
    const title = event.title.trim()
    if (existingKeys.has(eventKey(event))) {
      console.log(`Já existe, pulando: ${title}${event.date ? ` (${event.date})` : ' (sem data)'}`)
      skipped++
      continue
    }

    const { data: newEvent, error: insertError } = await adminClient
      .from('events')
      .insert({
        title,
        description: buildDescription(event),
        modality: event.modality,
        is_free: true,
        price_from: null,
        city: event.modality === 'online' ? null : event.city || null,
        state: event.modality === 'online' ? null : event.state || null,
        address: null,
        url: null,
        is_recurring: false,
        recurrence_freq: null,
        recurrence_until: null,
        created_by: createdBy,
        is_lema_edu: true,
        is_confirmed: false
      })
      .select('id')
      .single()

    if (insertError) {
      errors.push(`Erro ao inserir "${title}": ${insertError.message}`)
      continue
    }

    const eventId = newEvent.id

    const { error: catError } = await adminClient
      .from('event_categories')
      .insert({ event_id: eventId, category_id: cursoId })
    if (catError) {
      errors.push(`Erro na categoria de "${title}": ${catError.message}`)
    }

    if (event.date) {
      const { error: sessionError } = await adminClient
        .from('event_sessions')
        .insert({
          event_id: eventId,
          start_date: event.date,
          start_time: '09:00',
          end_date: event.date,
          end_time: '18:00',
          recurrence_instance: false
        })
      if (sessionError) {
        errors.push(`Erro na sessão de "${title}": ${sessionError.message}`)
      }
    }

    existingKeys.add(eventKey(event))
    inserted++
    console.log(`Inserido: ${title}${event.date ? ` (${event.date})` : ' (sem data)'}`)
  }

  console.log('---')
  console.log(`Total: ${inserted} inseridos, ${skipped} pulados, ${errors.length} erros.`)
  if (errors.length > 0) {
    console.log('Erros:')
    for (const err of errors) console.log(`  - ${err}`)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('Falha no script:', err)
  process.exit(1)
})
