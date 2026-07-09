# Architecture — Lema Discovery

## Visão geral

O Lema Discovery é um PWA standalone para centralizar eventos do ecossistema RPPS
(comitês, workshops, lives, palestras, congressos etc.). Nesta fase, o protótipo
conta com autenticação mockada no Supabase, navegação condicional por tipo de
usuário (staff Lema vs. cliente RPPS) e estrutura base para listagem, detalhe,
favoritos, eventos realizados e gestão de eventos/categorias.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 18 + Material UI v7 |
| Roteamento | react-router-dom v6 |
| Tipografia | Manrope + Roboto (Google Fonts) |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| Supabase IaC | `supabase` CLI (migrations + seed, zero Dashboard) |
| PWA | `vite-plugin-pwa` + Workbox (manifest, service worker, shell offline) |
| Lint | ESLint (`eslint:recommended` + `react` + `react-hooks`) |
| Format | Prettier |
| Testes | Vitest + Testing Library |

## Estrutura de pastas

```
lema-discovery/
├── CONTEXT.md
├── PLAN.md
├── architecture.md
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
│   │   ├── 0009_views.sql
│   │   ├── 0010_storage_bucket.sql
│   │   ├── 0011_seed_categories.sql
│   │   ├── 0012_seed_mock_users.sql
│   │   └── 0013_seed_sample_events.sql
│   └── seed.sql
├── scripts/
│   └── seed-mock-users.mjs
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-192x192-maskable.png
│       ├── icon-512x512.png
│       └── icon-512x512-maskable.png
├── vercel.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── theme/
│   │   └── theme.js
│   ├── lib/
│   │   └── supabase.js
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   └── useFavorites.js
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── EventCard.jsx
│   │   ├── EventFilters.jsx
│   │   ├── MapEmbed.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SessionEditor.jsx
│   │   ├── RecurrenceEditor.jsx
│   │   └── PhotoUploader.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── EventList.jsx
│   │   ├── EventDetail.jsx
│   │   ├── Favorites.jsx
│   │   ├── PastEvents.jsx
│   │   ├── ManageEvents.jsx
│   │   ├── EventFormPage.jsx
│   │   └── Categories.jsx
│   └── utils/
│       ├── events.js
│       ├── formatters.js
│       └── recurrence.js
├── tests/
│   ├── setup.js
│   ├── AuthContext.test.jsx
│   ├── formatters.test.js
│   ├── favorites.test.jsx
│   └── recurrence.test.js
├── .env.local
├── .eslintrc.cjs
├── .prettierrc
├── package.json
└── vite.config.js
```

## Schema do banco

O schema segue o `PLAN.md`:

- `profiles`: espelha `auth.users` com `user_type` (staff/client) e `role` do UNO.
- `categories`: tipos de evento (lista fixa gerenciável).
- `events`: agregado principal com modalidade, valor, endereço, recorrência etc.
- `event_sessions`: datas/horários de cada evento.
- `event_photos`: fotos de capa/carrossel com URL pública estática.
- `favorites`: eventos salvos por usuário (`UNIQUE(user_id, event_id)`).
- Views `v_past_events` e `v_ongoing_events`.
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

## RLS

Todas as tabelas têm RLS habilitado:

- `profiles`: usuário lê próprio perfil; staff (`ROLE_SUPER_ADMIN`) lê todos.
- `categories`, `events`, `event_sessions`, `event_photos`: leitura pública;
  escrita apenas `ROLE_SUPER_ADMIN`.
- `favorites`: isolado por `user_id = auth.uid()`.
- Storage `event-photos`: leitura pública; escrita apenas autenticado.

## Auth

- Dois usuários mockados:
  - `admin@lema.com` / `lema123` → staff, `ROLE_SUPER_ADMIN`.
  - `dirigente@lema.com` / `lema123` → client, `ROLE_DIRIGENTE`.
- A migration `0012_seed_mock_users.sql` tenta inserir via SQL em `auth.users`,
  `auth.identities` e `profiles` (funciona em `supabase db reset` local).
- No Supabase cloud, o insert direto em `auth.users` não é suficiente para o
  GoTruth; use `node scripts/seed-mock-users.mjs` após o push.
- Frontend usa `supabase.auth.signInWithPassword`.
- `AuthContext` expõe `{ user, profile, user_type, role, loading, signIn, signOut }`
  e carrega o perfil de `profiles` após login.

## Componentes

| Componente | Responsabilidade | Onde usado |
|---|---|---|
| `AuthContext` | Estado de autenticação e perfil | Envolve toda a app |
| `ProtectedRoute` | Protege rotas por autenticação e/ou staff | `App.jsx` |
| `Navbar` | Navegação desktop com abas condicionais | `App.jsx` |
| `BottomNav` | Navegação mobile com abas condicionais | `App.jsx` |
| `Login` | Formulário de login | Rota `/login` |
| `EventList` | Lista de eventos com filtros e paginacao | Rota `/` |
| `EventCard` | Card de evento com capa, titulo, datas, valor e badges | `EventList`, `Favorites`, `PastEvents` |
| `EventFilters` | Filtros de busca, categoria, modalidade, valor, cidade, UF e data | `EventList` |
| `EventDetail` | Detalhe do evento com carrossel, sessoes, mapa e acoes | Rota `/evento/:id` |
| `MapEmbed` | Embed do Google Maps a partir de endereco em texto | `EventDetail` |
| `Favorites` | Lista de eventos favoritados pelo usuario logado | Rota `/favoritos` |
| `PastEvents` | Lista de eventos realizados (`v_past_events`) | Rota `/realizados` |
| `useFavorites` | Hook para carregar e alternar favoritos via Supabase SDK | `EventList`, `EventDetail`, `Favorites`, `PastEvents` |
| `ManageEvents` | Lista de eventos com ações editar/duplicar/excluir | Rota `/gestao` |
| `EventFormPage` | Formulário de criar/editar/duplicar evento | Rotas `/gestao/novo` e `/gestao/:id/editar` |
| `Categories` | CRUD de categorias | Rota `/categorias` |
| `SessionEditor` | CRUD de sessões (data/horário início/fim) | `EventFormPage` |
| `RecurrenceEditor` | Toggle, frequência e data fim da recorrência | `EventFormPage` |
| `PhotoUploader` | Upload/remove de fotos com limite 5 fotos/3MB | `EventFormPage` |

## Rotas

| Path | Componente | Permissão |
|---|---|---|
| `/login` | `Login` | Pública; usuarios logados sao redirecionados para `/` |
| `/` | `EventList` | Autenticado; aceita query params para filtros |
| `/evento/:id` | `EventDetail` | Autenticado |
| `/favoritos` | `Favorites` | Autenticado |
| `/realizados` | `PastEvents` | Autenticado |
| `/gestao` | `ManageEvents` | Staff (`ROLE_SUPER_ADMIN`) |
| `/gestao/novo` | `EventFormPage` | Staff |
| `/gestao/:id/editar` | `EventFormPage` | Staff |
| `/categorias` | `Categories` | Staff |

## PWA

O `vite-plugin-pwa` gera o manifest e o service worker no build:

- **Manifest**: `manifest.webmanifest` com `name: "Lema Discovery"`, `short_name: "Lema"`,
  `theme_color: #1976d2`, `background_color: #ffffff`, `display: standalone`,
  `start_url: /` e icones 192/512px (com versoes `maskable`).
- **Icones**: gerados em `public/icons/` a partir da letra "L" sobre fundo azul
  institucional (#1976d2).
- **Workbox**:
  - Precache do shell: `**/*.{js,css,html,svg,png,woff2}`.
  - `navigateFallback: 'index.html'` para SPA fallback offline.
  - `runtimeCaching`:
    - Fontes do Google (stylesheets + webfonts): `CacheFirst`.
    - Imagens locais da aplicacao: `StaleWhileRevalidate`.
    - **Nao ha cache para chamadas do Supabase nem fotos externas** — dados
      continuam exigindo rede, conforme restricao do prototipo.
- **Testes**: em `localhost` (ou HTTPS), o Chrome exibe o botao "Instalar".
  DevTools > Application > Manifest e Service Workers devem mostrar o app
  registrado sem erros. Ao desligar a rede, o shell carrega, mas listagem e
  detalhe de eventos ficam em empty state/erro por falta de dados.

## Deploy

Deploy de demonstracao na **Vercel** (configurado via `vercel.json`):

- `framework`: Vite
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- SPA fallback: todas as rotas apontam para `index.html`.
- Headers de cache para assets hashed, icones e manifest.

### Como fazer deploy manual pelo dashboard Vercel

1. Faca push do repo para `https://github.com/bielfernandes-projects/lema-discovery`.
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
   `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CLI_TOKEN`
   e, opcionalmente, `VITE_GOOGLE_MAPS_API_KEY` para exibir o mapa embed.
3. `supabase login`
4. `supabase link --project-ref puqirnuxmrrvwtkqrneh`
5. `supabase db push` (aplica migrations no remoto)
6. `node scripts/seed-mock-users.mjs` (cria usuarios mock no Supabase cloud)
7. `npm run dev` (abre http://localhost:5173)

> Nota: `supabase db reset` exige Docker Desktop. Sem Docker, use `supabase db push`
> seguido de `node scripts/seed-mock-users.mjs`.

## Como testar

- `npm run test:run` — roda suite Vitest (smoke test do AuthContext).
- `npm run lint` — verifica ESLint.
- `npm run build` — compila para producao.
- Acesso a qualquer rota (incluindo `/`, `/evento/:id`, `/realizados`, `/favoritos`)
  sem login redireciona para `/login`.
- Login com `admin@lema.com` / `lema123` redireciona para `/` e mostra abas de
  staff (Gestão, Categorias).
- Login com `dirigente@lema.com` / `lema123` redireciona para `/` e não mostra
  Gestão nem Categorias.
- Clicar em **Sair** redireciona para `/login`.
- `/gestao` logado como dirigente redireciona para `/`.

## Utils

| Arquivo | Funcoes | Uso |
|---|---|---|
| `utils/formatters.js` | `formatCurrency`, `formatPrice`, `formatDateRange`, `formatModality`, `formatSessionTime` | Cards, detalhe, sessoes e testes |
| `utils/events.js` | `enrichEvents` | Adiciona capa, datas min/max, status e proxima sessao aos eventos brutos |
| `utils/recurrence.js` | `generateRecurringSessions` | Gera sessoes semanais, quinzenais ou mensais a partir de uma sessao base |
| `hooks/useFavorites.js` | `favoriteIds`, `toggleFavorite`, `refresh` | Gerencia favoritos no Supabase respeitando RLS |

## Decisões técnicas

- App standalone fora do UNO (ADR 0001) para protótipo sem mexer no codebase legado.
- Supabase como backend completo do protótipo (ADR 0002): PostgreSQL, Auth e Storage.
- Auth mockada no Supabase (ADR 0003): futuramente migra para leitura do banco do UNO.
- Todas as configurações do Supabase via CLI/migrations; zero Dashboard web.
- Tema MUI com paleta institucional azul/cinza e fontes Manrope + Roboto.

## Histórico de mudanças

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
