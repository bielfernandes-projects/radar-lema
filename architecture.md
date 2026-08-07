# Architecture — Radar Lema

## Visão geral

O Radar Lema é um PWA standalone para centralizar eventos do ecossistema RPPS
(comitês, workshops, lives, palestras, congressos etc.). Usa autenticação real
do Supabase (e-mail/senha, com recuperação por link), navegação condicional por
tipo de usuário (super admin, staff Lema e cliente RPPS), e cobre listagem,
detalhe, favoritos, eventos realizados, gestão de eventos/categorias, push
notifications com agendador e Painel Admin.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 18 + Material UI v7 |
| Roteamento | react-router-dom v6 (Data Router: `createBrowserRouter`) |
| Tipografia | Manrope (Google Fonts) |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| Supabase IaC | `supabase` CLI (migrations + seed, zero Dashboard) |
| PWA | `vite-plugin-pwa` + Workbox (manifest, service worker, shell offline) |
| Lint | ESLint (`eslint:recommended` + `react` + `react-hooks`) |
| Format | Prettier |
| Testes | Vitest + Testing Library |

## Estrutura de pastas

```
radar-lema/
├── CONTEXT.md
├── DESIGN.md
├── PLAN.md
├── PRODUCT.md
├── README.md
├── architecture.md
├── push-notifications.md
├── docs/
│   └── adr/
│       ├── 0001-app-standalone-vs-modulo-uno.md
│       ├── 0002-supabase-como-backend-do-prototipo.md
│       ├── 0003-auth-supabase-mockada-vs-banco-uno.md
│       ├── 0004-evento-nao-definido.md
│       └── 0005-super-admin-e-roles.md
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
│   │   ├── 0009_views.sql
│   │   ├── 0010_storage_bucket.sql
│   │   ├── 0011_seed_categories.sql
│   │   ├── 0012_seed_mock_users.sql
│   │   ├── 0013_seed_sample_events.sql
│   │   ├── 0014_rename_order_to_sort_order.sql
│   │   ├── 20260709162156_event_reminders_and_settings.sql
│   │   ├── 20260713150000_add_is_lema_edu.sql
│   │   ├── 20260803000001_multi_category.sql
│   │   ├── 20260803000002_reminders_channel.sql
│   │   ├── 20260803000003_fix_past_views.sql
│   │   ├── 20260806000001_add_is_confirmed.sql
│   │   ├── 20260806000002_events_show_placeholder.sql
│   │   ├── 20260806000003_push_subscriptions.sql
│   │   ├── 20260806000004_push_subscriptions_rpc.sql
│   │   ├── 20260806000005_notification_dispatch.sql
│   │   ├── 20260806000006_scheduler_cron.sql
│   │   ├── 20260806000007_fix_upsert_ambig.sql
│   │   ├── 20260806000008_outbox_result.sql
│   │   └── 20260807000000_super_admin_roles.sql
│   └── seed.sql
├── scripts/
│   ├── seed-mock-users.mjs
│   ├── promote-super-admin.mjs
│   └── detect.mjs
├── public/
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── icons.svg
│   ├── logo.png
│   └── placeholder-event.png
├── vercel.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── sw.js
│   ├── theme/
│   │   └── theme.js
│   ├── lib/
│   │   └── supabase.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ColorModeContext.jsx
│   ├── hooks/
│   │   ├── useUserData.js
│   │   ├── useFavorites.js
│   │   ├── useReminders.js
│   │   └── useNotificationSettings.js
│   ├── services/
│   │   ├── adminApi.js
│   │   ├── eventData.js
│   │   └── eventPersistence.js
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   ├── EventCard.jsx
│   │   ├── EventFilters.jsx
│   │   ├── FilterSummary.jsx
│   │   ├── ClearFiltersButton.jsx
│   │   ├── EmptyState.jsx
│   │   ├── PageSkeleton.jsx
│   │   ├── MapEmbed.jsx
│   │   ├── ReminderDialog.jsx
│   │   ├── SessionScopeDialog.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SessionEditor.jsx
│   │   ├── RecurrenceEditor.jsx
│   │   ├── PhotoUploader.jsx
│   │   ├── PasswordToggle.jsx
│   │   ├── InstallAppButton.jsx
│   │   └── InstallAppIcon.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   ├── RecoverPassword.jsx
│   │   ├── EventList.jsx
│   │   ├── EventDetail.jsx
│   │   ├── Favorites.jsx
│   │   ├── PastEvents.jsx
│   │   ├── Settings.jsx
│   │   ├── ManageEvents.jsx
│   │   ├── EventFormPage.jsx
│   │   ├── Categories.jsx
│   │   └── AdminDashboard.jsx
│   └── utils/
│       ├── auth.js
│       ├── constants.js
│       ├── dateFilters.js
│       ├── events.js
│       ├── eventForm.js
│       ├── filterEvents.js
│       ├── formatters.js
│       └── recurrence.js
├── tests/
│   ├── setup.js
│   ├── AuthContext.test.jsx
│   ├── eventForm.test.js
│   ├── eventPersistence.test.js
│   ├── events.test.js
│   ├── favorites.test.jsx
│   ├── formatters.test.js
│   └── recurrence.test.js
├── .env.local
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── package.json
└── vite.config.js
```

## Schema do banco

O schema segue o `PLAN.md`:

- `profiles`: espelha `auth.users` com `user_type` (staff/client) e `role` do UNO.
- `categories`: tipos de evento (lista fixa gerenciável).
- `events`: agregado principal com modalidade, valor, endereço, recorrência
  e `is_confirmed` (evento "Não definido": `false` = visível apenas para
  staff; default `true`).
- `event_categories`: relacionamento muitos-para-muitos entre eventos e
  categorias (`PRIMARY KEY (event_id, category_id)`). Um evento pode pertencer
  a várias categorias; não há mais `category_id` único em `events`.
- `event_sessions`: datas/horários de cada evento.
- `event_photos`: fotos de capa/carrossel com URL pública estática.
- `favorites`: eventos salvos por usuário (`UNIQUE(user_id, event_id)`).
- `event_reminders`: lembretes configurados por evento favoritado, com offset
  livre em minutos (qualquer antecedência) e canal (`push`/`email`). O mesmo
  offset pode existir nos dois canais (`UNIQUE(user_id, event_id, offset_minutes, channel)`).
- `notification_settings`: configuração global de notificações por usuário (`push_enabled`, `email_enabled`, `categories_enabled`).
- Views `v_past_events` e `v_ongoing_events` (comparadas por timestamp
  completo de fim de sessão; eventos sem sessões contam como Realizados).
- Bucket `event-photos` público para leitura.

Detalhes completos estão nas migrations em `supabase/migrations/`.

## Migrations

| # | Arquivo | Conteúdo |
|---|---|---|
| 0001 | `0001_profiles.sql` | Tabela `profiles` + trigger `on_auth_user_created` |
| 0002 | `0002_categories.sql` | Tabela `categories` |
| 0003 | `0003_events.sql` | Tabela `events` + CHECKs |
| 0004 | `0004_event_sessions.sql` | Tabela `event_sessions` |
| 0005 | `0005_event_photos.sql` | Tabela `event_photos` |
| 0006 | `0006_favorites.sql` | Tabela `favorites` + UNIQUE |
| 0007 | `0007_rls_policies.sql` | `ENABLE RLS` + políticas |
| 0008 | `0008_indexes.sql` | Índices listados no PLAN |
| 0009 | `0009_views.sql` | `v_past_events` + `v_ongoing_events` |
| 0010 | `0010_storage_bucket.sql` | Bucket `event-photos` público |
| 0011 | `0011_seed_categories.sql` | 8 categorias iniciais |
| 0012 | `0012_seed_mock_users.sql` | 2 usuários mock + perfis |
| 0013 | `0013_seed_sample_events.sql` | 6 eventos + sessões + fotos |
| 0014 | `0014_rename_order_to_sort_order.sql` | Renomeia coluna `order` para `sort_order` em `event_photos` |
| 0015 | `20260709162156_event_reminders_and_settings.sql` | Tabelas `event_reminders` e `notification_settings` + RLS + índice |
| 0016 | `20260713150000_add_is_lema_edu.sql` | Coluna `is_lema_edu` em `events` + recria views |
| 0017 | `20260803000001_multi_category.sql` | Tabela `event_categories` (M-N), backfill de `events.category_id`, drop da coluna + índice antigos, recria views (0018) |
| 0018 | `20260803000002_reminders_channel.sql` | Lembrete com offset livre (`CHECK offset_minutes > 0`) e coluna `channel` (`push`/`email`) + UNIQUE com canal |
| 0019 | `20260803000003_fix_past_views.sql` | Views `v_past_events`/`v_ongoing_events` por timestamp completo de sessão (inclui eventos sem sessões como Realizados) |
| 0020 | `20260806000001_add_is_confirmed.sql` | Coluna `events.is_confirmed` (default true), helper `is_staff()` e política `events_select` restrita a `is_confirmed = true OR is_staff()` |
| 0021 | `20260806000002_events_show_placeholder.sql` | Limpa `event_photos` para todos os eventos exibirem o placeholder; ajusta sort de foto única |
| 0022 | `20260806000003_push_subscriptions.sql` | Tabela `push_subscriptions` (endpoint, p256dh, auth) + RLS por usuário |
| 0023 | `20260806000004_push_subscriptions_rpc.sql` | RPC `upsert_push_subscription` (SECURITY DEFINER) para gravar subscriptions |
| 0024 | `20260806000005_notification_dispatch.sql` | Motor de disparo: outbox `notification_outbox` (eventos novos por categoria) e `reminder_dispatch` (lembretes já disparados por sessão, evita reenvio) + RPC `get_due_reminders()` + trigger `queue_new_event_notification` |
| 0025 | `20260806000006_scheduler_cron.sql` | Habilita extensões `pg_cron` e `pg_net` (o job do cron é registrado em deploy, não versionado) |
| 0026 | `20260806000007_fix_upsert_ambig.sql` | Corrige ambiguidade ("column reference endpoint is ambiguous") no upsert de `push_subscriptions` (DROP + CREATE com parâmetros prefixados `p_`) |
| 0027 | `20260806000008_outbox_result.sql` | Observabilidade: coluna `result jsonb` em `notification_outbox` e `reminder_dispatch` guarda `{sent, gone, failed, total}` retornado pelo `send-push` |
| 0028 | `20260807000000_super_admin_roles.sql` | Novo modelo de roles: `super_admin`/`ROLE_SUPER_ADMIN`, `staff`/`ROLE_ADMIN`, `client`/`ROLE_VIEWER`; reclassifica contas; RLS de escrita via `is_staff()` |
| 0029 | `20260807000001_harden_on_auth_user_created.sql` | Endurece `on_auth_user_created`: sanitiza `user_type`/`role` do metadata para valores do modelo atual (fallback `client`/`ROLE_VIEWER`) — impede 500 no `/signup` de clientes antigos que ainda enviam `ROLE_DIRIGENTE` |

## RLS

Todas as tabelas têm RLS habilitado:

- `profiles`: usuário lê próprio perfil; super admin (`ROLE_SUPER_ADMIN`)
  lê todos. Insert/update/delete bloqueados (perfil criado pelo trigger de
  auth; mudanças via Edge Function `admin-users` com service role).
- `categories`, `events`, `event_sessions`, `event_photos`: leitura pública;
  escrita para o tier staff (`is_staff()` = `user_type IN ('staff',
  'super_admin')`). Eventos não confirmados (`is_confirmed = false`) são
  legíveis apenas pelo tier staff; as views `v_past_events`/`v_ongoing_events`
  herdam a restrição por serem `SECURITY INVOKER`.
- `event_categories`: leitura pública; escrita para o tier staff
  (`is_staff()`).
- `favorites`: isolado por `user_id = auth.uid()`; agregados cross-usuário
  apenas via RPC `admin_dashboard_stats()` (SECURITY DEFINER, valida super
  admin).
- `event_reminders`: isolado por `user_id = auth.uid()` (política `reminders_owner`).
- `notification_settings`: isolado por `user_id = auth.uid()` (política `settings_owner`).
- `push_subscriptions`: isolado por `user_id = auth.uid()` (select/insert/update/delete
  do próprio usuário); o upsert multi-aparelho roda via RPC SECURITY DEFINER
  `upsert_my_push_subscription` (troca de conta no mesmo dispositivo).
- `notification_outbox` e `reminder_dispatch`: tabelas internas sem policies —
  acessadas apenas pela role service_role (Edge Function) e triggers
  SECURITY DEFINER.
- Storage `event-photos`: leitura pública; escrita apenas autenticado.

## Auth

- Modelo de roles (migration `20260807000000_super_admin_roles.sql`):

  | user_type | role | Acesso |
  |---|---|---|
  | `super_admin` | `ROLE_SUPER_ADMIN` | Tudo (staff) + Painel Admin `/admin` (dashboard e gestão de usuários) |
  | `staff` | `ROLE_ADMIN` | Gerencia eventos e categorias |
  | `client` | `ROLE_VIEWER` | Somente leitura |

- Mockados de exemplo: `admin@lema.com` / `lema123` → super_admin
  (`ROLE_SUPER_ADMIN`); `dirigente@lema.com` / `lema123` → client
  (`ROLE_VIEWER`).
- A migration `0012_seed_mock_users.sql` tenta inserir via SQL em `auth.users`,
  `auth.identities` e `profiles` (funciona em `supabase db reset` local).
- No Supabase cloud, o insert direto em `auth.users` não é suficiente para o
  GoTrue; use `node scripts/seed-mock-users.mjs` após o push.
- **Criar Conta** (rota `/criar-conta`): colaboradores testam o protótipo
  criando conta própria. O formulário pede nome, e-mail e senha; o
  `AuthContext` chama `supabase.auth.signUp` com metadados
  `user_type: 'client'`, `role: 'ROLE_VIEWER'` — o trigger
  `on_auth_user_created` cria o `profiles` automaticamente. Contas novas
  nascem como `client` (menor privilégio). O super admin promove/degrada
  usuários pelo **Painel Admin** (`/admin`).
- **Gestão de usuários** (super admin): a Edge Function `admin-users`
  (service role) valida o chamador como `ROLE_SUPER_ADMIN` e oferece
  `create` (nome/e-mail/senha/user_type, e-mail confirmado), `update`
  (nome/tipo), `reset_password` e `delete`. O app chama via
  `services/adminApi.js`. Dashboard e lista de usuários leem
  `profiles` diretamente (RLS libera leitura para super admin) e a RPC
  `admin_dashboard_stats()` (SECURITY DEFINER) devolve os agregados.
- Frontend usa `supabase.auth.signInWithPassword` (login) e
  `supabase.auth.signUp` (cadastro). **Alterar senha** na Config confere a
  senha atual com `signInWithPassword` e aplica `supabase.auth.updateUser`.
- **Recuperar senha**: o `Login` tem "Esqueci minha senha" (Dialog com e-mail)
  que chama `resetPasswordForEmail` com `redirectTo: /recuperar-senha`. A rota
  `/recuperar-senha` (`RecoverPassword.jsx`) troca o `code` da URL por sessão
  via `exchangeCodeForSession` e aplica a nova senha com `updateUser`.
- `AuthContext` expõe `{ user, profile, loading, signIn, signOut, signUp }`
  e carrega o perfil de `profiles` após login/cadastro. Helpers
  `utils/auth.js`: `isStaffTier(profile)` (staff|super_admin) e
  `isSuperAdmin(profile)` (role `ROLE_SUPER_ADMIN` ou user_type
  `super_admin`) centralizam as checagens.

## Serviços

| Arquivo | Funções | Responsabilidade |
|---|---|---|
| `services/eventData.js` | `fetchMetadata`, `fetchCategories`, `fetchAllEventsWithMeta`, `fetchFavoriteEventsWithMeta`, `fetchPastEventsWithMeta` | Todas aceitam `deps = { supabase }` (seam para testes). `fetchMetadata` também busca `event_categories` e cada fetcher enriquece os eventos com `category_ids` (multi-categoria). |
| `services/eventPersistence.js` | `uploadPhotos`, `saveSessions`, `persistEvent`, `saveCategories` | Extraído do `EventFormPage`. Gerencia o salvamento completo de um evento (dados, fotos, sessões) em transação lógica; `saveCategories` grava os vínculos em `event_categories` (replica por evento). |
| `services/adminApi.js` | `adminApi` (`create`, `update`, `resetPassword`, `remove`) + constantes `USER_TYPES`, `ROLE_BY_USER_TYPE` | Chama a Edge Function `admin-users` (service role) com o token do usuário logado; o backend valida `ROLE_SUPER_ADMIN` antes de criar/editar/excluir usuários ou redefinir senhas. |

## Componentes

| Componente | Responsabilidade | Onde usado |
|---|---|---|
| `AuthContext` | Estado de autenticação e perfil | Envolve toda a app |
| `ColorModeContext` | Estado do tema (light/dark) por usuário, persistido em `localStorage` com chave `theme-mode:{email}`. Detecta `prefers-color-scheme` quando não há preferência salva; sincroniza atributo `data-theme` no `<html>` para variáveis CSS. | Dentro de `AuthProvider`, envolve `ThemeProvider` |
| `ProtectedRoute` | Protege rotas por autenticação; `requireStaff` exige tier staff (staff/super_admin) e `requireAdmin` exige super admin | `App.jsx` |
| `Navbar` | Navegação: desktop com abas condicionais (itens de client, grupo staff com borda `primary.light` para Categorias+Gestão e Painel Admin com fundo azul claro + borda branca) + toggle de tema; mobile com Drawer lateral (hambúrguer) listando as mesmas seções com ícones (separadas por `Divider` por grupo), tema e Sair/Entrar no rodapé. Logo (favicon 32×32) à esquerda do nome "Radar Lema", clicável para voltar à home | `App.jsx` |
| `Login` | Formulário de login com "Esqueci minha senha" (Dialog que envia link de recuperação), botão "Criar Conta" (link para `/criar-conta`) e toggle de tema respeitando o `ColorModeContext`. Card centralizado verticalmente (sem scroll) com ícone de instalação no canto superior direito (`InstallAppIcon`) | Rota `/login` |
| `InstallAppIcon` | Ícone de download (topo direito do login) que instala via `beforeinstallprompt` ou abre modal com instruções de instalação (iOS/desktop). Oculto quando já instalado | `Login` |
| `InstallAppButton` | Botão "Instalar App" (texto completo) com o mesmo comportamento do ícone | `Settings` |
| `InstallAppIcon` | Ícone de download (topo direito do login) que instala via `beforeinstallprompt` ou abre modal com instruções de instalação (iOS/desktop). Oculto quando já instalado | `Login` |
| `SignUp` | Formulário de cadastro (nome, e-mail, senha, confirmar senha); cria conta `client` via `signUp` e tela de confirmação de e-mail como fallback | Rota `/criar-conta` |
| `RecoverPassword` | Redefinição de senha: troca o `code` da URL por sessão (`exchangeCodeForSession`) e aplica a nova senha (`updateUser`) | Rota `/recuperar-senha` |
| `EventList` | Lista de eventos com filtros e paginacao; botao "Limpar Filtros" no cabecalho; `FilterSummary` com chips dos filtros aplicados | Rota `/` |
| `EventCard` | Card de evento com capa, titulo, datas, valor e badges. Toast de favorito com 3s e botao fechar | `EventList`, `Favorites`, `PastEvents` |
| `EventFilters` | Filtros: categorias, modalidade e estado como dropdowns (com type-to-search, sem `readOnly`); chips toggle na ordem Lema Edu, Gratuito, Pago, Este mes, Proximo mes e Data Personalizada (popover com Data inicio/Data fim + Confirmar/Cancelar). Em mobile os filtros ficam colapsados atrás de um botão "Filtros" (toggle). Filtro de data aceita range completo ou parcial | `EventList` |
| `FilterSummary` | Chips com os filtros ativos (categoria, modalidade, estado, datas) e remoção individual de cada um | `EventList`, `Favorites`, `PastEvents` |
| `ClearFiltersButton` | Botao compacto "Limpar Filtros" compartilhado (fonte 0.75rem, padding reduzido, icon 16px). `disabled` quando nao ha filtros | `EventList`, `Favorites`, `PastEvents` |
| `EmptyState` | Estado vazio compartilhado (ícone, título, descrição opcional) | `EventList`, `Favorites`, `PastEvents`, `ManageEvents` |
| `PageSkeleton` | Skeleton de página (navbar placeholder + cards) durante o carregamento | `EventList`, `PastEvents`, `Favorites` |
| `EventDetail` | Detalhe do evento com carrossel, sessoes, mapa, acoes e lightbox (imagem clicavel em fullscreen). Exibe as categorias do evento como chips múltiplos | Rota `/evento/:id` |
| `MapEmbed` | Embed do Google Maps a partir de endereco em texto | `EventDetail` |
| `Favorites` | Lista de eventos favoritados pelo usuario logado, com botao "Limpar Filtros" | Rota `/favoritos` |
| `PastEvents` | Lista de eventos realizados (`v_past_events`), com botao "Limpar Filtros" | Rota `/realizados` |
| `useFavorites` | Hook para carregar e alternar favoritos via Supabase SDK. Usa `useUserData` para o listener de auth. | `EventList`, `EventDetail`, `Favorites`, `PastEvents` |
| `ManageEvents` | Gestão de eventos com abas Confirmados/A definir/Realizados, barra de busca (título/descrição, aplicada em todas as abas) e ações editar/duplicar/excluir. Toast de exclusão com 3s e botao fechar | Rota `/gestao` |
| `EventFormPage` | Formulário de criar/editar/duplicar evento. Seleção de múltiplas categorias via Autocomplete multiple. Delega persistência para `services/eventPersistence.js`. | Rotas `/gestao/novo` e `/gestao/:id/editar` |
| `Categories` | CRUD de categorias | Rota `/categorias` |
| `SessionEditor` | CRUD de sessões (data/horário início/fim) | `EventFormPage` |
| `SessionScopeDialog` | Dialog de escopo ao editar/excluir sessão de evento recorrente: "só esta" / "esta e as próximas" / "todas" | `SessionEditor` |
| `RecurrenceEditor` | Toggle, frequência e data fim da recorrência | `EventFormPage` |
| `PhotoUploader` | Upload/remove de fotos com limite 5 fotos/3MB | `EventFormPage` |
| `PasswordToggle` | Botão "mostrar/ocultar senha" (ícone de olho) em campos de senha | `Login`, `SignUp`, `RecoverPassword`, `Settings` |
| `useReminders` | Hook para carregar/salvar/remover lembretes via Supabase SDK. Trabalha com entradas `{ offset_minutes, channel }` e upsert com `ignoreDuplicates` (mesmo offset pode existir em push e email). Usa `useUserData` para o listener de auth. | `EventCard`, `EventDetail`, `Settings` |
| `useNotificationSettings` | Hook para carregar/salvar configuracoes de notificacao. Usa `useUserData` para o listener de auth. | `Settings` |
| `ReminderDialog` | Dialog de lembretes com offset livre (campo numerico **sem spinners +/−** + unidades Minuto/Hora/Dia/Semana/Mes) e canal por lembrete (push/email). Toast de confirmacao/erro com 3s e botao fechar | `EventCard`, `EventDetail`, `Settings` |
| `AdminDashboard` | Painel Admin: cards com totais (usuários/eventos/favoritos), gráficos mensais (recharts) de crescimento de usuários e favoritos com barras centralizadas no card (margens balanceadas com a faixa do eixo Y), e gestão de usuários (criar com senha escolhida, editar tipo/role, redefinir senha, excluir). Previne excluir/editar a própria conta | Rota `/admin` |
| `Settings` | Configurações: alterar senha (atual/nova/confirmação), notificações push, teste de notificação, instalar app e lista de lembretes | Rota `/configuracoes` |

## Rotas

| Path | Componente | Permissão |
|---|---|---|
| `/login` | `Login` | Pública; usuarios logados sao redirecionados para `/` |
| `/criar-conta` | `SignUp` | Pública; usuarios logados sao redirecionados para `/` |
| `/recuperar-senha` | `RecoverPassword` | Pública (via link do e-mail de recuperação; redireciona logados para `/`) |
| `/` | `EventList` | Autenticado; aceita query params para filtros |
| `/evento/:id` | `EventDetail` | Autenticado |
| `/favoritos` | `Favorites` | Autenticado |
| `/realizados` | `PastEvents` | Autenticado |
| `/gestao` | `ManageEvents` | Staff (staff/super_admin) |
| `/gestao/novo` | `EventFormPage` | Staff (staff/super_admin) |
| `/gestao/:id/editar` | `EventFormPage` | Staff (staff/super_admin) |
| `/categorias` | `Categories` | Staff (staff/super_admin) |
| `/admin` | `AdminDashboard` | Super admin (`ROLE_SUPER_ADMIN`) |
| `/configuracoes` | `Settings` | Autenticado |

## PWA

O `vite-plugin-pwa` gera o manifest e o service worker no build:

- **Manifest**: `manifest.webmanifest` com `name: "Radar Lema"`, `short_name: "Radar Lema"`,
  `theme_color: #1976d2`, `background_color: #ffffff`, `display: standalone`,
  `start_url: /`, `id: /`, `lang: pt-BR` e icones 192/512px (`purpose: any`).
- **Icones**: o manifest usa o conjunto `public/android-chrome-192x192.png` e
  `public/android-chrome-512x512.png` (mesma arte do favicon oficial).
- **Workbox**:
  - Precache do shell: `**/*.{js,css,html,svg,png,woff2}`, com exceção de
    `public/placeholder-event.png` (`globIgnores`) para que trocas do arquivo
    reflitam sem depender de atualizacao do service worker.
  - `navigateFallback: 'index.html'` para SPA fallback offline.
  - `runtimeCaching`:
    - Fontes do Google (stylesheets + webfonts): `CacheFirst`.
    - Imagens locais da aplicacao: `StaleWhileRevalidate`, excluindo
      `placeholder-event.png` (negative lookahead no regex).
    - **Nao ha cache para chamadas do Supabase nem fotos externas** — dados
      continuam exigindo rede, conforme restricao do prototipo.
- **Testes**: em `localhost` (ou HTTPS), o Chrome exibe o ícone/opção de
  instalar no login (e o botão na Config). DevTools > Application > Manifest
  e Service Workers devem mostrar o app registrado sem erros. Ao desligar a
  rede, o shell carrega, mas listagem e detalhe de eventos ficam em empty
  state/erro por falta de dados.

## Deploy

Deploy de demonstracao na **Vercel** (configurado via `vercel.json`):

- `framework`: Vite
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- SPA fallback: todas as rotas apontam para `index.html`.
- Headers de cache para assets hashed, icones e manifest.

### Como fazer deploy manual pelo dashboard Vercel

1. Faca push do repo para `https://github.com/bielfernandes-projects/radar-lema`.
2. Acesse [vercel.com](https://vercel.com) > "Add New Project" > importe o repo.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Adicione as variaveis de ambiente:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
7. Clique em **Deploy**.

> Nao foi executado `vercel --prod` porque o CLI nao esta disponivel no ambiente.

## Como rodar (local)

1. `npm install`
2. Garantir que `.env.local` exista com `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`
   e, opcionalmente, `VITE_GOOGLE_MAPS_API_KEY` para exibir o mapa embed.
3. `supabase login`
4. `supabase link --project-ref vrvyfgneawtceebyagak`
5. `supabase db push` (aplica migrations no remoto)
6. `node scripts/seed-mock-users.mjs` (cria usuarios mock no Supabase cloud)
7. `npm run dev` (abre http://localhost:5173)

> Nota: `supabase db reset` exige Docker Desktop. Sem Docker, use `supabase db push`
> seguido de `node scripts/seed-mock-users.mjs`.

## Como testar

- `npm run test:run` — roda a suite Vitest (AuthContext, formatters, favorites,
  recurrence, events, eventForm, eventPersistence).
- `npm run lint` — verifica ESLint.
- `npm run build` — compila para producao.
- Acesso a qualquer rota (incluindo `/`, `/evento/:id`, `/realizados`, `/favoritos`)
  sem login redireciona para `/login`.
- Login com `admin@lema.com` / `lema123` redireciona para `/` e mostra abas de
  staff (Gestão, Categorias) + Painel Admin.
- Login com `dirigente@lema.com` / `lema123` redireciona para `/` e não mostra
  Gestão nem Categorias.
- Clicar em **Sair** redireciona para `/login`.
- `/gestao` logado como dirigente redireciona para `/`; `/admin` logado como
  staff (não super_admin) também redireciona para `/`.

## Utils

| Arquivo | Funcoes | Uso |
|---|---|---|---|
| `utils/auth.js` | `getUserId`, `isStaffTier`, `isSuperAdmin` | Extrai `user.id` da sessão atual; checagens de autorização por perfil (tier staff e super admin) |
| `utils/constants.js` | `URL_PARAMS`, `MODALITY_LABELS`, `REMINDER_UNITS`, `REMINDER_CHANNELS`, `UFs`, `NAV_ITEMS` | Nomes canônicos de query params, labels, unidades de lembrete (minute/hour/day/week/month em minutos), canais (push/email) e dados estáticos compartilhados |
| `utils/formatters.js` | `formatCurrency`, `formatPrice`, `formatDateRange`, `formatModality`, `formatSessionTime`, `formatReminder`, `formatReminderUnit`, `formatReminderMinutes`, `minutesToReminder` | Cards, detalhe, sessoes, lembretes e testes |
| `utils/events.js` | `enrichEvents` | Adiciona capa, datas min/max, status e proxima sessao aos eventos brutos; recebe `eventCategories` para popular `category_ids` |
| `utils/eventForm.js` | `parseDateTime`, `formatDateTime`, `calculateDelta`, `applyDelta`, `emptySession`, `validate` | Parsing/format de data/hora, cálculo de delta entre sessões, sessão vazia padrão, validação do formulário (exige ao menos uma categoria) |
| `utils/filterEvents.js` | `filterEvents`, `normalizeDate` | Filtro e ordenação de arrays de eventos (busca, categorias via `category_ids`, modalidade, preço, estado, presets de data e range personalizado `dateFrom`/`dateTo` com overlap — aceita só início, só fim ou ambos) |
| `utils/dateFilters.js` | `getMonthRange`, `applyDatePresets`, `normalizeDate`, `eventMatchesDatePresets`, `eventMatchesDateRange` | Presets de data (este/próximo mês) e overlap de intervalo de datas (com suporte a filtro parcial) |
| `utils/recurrence.js` | `generateRecurringSessions` | Gera sessoes semanais, quinzenais ou mensais a partir de uma sessao base |
| `hooks/useUserData.js` | `refresh`, `loading` | Hook genérico: escuta `onAuthStateChange`, chama `fetchFn(userId)` sempre que o auth muda |
| `hooks/useFavorites.js` | `favoriteIds`, `toggleFavorite`, `refresh` | Gerencia favoritos no Supabase respeitando RLS (usa `useUserData`) |
| `hooks/useReminders.js` | `remindersByEvent`, `hasRemindersForEvent`, `saveReminders`, `removeReminders`, `removeOneReminder`, `refresh` | Gerencia lembretes no Supabase (usa `useUserData`) |
| `hooks/useNotificationSettings.js` | `settings`, `saveSettings`, `refresh` | Gerencia configuracoes de notificacao (usa `useUserData`) |

## Padrões

### Listener de autenticação genérico

O hook `useUserData(fetchFn)` substitui o padrão repetitivo de `useEffect` + `onAuthStateChange` + `getSession` que existia em `useFavorites`, `useReminders` e `useNotificationSettings`. O hook cuida de:

1. Chamar `fetchFn(userId)` na montagem.
2. Escutar `onAuthStateChange` e reexecutar `fetchFn` sempre que o auth mudar.
3. Limpar o listener no desmonte.
4. Expor `{ refresh, loading }`.

Os hooks de domínio mantêm apenas a lógica de negócio (montar query, processar resposta).

### Persistência isolada

A lógica de salvar eventos (incluindo fotos e sessões) foi extraída do `EventFormPage` para `services/eventPersistence.js`. O componente chama `persistEvent({ form, sessionsToSave, eventId, isEdit, isDuplicate, user, photos, removedPhotoIds })` sem se preocupar com a implementação.

### Seam para testes

Todas as funções em `services/eventData.js` aceitam `{ supabase }` como último argumento (default = instância real). Isso permite injetar um mock em testes sem precisar de mocking global:

```js
const mockSupabase = { ... }
fetchAllEventsWithMeta({ supabase: mockSupabase })
```

### Constantes centralizadas

Query params (`URL_PARAMS`), labels de modalidade, estados brasileiros, offsets de lembrete e itens de navegação (`NAV_ITEMS`) vivem em `utils/constants.js`. Componentes e páginas importam as constantes em vez de strings soltas, eliminando inconsistências.

### Filtro de eventos unificado

O helper `filterEvents(events, filters, categories, options)` em `utils/filterEvents.js` substitui a lógica inline duplicada em `EventList`, `Favorites` e `PastEvents`. Aceita `{ excludePast, sortBy, sortDir }` para customizar comportamento.

## Decisões técnicas

- App standalone fora do UNO (ADR 0001) para protótipo sem mexer no codebase legado.
- Supabase como backend completo do protótipo (ADR 0002): PostgreSQL, Auth e Storage.
- Auth Supabase real (o ADR 0003 previa mockada): e-mail/senha com `signInWithPassword`,
  `signUp` (contas novas nascem `client`/`ROLE_VIEWER`) e recuperação de senha por
  link (`resetPasswordForEmail` → `/recuperar-senha`). Sem migração para o banco
  do UNO nesta fase.
- Todas as configurações do Supabase via CLI/migrations; zero Dashboard web.
- Tema MUI com paleta institucional azul/cinza e fonte Manrope.
- Dark mode: `ColorModeContext` (dentro de `AuthProvider`) expõe `{ mode, toggleColorMode }`. A preferência é salva no `localStorage` com chave `theme-mode:{email}`, isolada por usuário — cada conta tem o próprio tema, independente. O toggle fica no `Navbar`, acessível de qualquer página em mobile e desktop. O tema inicial também respeita `prefers-color-scheme` do sistema quando o usuário ainda não escolheu manualmente. O atributo `data-theme` no `<html>` é sincronizado por compatibilidade, mas o tema é 100% MUI (via `createAppTheme(mode)` + `CssBaseline`); não há mais `index.css` com variáveis CSS próprias.
- Eventos "Não definido" (`is_confirmed`): eventos cadastrados mas não
  confirmados ficam visíveis apenas para staff, em todas as listagens, com
  badge "A definir" e banner no detalhe. A visibilidade é garantida no banco
  via RLS (`is_staff()`), não só no frontend — clientes não leem por listagem,
  view ou URL direta. Formulário tem switch "A definir" com dialog de
  confirmação ao desconfirmar um evento já publicado; Gestão ganhou abas
  Confirmados/A definir. (ADR 0004.)
- Notificações com push real: subscribe via Web Push API (VAPID), subscription
  gravada em `push_subscriptions` (RPC `upsert_my_push_subscription`), envio
  server-side pela Edge Function `send-push`. Disparo **automático** pela Edge
  Function `notification-scheduler` agendada via `pg_cron` + `pg_net`
  (janela de ~1–2 min), que processa o outbox de eventos novos por categoria e
  os lembretes vencidos (`get_due_reminders`). Canal E-mail (no lembrete)
  ainda é só configuração salva — envio "em breve".
- Multi-categoria: eventos pertencem a várias categorias via tabela `event_categories` (M-N), sem categoria principal. Filtro de categoria casa se o evento tiver **qualquer** uma das selecionadas (`category_ids` incluído no enrich). Filtro por mais de uma categoria usa OR (não AND).
- Lembretes com offset livre e canal: o usuário digita qualquer antecedência (unidades Minuto, Hora, Dia, Semana, Mês; 1 mês = 30 dias = 43.200 min) e escolhe o canal por lembrete (Notificação push ou E-mail). O mesmo offset pode existir nos dois canais — o UNIQUE é `(user_id, event_id, offset_minutes, channel)`.
- Eventos Realizados por timestamp completo: `v_past_events`/`v_ongoing_events` comparam `(end_date + end_time) AT TIME ZONE 'America/Sao_Paulo'` com `now()`, não apenas a data. Eventos **sem nenhuma sessão** contam como Realizados (LEFT JOIN + `COUNT(s.id) = 0`).
- Filtros: busca (lupa) + limpar no cabecalho da listagem; categorias, modalidade e estado como dropdowns (Autocomplete com **type-to-search**, sem `readOnly`); chips Este mes, Proximo mes, Gratuito, Pago, Lema Edu e Data Personalizada como toggle. Em mobile, o painel de filtros é colapsado atrás de um botão "Filtros". Filtro de cidade removido (só estado como dropdown).
- Layout do EventDetail: botões (Voltar, favoritar, compartilhar) e badges ficam acima da imagem, sem sobreposição, para evitar miss-click.
- Lightbox: imagem do evento é clicável e abre em Dialog fullscreen com fundo escuro, `object-fit: contain` (sem corte) e navegação entre fotos.
- Navbar com `position: static` (sem Toolbar spacer). Espaçamento do conteúdo gerenciado pelo padding do `<main>` (`px: 2, pt: 1.5, pb: 2`).
- Roteamento com Data Router (`createBrowserRouter`): necessário para o `useBlocker` (confirmação ao sair com alterações não salvas) no formulário de eventos. Rotas definidas como array de configuração em vez de JSX.
- Redimensionamento de fotos no upload: imagens são redimensionadas para max 1200px (lado maior) e convertidas para JPEG 0.8 antes de enviar ao Supabase Storage, reduzindo de até 3MB para ~100-300KB.
- Categorias de notificação com opção "Todas": valor `['*']` no banco representa "todas as categorias", incluindo futuras; se o cliente seleciona categorias específicas, apenas aquelas são salvas.

## Notificações (push via Web Push API)

Fluxo completo de notificações push:

1. **Favoritar evento**: ao favoritar um evento pela primeira vez (sem
   lembretes salvos ainda), o `ReminderDialog` abre perguntando com quanta
   antecedência o usuário quer ser avisado. O usuário digita um valor
   numérico e escolhe a unidade (Minuto, Hora, Dia, Semana ou Mês — 1 mês =
   30 dias) e o canal (Notificação ou E-mail). O mesmo horário pode ser
   adicionado nos dois canais.
2. **Persistência**: cada lembrete é salvo como `{ offset_minutes, channel }`
   em `event_reminders` via Supabase SDK respeitando RLS (`user_id = auth.uid()`).
   Duplicatas (`user_id, event_id, offset_minutes, channel`) são ignoradas no upsert.
3. **Desfavoritar**: ao desfavoritar, os lembretes **não são removidos** —
   permanecem no banco para quando o usuário refavoritar.
4. **Configurações**: a tela `/configuracoes` permite:
   - Ativar/desativar notificações push **de verdade**: o toggle chama
     `Notification.requestPermission()` + `PushManager.subscribe()` com a chave
     pública VAPID e grava a subscription em `push_subscriptions`
     (`{ endpoint, p256dh, auth }`). Ao desativar, cancela a subscription e
     remove a linha.
   - Ativar/desativar notificação por email (placeholder, `email_enabled`).
   - Selecionar categorias de interesse (`categories_enabled` como `TEXT[]`).
   - Testar notificação local com `new Notification()`.
   - Visualizar, editar e remover lembretes ativos agrupados por evento
     (cada lembrete mostra offset formatado, ex. "3 dias antes · E-mail").
5. **Service worker (`src/sw.js`)**: listener de `push` mostra a notificação;
   `notificationclick` abre o evento (`/evento/:id`) ou a URL informada.
   Registros com `injectManifest` (Workbox) no build.
6. **Envio server-side**: Edge Function `send-push` (Deno + web-push) envia
   para `userIds` explícitos ou para todos os usuários com push ativo e
   categoria compatível (`eventCategoryIds`). Requer `Authorization: service_role`.

### Disparo automático

O envio é agendado de verdade: a Edge Function `notification-scheduler` roda a
cada minuto via `pg_cron` + `pg_net` e faz dois trabalhos — (1) eventos novos
confirmados por categoria (lê o outbox `notification_outbox` populado pelo
trigger `queue_new_event_notification` e chama `send-push` com `eventCategoryIds`)
e (2) lembretes push vencidos (RPC `get_due_reminders()`, janela de ~1 min antes
de `start_time`, registrados em `reminder_dispatch` para não reenviar). O job do
cron é registrado em deploy (não versionado) por exigir a service role key.
Canal **E-mail** do lembrete ainda não é enviado ("em breve").
Ver `push-notifications.md` para o runbook completo de ativação (VAPID keys,
deploy das functions, secrets e registro do job).

## Histórico de mudanças

- **2026-08-07** — Ajustes finos de UI no Painel Admin e nos lembretes:
  - **Gráficos centralizados no card**: os `BarChart` (Usuários e Favoritos)
    do `AdminDashboard` ganharam margem direita balanceada com a faixa do
    eixo Y (`margin.right: 65` ≈ `margin.left: 5` + `YAxis` de 60px). Antes,
    as barras ficavam deslocadas ~30px à direita do centro do card por causa
    da largura do eixo Y — o plot ocupava o lado direito e sobrava vazio à
    esquerda. Agora o plot fica centralizado (folgas de 72px de cada lado).
  - **Campo "Quantidade" sem spinners**: o `TextField` numérico do
    `ReminderDialog` esconde as setas +/− nativas do navegador com CSS
    escopado no próprio campo via `sx` (`::-webkit-inner-spin-button`/
    `::-webkit-outer-spin-button` com `WebkitAppearance: none` e
    `MozAppearance: textfield`). O valor continua sendo digitado direto no
    campo; os controles nativos de incremento não são mais exibidos.

- **2026-08-07** — Blindagem do signup contra clientes antigos:
  - Migration `20260807000001_harden_on_auth_user_created.sql` aplicada no
    remoto: o trigger `on_auth_user_created` agora sanitiza `user_type`/`role`
    do metadata do signup. Clientes com bundle antigo em cache ainda enviam
    `client`/`ROLE_DIRIGENTE`, que violava a `profiles_role_check` do novo
    modelo e fazia o `/auth/v1/signup` retornar 500 (`unexpected_failure`).
    Valores fora do modelo caem para `client`/`ROLE_VIEWER`.

- **2026-08-07** — Rodada de crítica (Impeccable) aplicada + recuperar senha:
  - **Guard "A definir" (P0)**: cliente RPPS não acessa evento não confirmado
    nem por URL direta — a consulta do `EventDetail` respeita a RLS e cai em
    "Evento não encontrado.".
  - **Acentos**: textos da UI com acentuação correta.
  - **Type-to-search nos filtros**: Autocomplete de categorias/estado sem
    `readOnly` (antes travava o teclado no celular).
  - **Retry de erro**: tentativa automática ao falhar carregamento.
  - **Labels e identidade**: rótulo padrão "Limpar Filtros", Login/SignUp/
    RecoverPassword passam a respeitar o `ColorModeContext` (antes Login fixo
    light), chip de filtro e raio de borda ajustados.
  - **Docs**: tipografia unificada em Manrope (removida a menção a Roboto);
    criados `DESIGN.md` e `.impeccable/design.json` como fonte da identidade
    visual (token do tema, cores, espaçamento).
  - **Recuperar senha**: dialog "Esqueci minha senha" no `Login`
    (`resetPasswordForEmail` com `redirectTo: /recuperar-senha`) + página
    `RecoverPassword.jsx` (troca o `code` por sessão e aplica a nova senha) +
    componente `PasswordToggle` (olho mostrar/ocultar senha).

- **2026-08-07** — Disparo automático de push (scheduler):
  - Migrations `20260806000003` a `20260806000008`: tabela `push_subscriptions`
    com RPC SECURITY DEFINER `upsert_my_push_subscription` (troca de conta no
    mesmo aparelho; fix de ambiguidade em `...0007`), outbox `notification_outbox`
    (eventos novos por categoria, populado pelo trigger
    `queue_new_event_notification`), `reminder_dispatch` (lembretes disparados
    por sessão, evita reenvio) e `get_due_reminders()`; extensões `pg_cron` e
    `pg_net`; coluna `result jsonb` para auditoria de entrega.
  - Edge Function `notification-scheduler` (agendada via cron, janela ~1–2 min)
    processa outbox e lembretes vencidos chamando `send-push`. Runbook completo
    em `push-notifications.md`.

- **2026-08-07** — Super Admin, Painel Admin e novo modelo de roles:
  - **Novo modelo de roles** (migration `20260807000000_super_admin_roles.sql`):
    `super_admin`/`ROLE_SUPER_ADMIN` (painel + usuários) | `staff`/`ROLE_ADMIN`
    (gerencia eventos/categorias) | `client`/`ROLE_VIEWER` (somente leitura).
    Contas legadas reclassificadas (staff → super_admin; client → ROLE_VIEWER);
    trigger de novo usuário passa a criar `ROLE_VIEWER`.
  - **RLS**: escrita de eventos/categorias/sessões/fotos/`event_categories`
    passa de `is_super_admin()` para `is_staff()` (tier staff), e
    `is_staff()` passa a considerar `user_type IN ('staff','super_admin')`.
    `is_super_admin()` (role) continua valendo para ler todos os `profiles`.
  - **Painel Admin** (`/admin`, rota protegida por `requireAdmin`):
    `AdminDashboard.jsx` com cards de totais (usuários/eventos/favoritos),
    gráficos mensais de crescimento (recharts) e gestão de usuários.
    RPC `admin_dashboard_stats()` (SECURITY DEFINER) devolve agregados
    cross-usuário; lista de usuários via `profiles` (RLS super admin).
  - **Edge Function `admin-users`**: valida o chamador como
    `ROLE_SUPER_ADMIN` e expõe `create` (nome/e-mail/senha/user_type,
    e-mail confirmado), `update`, `reset_password` e `delete` (service role).
    Cliente via `services/adminApi.js`.
  - **Alterar senha na Config**: card com senha atual/nova/confirmação
    (confere a atual com `signInWithPassword` e aplica `updateUser`).
    Título da página renomeado para "Configurações".
  - **Helpers de autorização**: `utils/auth.js` ganha `isStaffTier` e
    `isSuperAdmin`; `ProtectedRoute` ganha `requireAdmin`; nav (desktop e
    mobile) passa a exibir "Painel Admin" apenas para super admin.
  - Seed/scripts atualizados (`0012`, `seed.sql`, `seed-mock-users.mjs`) e
    novo `scripts/promote-super-admin.mjs`.

- **2026-08-07** — Login sem scroll/sem zoom, instalar como ícone e busca na gestão:
  - **Instalar como ícone no login**: novo componente `InstallAppIcon`
    substitui o botão "Instalar App" no `Login` — ícone de download no canto
    superior direito do card; instala via `beforeinstallprompt` ou abre modal
    com as instruções (iOS/desktop). O `InstallAppButton` continua na Config.
  - **Login centralizado e sem scroll**: card alinhado verticalmente
    (`100dvh` + flex center) com `overflow: hidden`, eliminando o scroll para
    alcançar os botões no mobile.
  - **Zoom desativado no mobile**: viewport meta em `index.html` com
    `maximum-scale=1.0, user-scalable=no`, valendo para o app inteiro.
  - **Busca na gestão**: `ManageEvents` ganha a barra "Buscar eventos"
    (título/descrição) com estado local, aplicada nas três abas (Confirmados,
    A definir, Realizados); empty state "Nenhum evento encontrado." quando a
    busca não retorna resultados.

- **2026-08-06** — Editar no detalhe, gestão com abas e push real:
  - **Lápis de editar para staff**: `EventDetail` mostra um `IconButton` de
    editar quando `profile.user_type === 'staff'`, navegando para
    `/gestao/:id/editar`.
  - **Aba "Realizados" na gestão**: `ManageEvents` ganha a aba "Realizados"
    (eventos passados, via `v_past_events`, desconsiderando `is_confirmed`).
    As abas agora são Confirmados (confirmados e não-passados) | A Definir
    (não confirmados e não-passados) | Realizados. Badge "Realizado" nos cards.
  - **Botão "Instalar App"**: `usePWAInstall` captura `beforeinstallprompt`.
    Botão compartilhado `InstallAppButton` no `Login` e na `Config`. Oculto
    quando já instalado; no iOS orienta a usar "Adicionar à Tela de Início".
  - **Push real (Web Push API)**: service worker customizado
    `src/sw.js` (`strategies: injectManifest`) com listeners `push` e
    `notificationclick`; hook `usePushNotifications` assina
    (`PushManager.subscribe` com VAPID) e grava em `push_subscriptions`
    (RLS por usuário); o toggle da Config inscreve/desinscreve de verdade;
    Edge Function `send-push` (Deno + web-push) envia por `userIds` ou por
    categorias. Runbook em `push-notifications.md` e env `VITE_VAPID_PUBLIC_KEY`.

- **2026-08-06** — Ícone do PWA, placeholder de eventos e manifest:
  - Migration `20260806000002_events_show_placeholder.sql`: `event_photos`
    limpo para que **todos** os eventos exibam o novo `public/placeholder-event.png`.
  - Cache-buster `?v=2` nas URLs de fallback (`EventCard`, `EventDetail`,
    `PhotoUploader`); placeholder excluído do precache e do cache de imagens
    do service worker (troca futura do arquivo reflete sem limpar cache).
  - Manifest do PWA apontado para o ícone oficial
    `public/android-chrome-192x192.png` e `public/android-chrome-512x512.png`
    (`purpose: any`); pasta órfã `public/icons/*` e `public/site.webmanifest`
    removidos; manifest ganhou `id: "/"` e `lang: "pt-BR"`; link
    `<apple-touch-icon>` adicionado no `index.html`.

- **2026-08-06** — Filtro de data personalizada, logo na navbar e Criar Conta:
  - **Filtro de data personalizada** na seção Eventos: chip "Data Personalizada"
    (último da fileira, após Próximo mês) abre um `Popover` com Data início /
    Data fim e botões Confirmar/Cancelar. As datas só vão para a URL ao
    confirmar (`?data-inicio=...&data-fim=...`); cancelar descarta. O chip
    destaca quando um intervalo está aplicado. Filtro aceita range completo
    ou **parcial** (só início = "a partir desta data"; só fim = "até esta
    data") via `utils/dateFilters.js` (`eventMatchesDateRange`) e
    `filterEvents.js`. Chips reordenados para Lema Edu | Gratuito | Pago |
    Este mes | Proximo mes | Data Personalizada. Testes novos em
    `tests/events.test.js` (4 casos de range).
  - **Logo na navbar**: favicon 32×32 ao lado esquerdo de "Radar Lema" no
    `Navbar`; o conjunto (ícone + nome) é clicável e volta para a home.
  - **Criar Conta**: nova rota `/criar-conta` (`pages/SignUp.jsx`) com nome,
    e-mail, senha e confirmar senha; `AuthContext.signUp` usa
    `supabase.auth.signUp` com metadados `client`/`ROLE_DIRIGENTE` (o trigger
    cria o `profiles`); contas nascem como `client` e o PO altera para `staff`
    manualmente no Supabase. Botão "Criar Conta" no `Login`; confirmação de
    e-mail desativada no Supabase para o cadastro logar direto.

- **2026-08-06** — Feature "Não definido" (ADR 0004):
  - Migration `20260806000001_add_is_confirmed.sql`: coluna `events.is_confirmed`
    (`NOT NULL DEFAULT true`), helper `public.is_staff()` (qualquer
    `user_type = 'staff'`) e política `events_select` → `USING (is_confirmed = true
    OR public.is_staff())`. Views herdam por `SECURITY INVOKER`.
  - Formulário: `Switch` "A definir" (default desmarcado) na seção Identificação;
    dialog de confirmação ao marcar num evento já confirmado (não na duplicação).
    `eventPersistence` salva `is_confirmed: !form.is_tentative`.
  - Campos obrigatórios relaxados quando "A definir": apenas título (e
    recorrência, se ativa) são exigidos; atributos `required` do formulário
    condicionais a `!form.is_tentative`. Ao confirmar, a validação volta a
    exigir todos os campos.
  - Gestão: abas "Confirmados"/"A definir" com badge de contagem e chip no card.
  - Badge "A definir" (cor warning) no `EventCard`; banner no topo do `EventDetail`
    para staff.
  - Testes: `tests/eventPersistence.test.js` (mapeamento `is_confirmed`),
    `tests/eventForm.test.js` (validação com `is_tentative`) e passthrough em
    `tests/events.test.js`. 53 testes passando; lint e build limpos.

- **2026-08-03** — Botão "Limpar Filtros" compacto e toasts de 3s:
  - Novo componente compartilhado `ClearFiltersButton` (fonte 0.75rem, padding
    reduzido, ícone 16px, `minWidth: auto`) substituindo os botões duplicados
    em `EventList`, `Favorites` e `PastEvents`.
  - Todos os Snackbars (`ReminderDialog`, `EventCard`, `ManageEvents`)
    padronizados em `autoHideDuration={3000}` com botão de fechar ("x" via
    `CloseIcon`) para descartar sem esperar o timer.

- **2026-08-03** — Melhorias de filtros, categorias e lembretes:
  - **Multi-categoria**: tabela `event_categories` (M-N) via migration 0017
    (`20260803000001_multi_category.sql`), backfill das categorias existentes e
    remoção de `events.category_id`. `enrichEvents` passou a popular
    `category_ids`; formulário usa Autocomplete multiple (validação "Selecione
    pelo menos uma categoria."); detalhe e gestão exibem chips; filtro casa por
    `category_ids` (OR entre categorias). `saveCategories` em
    `services/eventPersistence.js`.
  - **Limpar Filtros**: botão com rótulo "Limpar Filtros" + ícone e
    `disabled={!hasFilters}` nas páginas Eventos, Favoritos e Realizados
    (substituiu o IconButton sem rótulo).
  - **Lembretes com offset livre + canal** (migration 0018):
    `event_reminders` agora aceita qualquer `offset_minutes > 0` e tem coluna
    `channel` (`push`/`email`); UNIQUE passou a `(user_id, event_id, offset_minutes, channel)`.
    `ReminderDialog` reescrito com input numérico, unidades (Minuto/Hora/Dia/
    Semana/Mês, 1 mês = 30 dias) com pluralização e sufixo "antes", e canal por
    lembrete. `useReminders` trabalha com `{ offset_minutes, channel }` e
    `ignoreDuplicates`; `Settings` lista/edita lembretes com offset formatado.
  - **Eventos Realizados por timestamp** (migration 0019): `v_past_events`/
    `v_ongoing_events` comparam `(end_date + end_time) AT TIME ZONE
    'America/Sao_Paulo'` com `now()`; eventos sem sessões contam como
    Realizados (LEFT JOIN + `COUNT(s.id) = 0`).
  - Testes `tests/events.test.js` ampliados; 39 testes passando; lint e build
    limpos. Migrations aplicadas no Supabase (projeto `vrvyfgneawtceebyagak`).

- **2026-08-07** — Redesign de navegação: no desktop, `Categorias` e `Gestão` agrupados num contêiner com borda `primary.light` (raio 12px, fundo translúcido) e `Painel Admin` com fundo azul claro (`primary.light` com alpha) + borda branca; divisor cinza removido e rótulos com `whiteSpace: nowrap`. No mobile, `BottomNav` removida e substituída por hambúrguer na AppBar que abre um `Drawer` lateral com as mesmas seções (ícones + rótulo), separadas por `Divider` entre os grupos client/staff/admin, item ativo destacado, toggle de tema e Sair/Entrar no rodapé. `NAV_ITEMS` ganha `group: 'staff'`. `App.jsx` perde o `pb` reservado à barra fixa.

- **2026-07-13** — Login sempre em light mode: página `Login.jsx` envolvida por `ThemeProvider` local com `createAppTheme('light')` e `CssBaseline`, ignorando o tema global salvo pelo usuário.

- **2026-07-13** — Filtro e marcação "Lema Edu": nova coluna `is_lema_edu` na tabela `events` (migration aplicada via Supabase CLI), toggle no formulário de evento, chip destacado na página de listagem (primeiro na fila, com borda azul, shimmer adaptado ao tema e texto branco no dark / preto no light), filtro aplicado em `filterEvents.js` e repassado pelo `EventList`, e badge "Lema Edu" nos cards e na tela de detalhe. Views `v_past_events` e `v_ongoing_events` recriadas para expor a nova coluna.

- **2026-07-13** — Ajustes na navegação mobile: label "Configurações" encurtado para "Config" na `BottomNav`; ícone de "Gestão" alterado de `Settings` para `ManageAccounts` para diferenciar de "Config"; ordem dos itens de staff reorganizada para `Eventos | Favoritos | Realizados | Config | Categorias | Gestão`.

- **2026-07-13** — Dark mode no mobile: toggle de tema movido do `EventList` para o `Navbar`, visível em todas as páginas e breakpoints. `ColorModeContext` passa a detectar `prefers-color-scheme` na inicialização e a sincronizar o atributo `data-theme` no `<html>`. `index.css` passa a usar `[data-theme='dark']` em vez de `prefers-color-scheme`, unificando a aparência de componentes MUI e CSS puro no mobile e desktop.

- **2026-07-09** — Fase 1 — Setup e Auth concluída: scaffold Vite + React 18,
  dependências, ESLint, Prettier, tema UNO, Supabase CLI linkado, migrations
  0001-0013 aplicadas, seed.sql, autenticação mockada, login, navegação
  condicional, rotas protegidas e architecture.md criado.
- **2026-07-09** — Fase 2 — Listagem e Detalhe concluída: `EventList` com
  filtros na URL e paginação, `EventCard` responsivo, `EventFilters`,
  `EventDetail` com carrossel de fotos, sessões, mapa embed, compartilhamento
  e favoritar (visual), `MapEmbed`, `utils/formatters.js` e testes
  `formatters.test.js`.
- **2026-07-09** — Fase 3 — Favoritos e Realizados concluída: persistencia de
  favoritos via `useFavorites` e Supabase SDK (RLS `user_id = auth.uid()`),
  toggle com snackbar no `EventCard` e `EventDetail`, paginas `Favorites`
  (com empty state) e `PastEvents` (usando `v_past_events`), reaproveitamento
  de `EventFilters` e `EventCard`, helper `utils/events.js` e teste
  `favorites.test.jsx`. App tornou-se fechado: qualquer rota protegida
  redireciona para `/login` quando o usuario nao esta autenticado.
- **2026-07-09** — Fase 4 — Gestao de Eventos (staff) concluida: paginas
  `ManageEvents`, `EventFormPage` e `Categories`, componentes `SessionEditor`,
  `RecurrenceEditor` e `PhotoUploader`, utilitario `utils/recurrence.js` com
  testes `tests/recurrence.test.js`. Staff pode criar, editar, duplicar e
  excluir eventos; upload de fotos para o bucket `event-photos`; geracao de
  sessoes recorrentes semanais, quinzenais ou mensais; CRUD de categorias.
- **2026-07-09** — Fase 5 — PWA e Deploy concluida: configuracao do
  `vite-plugin-pwa` com manifest, service worker e shell offline; icones
  PWA em `public/icons/`; `vercel.json` com SPA fallback e headers de cache;
  projeto pronto para demo.
- **2026-07-09** — Correcoes pos-Fase 5: migration 0014 renomeando coluna
  `order` para `sort_order` (palavra reservada do PostgREST), ajuste do seed
  e de todos os pontos do frontend; novo `public/placeholder-event.png`;
  refatoracao do `EventFilters` com botao "Mais filtros" em Popover e chips
  toggle de data; helper `utils/dateFilters.js`; aviso de resolucao baixa no
  `PhotoUploader`; `BottomNav` visivel apenas no mobile.
- **2026-07-09** — Feature de notificações (demo) — UI + persistência, sem
  push real. Popup ao favoritar, tela de Configurações, teste de notificação
  local. Migration 0015: tabelas `event_reminders` e `notification_settings`.
  Hooks `useReminders`, `useNotificationSettings`. Componentes `ReminderDialog`
  e `Settings`. Rota `/configuracoes`. Navbar e BottomNav com acesso.
- **2026-07-09** — Lightbox: imagem do evento clicável abre fullscreen com
  zoom e navegação entre fotos. Botões e badges movidos para fora da imagem
  (sem sobreposição). Toolbar spacer removido do App.jsx, padding do main
  ajustado. BottomNav responsiva com minWidth 0 e label ellipsis para evitar
  corte em telas estreitas.
- **2026-07-09** — Filtros: busca e limpar no cabecalho da listagem; dropdowns
  sempre visiveis (categorias, modalidade, estado); chips toggle (Este mes,
  Proximo mes, Gratuito, Pago). Autocomplete readonly. Filtro cidade removido.
- **2026-07-09** — Refactoring de arquitetura: criação do hook genérico
  `useUserData`, deduplicação de `emptySession` em `utils/eventForm.js`,
  extração de persistência para `services/eventPersistence.js`,
  seam `deps.supabase` em `services/eventData.js`, centralização de
  constantes em `utils/constants.js`, unificação de filtros em
  `utils/filterEvents.js`, helper `utils/auth.js`, remoção de
  `user_type`/`role` do `AuthContext` (acesso via `profile`).
  Todas as páginas refatoradas para usar os novos serviços e utilitários.
- **2026-07-09** — Impeccable crítica 1 + 5 correções: Product identity
  (`PRODUCT.md`), EventFormPage em seções Paper com SectionHeader + sticky
  save + scroll-to-error, useBlocker + beforeunload, busca persistente
  TextField (substituiu Popover), feedback de sucesso via router state,
  Dialog confirmação "Remover todos" no Settings.
- **2026-07-09** — Impeccable crítica 2 + 4 correções: sticky bar useRef
  (eliminou `document.querySelector`), Snackbar de exclusão em ManageEvents,
  acentos em ~30 palavras em 12 arquivos + copy clara em recorrência,
  Navbar active state com `startsWith` + underline + `fontWeight`, e
  SectionHeader com `component="h2"` (acessibilidade).
- **2026-07-09** — Logout mobile: ícone `LogoutIcon` na Navbar visível
  apenas em breakpoint `xs`, com variante `LoginIcon` para usuários
  não autenticados.
- **2026-07-09** — Correção de roteamento: migração de `<BrowserRouter>` para
  `createBrowserRouter` (Data Router) para suportar `useBlocker` no formulário
  de eventos. Rotas definidas como array de configuração em `App.jsx`.
- **2026-07-09** — Duas correções no formulário de eventos: (1) falso aviso de
  alterações não salvas após salvar (adicionado `setTimeout` no `navigate`);
  (2) ordenação automática de sessões removida do `SessionEditor` para não
  atrapalhar edição.
- **2026-07-09** — Settings reformulado: "Avisos" → "Configurações" no mobile
  com ícone de engrenagem; seção push desabilitada quando toggle off;
  "Receber por email" substituído por "Notificar novos eventos"; botão
  "Testar notificação" movido para dentro do card push; categorias com opção
  "Todas" (exclusiva) e pré-selecionada por padrão.
- **2026-07-09** — Performance: redimensionamento de fotos no upload (max
  1200px, JPEG 0.8), `loading="lazy"` nas imagens de capa e carrossel,
  placeholder cinza para evitar layout shift, upload paralelo de fotos,
  pré-loading de imagens adjacentes no carrossel, skeleton cards nas listas
  (EventList, PastEvents, Favorites).
- **2026-07-10** — Dark mode: `ColorModeContext` com alternância sol/lua na
  página de eventos. Preferência salva por usuário em `localStorage` com chave
  `theme-mode:{email}`. Tema MUI dinâmico via `createAppTheme(mode)` com
  fundo `#0f172a` em dark mode. Provider reorganizado: `AuthProvider` →
  `ColorModeProvider` → `ThemeProvider`.
