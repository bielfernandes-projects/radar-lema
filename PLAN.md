# Plano de Implementação — Radar Lema

> **Status:** Eventos implementados; **hub da Lema em andamento** (branch
> `feat/lema-hub`)  
> **Data:** 2026-07-08 (original) · 2026-08-13 (hub)  
> **Autor:** Gabriel (PO) + opencode

---

## Hub da Lema (em andamento — branch `feat/lema-hub`)

> Nada do hub vai para produção até a conclusão. O trabalho vive na branch
> `feat/lema-hub`; a `main` permanece como está no deploy da Vercel. Os
> testes são feitos localmente.

O Radar Lema está sendo expandido de centralizador de eventos para um **hub
da Lema**: eventos, artigos, notícias de mercado, novidades UNO, materiais de
apoio, curtidas/comentários e o Dashboard UNO. Nome e identidade visual
ficam para depois.

### Decisões do grill (2026-08-13)

| # | Tema | Decisão |
|---|---|---|
| Q1 | Acesso | **Conta grátis obrigatória** — sem navegação anônima; todo conteúdo após login |
| Q2 | Cliente Lema | Flag `is_uno_client` em `profiles`, alternada pelo super admin no Painel Admin |
| Q3 | Visibilidade | Campo `visibility` (`public`/`lema_client`) em Artigos e Materiais; mantém `is_confirmed` p/ Eventos |
| Q4 | Artigos | Agregado próprio, staff publica manualmente; `source_url` opcional p/ LinkedIn |
| Q5 | Notícias | Ingestão agendada (Edge + cron) → tabela `news`; API = NewsAPI |
| Q6 | Novidades UNO | Agregado próprio `uno_updates`, escrito pelo staff |
| Q7 | Materiais | Upload no app: bucket `materials` + tabela `materials` |
| Q8/Q9 | Dashboard UNO | Edge Function proxy → `unoapp.com.br`, perfil demo `client_id=192`, token JWT em secret |
| Q10 | Moderação | Pós-publicação + fila de moderação p/ staff |
| Q11 | Interações | Curtidas/comentários em Artigos, Eventos, Notícias, Novidades UNO; **Materiais sem** |
| Q12 | Arquitetura | Home = feed agregado; cada tipo com seção própria |
| Q13 | Push | Novidades UNO (todos) + Artigos exclusivos (Clientes Lema); não p/ notícias de mercado nem materiais |

### Fases do hub

| # | Fase | Conteúdo |
|---|---|---|
| 1 | Fundação | `profiles.is_uno_client` + helper `is_uno_client()` + RLS; switch "Cliente Lema" no Painel Admin; glossário + ADRs |
| 2 | Vitrine | Tabelas `news` e `uno_updates`; Edge `news-ingest` (NewsAPI + cron); páginas Notícias e Novidades UNO; home feed agregado; rework da navbar/rotas |
| 3 | Diferenciais 1 e 2 | Tabelas `articles` e `materials` (+ bucket); formulário staff (editor Markdown + upload); listagens públicas e restritas; badges "Exclusivo Lema" |
| 4 | Social | Tabelas `likes` e `comments` polimórficas (`content_type` + `content_id`); componente de interação; página/aba Moderação p/ staff |
| 5 | Push novo | Estender `send-push`/outbox: novidades UNO (todos com push) e artigos `lema_client` (só Clientes Lema) |
| 6 | Trunfo | Edge `uno-proxy` (token JWT em secret); página Dashboard UNO (perfil demo 192); acesso via `is_uno_client` |
| 7 | Rebrand | Nome + identidade visual + domínio (adiado) |

### Integração com o ecossistema Lema (futuro)

Quando o hub estiver pronto e sem pontas soltas: migração para AWS (S2),
vínculo com o banco do UNO (o `is_uno_client` passa a ser derivado do e-mail
da conta UNO), domínio próprio (`lemahub.lemaef.com.br`). Sempre via
integração, nunca refazendo o que já existe.

### API do UNO (mapeada do `api_uno.yml`)

- Base: `https://unoapp.com.br/server/api/v1/outer_api/`
- Auth: header `x-access-token` com JWT fixo (payload `{id:"userToOuterAPI"}`)
- Endpoints p/ o dashboard (todos com `client_id` + datas):
  `demonstrativoFundosCliente`, `fundosCliente`, `movimentacoesCliente`,
  `titulosAnalise`, `enquadramentosCliente`, `metaClientePorAno`,
  `disponibilidadesCliente`
- Perfil de demonstração: `client_id=192` ("DEMONSTRAÇÃO - LEMA")
- ⚠️ O `api_uno.yml` contém secrets (JWT, `x-api-key`, credenciais
  comdinheiro) — rotacionar e manter fora do git (ver `.gitignore`)

---

## Plano original (eventos) — implementado

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 18 + Material UI v7 |
| Roteamento | react-router-dom v6 |
| Tipografia | Manrope (fonte única) |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| Supabase IaC | `supabase` CLI (migrations + seed, zero Dashboard) |
| PWA | `vite-plugin-pwa` + Workbox (manifest + service worker) |
| Lint | ESLint (`eslint:recommended` + `react` + `react-hooks`) |
| Format | Prettier |
| Testes | Vitest + Testing Library (smoke tests) |
| Deploy | Local (dev) + Vercel (demo) |

---

## Estrutura de pastas (frontend)

```
radar-lema/
├── CONTEXT.md
├── PLAN.md
├── architecture.md               ← documento vivo, atualizado toda fase
├── docs/
│   └── adr/
│       ├── 0001-app-standalone-vs-modulo-uno.md
│       ├── 0002-supabase-como-backend-do-prototipo.md
│       └── 0003-auth-supabase-mockada-vs-banco-uno.md
├── supabase/
│   ├── migrations/
│   │   ├── 0001_profiles.sql
│   │   ├── 0002_categories.sql
│   │   ├── 0003_events.sql
│   │   ├── 0004_event_sessions.sql
│   │   ├── 0005_event_photos.sql
│   │   ├── 0006_favorites.sql
│   │   ├── 0007_rls_policies.sql
│   │   ├── 0008_indexes.sql
│   │   ├── 0009_view_past_events.sql
│   │   ├── 0010_storage_bucket.sql
│   │   ├── 0011_seed_categories.sql
│   │   ├── 0012_seed_mock_users.sql
│   │   └── 0013_seed_sample_events.sql
│   └── seed.sql                  ← orquestra seeds (chama inserts)
├── public/
│   ├── manifest.json             ← gerado via vite-plugin-pwa
│   └── icons/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── theme/
│   │   └── theme.js              ← cores/tipografia alinhadas ao UNO
│   ├── lib/
│   │   └── supabase.js            ← client do Supabase
│   ├── contexts/
│   │   └── AuthContext.jsx       ← estado de auth + role
│   ├── components/
│   │   ├── EventCard.jsx
│   │   ├── EventFilters.jsx
│   │   ├── EventForm.jsx         ← criar/editar
│   │   ├── SessionEditor.jsx     ← datas/horários
│   │   ├── RecurrenceEditor.jsx
│   │   ├── PhotoUploader.jsx
│   │   ├── CategoryManager.jsx
│   │   ├── MapEmbed.jsx
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Navbar.jsx         ← navegação desktop + Drawer mobile
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── EventList.jsx         ← listagem principal
│   │   ├── EventDetail.jsx
│   │   ├── Favorites.jsx
│   │   ├── PastEvents.jsx        ← Realizados
│   │   ├── ManageEvents.jsx      ← staff: listar + editar
│   │   ├── EventFormPage.jsx     ← staff: criar/editar evento
│   │   └── Categories.jsx        ← staff: gestão de categorias
│   └── utils/
│       ├── formatters.js         ← data, moeda (pt-BR)
│       └── recurrence.js         ← geração de sessões
├── tests/
│   ├── AuthContext.test.jsx
│   └── recurrence.test.js
├── .env.local                     ← credenciais Supabase (não commitar)
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

---

## Schema do banco (Supabase / PostgreSQL)

### Tabela `profiles`
Espelha o usuário autenticado do Supabase Auth com metadados.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | = `auth.users.id` |
| `email` | TEXT | email do usuário |
| `name` | TEXT | nome de exibição |
| `user_type` | TEXT | `'super_admin'`, `'staff'` ou `'client'` |
| `role` | TEXT | role do UNO: `'ROLE_SUPER_ADMIN'`, `'ROLE_ADMIN'` ou `'ROLE_VIEWER'` |

**CHECK constraints:**
- `user_type IN ('super_admin', 'staff', 'client')`
- `role IN ('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_VIEWER')`

> Futuro (migração UNO): expandir `role` para as 8 roles (BACKOFFICE,
> COMERCIAL, CONSULTOR_TECNICO, COMITE, CONSELHO, ADMIN).

### Tabela `categories`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE NOT NULL | ex: "Workshop", "Comitê" |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |

### Tabela `events`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | |
| `title` | TEXT NOT NULL | |
| `description` | TEXT NOT NULL | |
| `modality` | TEXT NOT NULL | `'presencial'`, `'online'`, `'hibrido'` |
| `is_free` | BOOLEAN DEFAULT true | toggle gratuito |
| `price_from` | NUMERIC(10,2) | NULL se gratuito; "a partir de" |
| `city` | TEXT | NULL se online |
| `state` | TEXT(2) | NULL se online |
| `address` | TEXT | endereço completo para mapa |
| `url` | TEXT | link externo de inscrição |
| `is_recurring` | BOOLEAN DEFAULT false | |
| `recurrence_freq` | TEXT | `'semanal'`, `'quinzenal'`, `'mensal'` (NULL se não recorrente) |
| `recurrence_until` | DATE | data fim obrigatória se recorrente |
| `created_by` | UUID FK → profiles | quem criou |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | |

**CHECK constraints:**
- `modality IN ('presencial', 'online', 'hibrido')`
- `recurrence_freq IN ('semanal', 'quinzenal', 'mensal')`
- `is_recurring = true` ⇒ `recurrence_freq IS NOT NULL AND recurrence_until IS NOT NULL`
- `is_free = true` ⇒ `price_from IS NULL`

### Tabela `event_categories`

Relacionamento muitos-para-muitos entre eventos e categorias (um evento
pode pertencer a várias categorias; não há categoria principal).

| Coluna | Tipo | Descrição |
|---|---|---|
| `event_id` | UUID FK → events | ON DELETE CASCADE |
| `category_id` | UUID FK → categories | ON DELETE CASCADE |
| | PRIMARY KEY(event_id, category_id) | |

### Tabela `event_sessions`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | |
| `start_date` | DATE NOT NULL | |
| `start_time` | TIME NOT NULL | |
| `end_date` | DATE NOT NULL | (mesmo dia ou dia seguinte) |
| `end_time` | TIME NOT NULL | |
| `recurrence_instance` | BOOLEAN DEFAULT false | true se gerada por recorrência |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |

### Tabela `event_photos`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | |
| `storage_path` | TEXT | path no Supabase Storage |
| `public_url` | TEXT | URL **pública estática** (bucket público) |
| `order` | INTEGER | ordem (0 = capa) |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |

> Bucket `event-photos` é público para leitura → URL estática no formato
> `https://<project>.supabase.co/storage/v1/object/public/event-photos/...`.
> **Não** usar signed URLs (expiram e quebram os cards).

### Tabela `favorites`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `event_id` | UUID FK → events | |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |
| | UNIQUE(user_id, event_id) | |

### Relacionamentos

```
events 1───∞ event_sessions
events 1───∞ event_photos
events 1───∞ favorites
events ∞───∞ categories   (via event_categories)
profiles 1───∞ events (created_by)
profiles 1───∞ favorites
```

### Storage

Bucket: `event-photos` (público para leitura, autenticado para escrita).
Criado via migration SQL (`INSERT INTO storage.buckets`), **não via Dashboard**.
Estrutura: `events/{event_id}/{uuid}.{ext}`
URL pública: `https://<project>.supabase.co/storage/v1/object/public/event-photos/events/{event_id}/{uuid}.{ext}`

### View `v_past_events`

Evento é "Realizado" quando todas as sessões já terminaram — ou quando não
possui nenhuma sessão. A comparação usa o **timestamp completo** de fim
(`end_date + end_time`) no fuso `America/Sao_Paulo`, não apenas a data.

```sql
DROP VIEW IF EXISTS public.v_past_events CASCADE;
CREATE VIEW public.v_past_events AS
SELECT e.*
FROM public.events e
LEFT JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING MAX((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo') < now()
    OR COUNT(s.id) = 0;
```

### View `v_ongoing_events`

Evento "Em andamento": ao menos uma sessão passada E ao menos uma futura.

```sql
DROP VIEW IF EXISTS public.v_ongoing_events CASCADE;
CREATE VIEW public.v_ongoing_events AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' < now())
   AND BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' >= now());
```

### Índices

```sql
CREATE INDEX idx_events_created_at      ON events(created_at DESC);
CREATE INDEX idx_event_categories_category ON event_categories(category_id);
CREATE INDEX idx_sessions_event         ON event_sessions(event_id);
CREATE INDEX idx_sessions_event_date    ON event_sessions(event_id, start_date);
CREATE INDEX idx_photos_event           ON event_photos(event_id);
CREATE INDEX idx_favorites_user         ON favorites(user_id);
-- UNIQUE(user_id, event_id) já cria índice em (user_id, event_id)
```

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Políticas:

**`profiles`**
- SELECT: `id = auth.uid()` OU super admin (`ROLE_SUPER_ADMIN` lê todos).
- INSERT/UPDATE/DELETE: bloqueado via SQL (perfil criado só pelo trigger de Auth).

**`categories`**
- SELECT: público (anon + authenticated).
- INSERT/UPDATE/DELETE: tier staff (`is_staff()` = `user_type IN ('staff','super_admin')`).

**`event_categories`**
- SELECT: público (anon + authenticated).
- INSERT/UPDATE/DELETE: tier staff (`is_staff()`).

**`events`**
- SELECT: público, exceto não confirmados (`is_confirmed = false`) que só o
  tier staff lê.
- INSERT/UPDATE/DELETE: tier staff (`is_staff()`).

**`event_sessions`**, **`event_photos`**
- SELECT: público.
- INSERT/UPDATE/DELETE: tier staff (`is_staff()`, via subquery em `profiles`).

**`favorites`**
- SELECT/INSERT/UPDATE/DELETE: `user_id = auth.uid()`.

**Storage bucket `event-photos`**
- Leitura: pública.
- Escrita: só autenticado (upload via Supabase SDK com JWT do usuário logado).

---

## Auth

### Protótipo (mockado no Supabase)

- Dois usuários criados via **SQL insert em `auth.users`** (não via Dashboard):
  - `admin@lema.com` → `user_type = 'super_admin'`, `role = 'ROLE_SUPER_ADMIN'`
  - `dirigente@lema.com` → `user_type = 'client'`, `role = 'ROLE_VIEWER'`
- Senha: hash bcrypt pré-gerado (executor gera hash local com Node e insere
  em `auth.users.encrypted_password`). Senha dos mocks: definir no prompt da
  Fase 1 (ex: `lema123`), nunca commitar o hash em texto no repo além do
  `seed.sql`.
- Trigger `on_auth_user_created` cria linha em `profiles` automaticamente ao
  registrar usuário. Para mocks via SQL insert, o trigger dispara; se não
  disparar, executor insere manualmente em `profiles` no mesmo seed.
- Frontend lê `user_type` (e `role`) para mostrar/ocultar abas de staff.
- JWT do Supabase Auth usado para todas as requisições.

### Futuro (migração para banco do UNO)

- Edge Function recebe email + senha.
- Conecta ao PostgreSQL do UNO, valida `users.email` + `users.password` (bcrypt).
- Checa `plan_id` (Básico, Intermediário, Plus) e `role`.
- Emite JWT próprio do Radar com `user_id`, `role`, `consulting_id`.

---

## Supabase CLI (obrigatório — zero Dashboard)

Toda manipulação do Supabase via `supabase` CLI. Nada é feito via Dashboard web.

**Setup inicial (uma vez):**
```bash
supabase login          # usa SUPABASE_ACCESS_TOKEN (já no .env.local)
supabase link --project-ref vrvyfgneawtceebyagak
```

**Fluxo de migrations:**
```bash
supabase migration new <nome>      # cria supabase/migrations/NNNN_<nome>.sql
# editar o arquivo SQL
supabase migration up              # aplica migrations pendentes
supabase migration list            # ver status
```

**Seed + reset (reaplica migrations + seed do zero):**
```bash
supabase db reset                  # drop + recria schema + roda seed.sql
```

**Push remoto (aplica no Supabase cloud):**
```bash
supabase db push                   # aplica migrations locais no remoto
```

**Bucket Storage via migration (não Dashboard):**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true);
```

**Variáveis de ambiente (executor usa):**
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` → frontend (Vite).
- `SUPABASE_CLI_TOKEN` → CLI (não expor ao frontend, não commitar).
- `SUPABASE_SERVICE_ROLE_KEY` → só para seed/admin scripts isolados, nunca
  no frontend.

> **Segurança:** nunca cole `SUPABASE_SERVICE_ROLE_KEY` ou
> `SUPABASE_CLI_TOKEN` em prompts, logs, ou código commitado. O executor
> usa apenas `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` no frontend.

---

## Migrations versionadas

Substitui "SQL via Dashboard" do plano original. Migrations vivem em
`supabase/migrations/` e são aplicadas via CLI.

| # | Arquivo | Conteúdo |
|---|---|---|
| 0001 | `0001_profiles.sql` | tabela `profiles` + trigger `on_auth_user_created` |
| 0002 | `0002_categories.sql` | tabela `categories` |
| 0003 | `0003_events.sql` | tabela `events` + CHECKs |
| 0004 | `0004_event_sessions.sql` | tabela `event_sessions` |
| 0005 | `0005_event_photos.sql` | tabela `event_photos` |
| 0006 | `0006_favorites.sql` | tabela `favorites` + UNIQUE |
| 0007 | `0007_rls_policies.sql` | `ALTER ... ENABLE RLS` + todas as políticas |
| 0008 | `0008_indexes.sql` | índices listados acima |
| 0009 | `0009_views.sql` | `v_past_events` + `v_ongoing_events` |
| 0010 | `0010_storage_bucket.sql` | bucket `event-photos` (público) |
| 0011 | `0011_seed_categories.sql` | 8 categorias iniciais |
| 0012 | `0012_seed_mock_users.sql` | 2 usuários em `auth.users` + `profiles` |
| 0013 | `0013_seed_sample_events.sql` | 6 eventos de exemplo + sessões + fotos |
| 0014 | `0014_rename_order_to_sort_order.sql` | renomeia `order` → `sort_order` em `event_photos` |
| 0015 | `20260709162156_event_reminders_and_settings.sql` | tabelas `event_reminders` e `notification_settings` |
| 0016 | `20260713150000_add_is_lema_edu.sql` | coluna `is_lema_edu` em `events` |
| 0017 | `20260803000001_multi_category.sql` | `event_categories` (M-N) + backfill + drop de `events.category_id` |
| 0018 | `20260803000002_reminders_channel.sql` | offset livre + canal em `event_reminders` |
| 0019 | `20260803000003_fix_past_views.sql` | views por timestamp completo (eventos sem sessão = Realizados) |
| 0020 | `20260806000001_add_is_confirmed.sql` | `events.is_confirmed` (default true) + helper `is_staff()` + RLS de leitura (não confirmado só p/ staff) |
| 0021 | `20260806000002_events_show_placeholder.sql` | limpa `event_photos` p/ todos exibirem o placeholder |
| 0022 | `20260806000003_push_subscriptions.sql` | tabela `push_subscriptions` + RLS por usuário |
| 0023 | `20260806000004_push_subscriptions_rpc.sql` | RPC `upsert_push_subscription` (SECURITY DEFINER) |
| 0024 | `20260806000005_notification_dispatch.sql` | outbox de eventos novos + `reminder_dispatch` + `get_due_reminders()` + trigger |
| 0025 | `20260806000006_scheduler_cron.sql` | extensões `pg_cron` e `pg_net` (job registrado em deploy) |
| 0026 | `20260806000007_fix_upsert_ambig.sql` | corrige ambiguidade do upsert de `push_subscriptions` |
| 0027 | `20260806000008_outbox_result.sql` | coluna `result jsonb` de auditoria em outbox/reminder_dispatch |
| 0028 | `20260807000000_super_admin_roles.sql` | novo modelo de roles (super_admin/staff/client) + RLS via `is_staff()` |
| 0029 | `20260807000001_harden_on_auth_user_created.sql` | sanitiza `user_type`/`role` do metadata no signup (fallback client/ROLE_VIEWER) |

`supabase/seed.sql` orquestra a chamada dos seeds (0011..0013) para que
`supabase db reset` reproduza o banco inteiro do zero.

---

## Convenções de código

- **Lint:** ESLint com `eslint:recommended` + plugins `react` e `react-hooks`.
- **Format:** Prettier (2 espaços, aspas simples, sem vírgula à direita, 80 cols).
- **Nomenclatura:**
  - Componentes React: `PascalCase` (ex: `EventCard.jsx`).
  - Funções/utilitários: `camelCase` (ex: `formatCurrency`).
  - Arquivos não-JSX: `kebab-case` (ex: `formatters.js`, `recurrence.js`).
- **Idioma:** UI, mensagens de erro e comentários em pt-BR. Nomes de
  variáveis/funcs em inglês quando idiomáticos (ex: `useAuth`), caso
  contrário pt-BR curto.
- **Imports:** ordem `react` → libs externas → internos (`@/`, relativo).
- **Estilo:** MUI `sx` prop preferido sobre `styled()` para protótipo.
- **Commit:** mensagens em pt-BR, presente (ex: "Adiciona tela de login").

---

## Testes

Protótipo mantém testes mínimos (Vitest + Testing Library):

- `tests/recurrence.test.js` — geração semanal/quinzenal/mensal até data fim,
  contagem de sessões, dias da semana corretos.
- `tests/AuthContext.test.jsx` — mock do Supabase client, estado
  `loading`/`authenticated`/`unauthenticated`, `user_type` carregado do
  `profiles`.
- **Smoke tests** (1 por tela principal): render sem crash, elementos
  chave presentes (ex: `EventList` renderiza ≥1 `EventCard`).

Cobertura de protótipo: não buscar 100%. Foco em `recurrence.js` (lógica
pura, alta chance de bug) e `AuthContext` (gating de UI).

Rodar: `npm test` (watch) ou `npm run test -- --run` (CI/one-shot).

---

## architecture.md (documento vivo)

Arquivo `architecture.md` na raiz, criado na Fase 1 e **atualizado a cada
fase implementada**. Executor deve atualizá-lo sempre que: criar/mover
arquivo, adicionar migration, mudar schema, criar componente/rota, mudar
decisão técnica, adicionar dependência.

**Template inicial:**
```markdown
# Architecture — Radar Lema

## Visão geral
[1 parágrafo: o que é, para quem, stack]

## Stack
[tabela copiada do PLAN.md, mantida sincronizada]

## Estrutura de pastas
[árvore atualizada]

## Schema do banco
[resumo + link para migrations]

## Migrations
[lista: arquivo → o que faz]

## RLS
[resumo das políticas]

## Auth
[fluxo de login, mocks, roles]

## Componentes
[tabela: componente → responsabilidade → onde usado]

## Rotas
[tabela: path → componente → permissão]

## Como rodar (local)
[setup, env, migrations, seed, npm run dev]

## Como testar
[npm test, o que cobre]

## Decisões técnicas
[bullet points datados, com referência a ADRs]

## Histórico de mudanças
[bullet datado por fase: o que mudou desde a última versão]
```

---

## Ordem de desenvolvimento

### Fase 1 — Setup e Auth
1. `npm create vite@latest` (React) + instalar deps: MUI v7, `@mui/icons-material`, `@supabase/supabase-js`, `react-router-dom`, `vite-plugin-pwa`, ESLint, Prettier, Vitest, Testing Library
2. Configurar `.env.local` com `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (já existem)
3. Configurar ESLint (`.eslintrc.cjs`) + Prettier (`.prettierrc`) + scripts `lint`/`format` no `package.json`
4. Criar `theme.js` alinhado ao UNO (cores, Manrope)
5. `supabase login` + `supabase link --project-ref vrvyfgneawtceebyagak`
6. Criar migrations 0001..0010 via `supabase migration new` e aplicar com `supabase migration up`
7. Criar `supabase/seed.sql` + migrations 0011..0013 (categorias, 2 usuários mock, 6 eventos exemplo) + `supabase db reset`
8. Tela de Login (Supabase Auth) — `pages/Login.jsx`
9. `AuthContext`: carregar perfil do Supabase, expor `{ user, profile, user_type, role, loading, signIn, signOut }`
10. Layout base: `Navbar` (desktop) + Drawer lateral mobile com abas condicionais por tier (staff vê "Gestão" e "Categorias"; client não vê)
11. Rotas com `react-router-dom`: `/login`, `/`, `/evento/:id`, `/favoritos`, `/realizados`, `/gestao`, `/gestao/novo`, `/gestao/:id/editar`, `/categorias`
12. Criar `architecture.md` (template acima preenchido com o que foi feito nesta fase)

### Fase 2 — Listagem e Detalhe
13. Tela EventList: buscar eventos do Supabase (exceto Realizados) + mountar cards
14. EventCard: foto de capa, título, datas, modalidade, cidade/UF, valor, badges (Realizado / Em andamento)
15. EventFilters: busca por texto + filtros (categoria, modalidade, pago/gratuito, cidade, UF, data)
16. Presets de data: este mês, próximo mês, mês/ano, intervalo
17. Tela EventDetail: fotos carrossel, título, badges, valor, sessões, mapa embed, link de inscrição, botões favoritar/compartilhar
18. Botões de favoritar e compartilhar no topo das fotos
19. Atualizar `architecture.md`

### Fase 3 — Favoritos e Realizados
20. Tela Favorites: listar eventos favoritados (mesmos filtros)
21. Toggle favorito (coração no card e na tela de detalhe) — respeita RLS (`user_id = auth.uid()`)
22. Tela PastEvents (Realizados): usa view `v_past_events`
23. Badge "Realizado" no card de eventos passados; badge "Em andamento" no card de eventos em curso
24. Atualizar `architecture.md`

### Fase 4 — Gestão de Eventos (staff)
25. Tela ManageEvents: listar eventos com ações editar/duplicar/excluir (só `ROLE_SUPER_ADMIN`)
26. Tela EventFormPage: formulário de criar/editar
27. SessionEditor: adicionar/remover/editar sessões (data + horário início/fim)
28. PhotoUploader: upload de até 5 fotos, 3MB cada, remover antes de salvar
29. RecurrenceEditor: escolher frequência (semanal/quinzenal/mensal) + data fim
30. Geração de sessões via `utils/recurrence.js`
31. **Escopo de edição/exclusão de sessão recorrente** (3 modos):
    - **Só esta**: `UPDATE event_sessions` na 1 linha (id da sessão). Não afeta outras.
    - **Este e próximos**: `UPDATE event_sessions` WHERE `event_id = X AND start_date >= desta`. Aplica o mesmo delta de horário/duração a todas as afetadas. Não regenera.
    - **Todos**: atualiza campos compartilhados em `events` (ex: título, descrição) + aplica delta de horário/duração a **todas** as `event_sessions` do evento. Não regenera sessões (mantém instâncias existentes, só ajusta campos editados).
    - UI: modal após clicar "Salvar" pedindo o escopo. Default: "Só esta".
32. **Duplicação de evento**: copia campos + modelo de recorrência + intervalo de datas. **NÃO copia fotos** (novo evento nasce sem fotos). Se `recurrence_until < hoje`, warnar no form: "Datas no passado. Ajuste antes de salvar."
33. Gestão de categorias (tela Categories: criar/editar/excluir) — tier staff (`staff`/`super_admin`)
34. Atualizar `architecture.md`

### Fase 5 — PWA e Deploy
35. Configurar `vite-plugin-pwa` no `vite.config.js` (manifest + Workbox, shell offline, sem cache de dados)
36. Gerar ícones PWA (`public/icons/`, 192px + 512px)
37. Configurar Vercel deploy (`vercel.json` com rewrite pra SPA fallback `index.html`)
38. Testar install prompt no celular (modo HTTPS ou `localhost`)
39. Atualizar `architecture.md` (versão final)

---

## Mock data inicial (seed)

### Usuários (2)
- `admin@lema.com` — `user_type = 'super_admin'`, `role = 'ROLE_SUPER_ADMIN'` (cadastra/edita/exclui/duplica + Painel Admin)
- `dirigente@lema.com` — `user_type = 'client'`, `role = 'ROLE_VIEWER'` (só visualiza/favorita/compartilha)

Senha dos mocks: `lema123` (hash bcrypt gerado pelo executor no seed).

### Categorias
Comitê, Workshop, Live/Webinar, Palestra, Congresso, Seminário, Curso, Encontro

### Eventos de exemplo (5-6)
1. Comitê de Investimentos — recorrente semanal, toda segunda, online, gratuito
2. Congresso de RPPS 2026 — presencial, 2 dias, pago "a partir de R$ 500"
3. Workshop de Análise Macroeconômica — presencial, São Paulo, 1 dia, pago
4. Live: Cenário Econômico da Semana — online, gratuito, única data
5. Seminário de Governança — híbrido, Brasília, pago "a partir de R$ 300"
6. Curso de ALM para RPPS — online, 3 sessões, pago "a partir de R$ 800"

---

## Restrições e limites do protótipo

- **Não mexer no código do UNO** — zero arquivos alterados no codebase do UNO
- **Push automático implementado** — o disparo de notificações (eventos novos
  por categoria e lembretes) roda de verdade via Edge Function
  `notification-scheduler` agendada por `pg_cron` + `pg_net`; o canal E-mail
  do lembrete ainda é só configuração salva ("em breve")
- **Sem suporte offline de dados** — só o shell do PWA funciona offline
- **Sem autocomplete de endereço** — mapa via Google Maps embed com texto livre
- **Sem tela de auditoria** — `created_by` é salvo mas não há UI para consultar
- **Sem i18n** — tudo em pt-BR
- **Sem lat/lng** — geolocalização fica para quando o dev assumir
- **Sem permissões granulares por staff** — no protótipo o tier staff
  (`staff`/`super_admin`) edita/exclui; o super admin ainda acessa o Painel
  Admin (`/admin`); futuras roles (BACKOFFICE, COMERCIAL, etc.) ganham acesso
  na migração

---

## Pontos de atenção para a migração (dev)

1. **Auth**: trocar usuários mockados por leitura do banco do UNO (`users.email` + `users.password` + `users.role` + `users.plan_id`)
2. **Banco**: decidir entre manter no Supabase ou migrar para o PostgreSQL do UNO (novas tabelas `events`, `event_sessions`, etc.)
3. **Storage**: avaliar migração de fotos do Supabase Storage para AWS S3 (UNO já usa `@aws-sdk/client-s3`)
4. **Permissões**: implementar RBAC granular no Radar usando as 8 roles do UNO
5. **Notificações**: implementar push notifications (PWA + service worker + FCM/OneSignal)
6. **Compartilhamento**: avaliar landing page pública para links compartilhados externamente
7. **Integração**: adicionar Radar Lema como item de menu no UNO ou manter como sub-app com iframe/link