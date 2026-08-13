# Radar Lema — Plano de Endurecimento de Segurança

## Resumo Executivo

Checkup completo de segurança realizado via skills `security-best-practices` e `security-review`
(OWASP-aligned). App é PWA React+Vite (Vercel) + Supabase (Postgres RLS, Auth, Storage, Edge
Functions). Bases saudáveis confirmadas: **RLS habilitada em todas as tabelas**, ownership correto
em favorites/reminders/settings/push_subscriptions, upload re-encode JPEG, zero sinks de XSS
clássicos (`dangerouslySetInnerHTML`/`innerHTML`/`eval`), e **nenhum segredo commitado no git**
(histórico de 45 commits verificado via `git log -S`).

Foram encontrados **1 CRÍTICO, 3 HIGH, ~7 MEDIUM/LOW**. Planos prontos para execução abaixo.

---

## Achados e correções

### CRÍTICO

#### SEC-001 — Escalada de privilégio: signup vira `super_admin` via metadata
`supabase/migrations/20260807000001_harden_on_auth_user_created.sql:19-25`

O trigger valida `user_type`/`role` do metadata apenas contra uma **whitelist** que inclui
`super_admin`/`ROLE_SUPER_ADMIN`. Qualquer atacante envia `user_metadata
{ user_type:'super_admin', role:'ROLE_SUPER_ADMIN' }` direto no `/auth/v1/signup` e nasce com
acesso total (Painel Admin, gestão de usuários, escrita).

**Fix (migration `20260810000001_force_client_on_signup.sql`):** reescrever
`public.on_auth_user_created()` para **ignorar** metadata de role e gravar sempre
`user_type='client', role='ROLE_VIEWER'`. A escalada passa a ser feita apenas pela Edge Function
`admin-users` (que valida o chamador como ROLE_SUPER_ADMIN e faz upsert do perfil com service_role).

```sql
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'client',
    'ROLE_VIEWER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### HIGH

#### SEC-002 — Bypass de RLS nos views: eventos "A definir" vazam pela API REST
`0009_views.sql`, `20260713150000_add_is_lema_edu.sql`, `20260803000003_fix_past_views.sql`

Views `v_past_events` / `v_ongoing_events` foram criadas **sem `security_invoker = true`** → rodam
como dono (postgres), ignorando RLS da tabela `events`. A migration `20260806000001` afirma
"nem pelas views (SECURITY INVOKER)" mas isso nunca foi implementado. Com a anon key (pública) é
possível `GET /rest/v1/v_past_events` e enumerar eventos não confirmados ("A definir").

**Fix (migration `20260810000002_views_security_invoker.sql`):** recriar os dois views com
`WITH (security_invoker = true)` e `SET search_path` implícito.

```sql
DROP VIEW IF EXISTS public.v_past_events CASCADE;
CREATE VIEW public.v_past_events
WITH (security_invoker = true) AS
SELECT e.*, MAX(s.end_date) AS last_end_date
FROM public.events e
LEFT JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING MAX((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo') < now()
    OR COUNT(s.id) = 0;

DROP VIEW IF EXISTS public.v_ongoing_events CASCADE;
CREATE VIEW public.v_ongoing_events
WITH (security_invoker = true) AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' < now())
   AND BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' >= now());
```

A política `events_select` (`is_confirmed = true OR is_staff()`) passará a ser aplicada também
via views.

#### SEC-003 — Stored XSS via `event.url` (esquema `javascript:`)
`src/pages/EventDetail.jsx:329` renderiza `href={event.url}`; validação
`src/utils/eventForm.js:69` só checa não-vazio; salvo cru em `eventPersistence.js:119`.

**Fixes:**
1. Front: util `src/utils/safeUrl.js` — normaliza/valida esquema `http`/`https`;
   aplicado em `EventDetail.jsx` (`href={safeUrl(event.url)}`).
2. Validação: `src/utils/eventForm.js` — em `validate()`, rejeitar URL sem esquema http(s).
3. Persistência: `src/services/eventPersistence.js` — sanitizar `url` antes de salvar.
4. Banco: migration `20260810000003_events_url_check.sql` adiciona CHECK/bloqueio de esquema.

```sql
ALTER TABLE public.events
  ADD CONSTRAINT chk_events_url_http_s
  CHECK (url IS NULL OR url ~* '^https?://');

CREATE OR REPLACE FUNCTION public.require_safe_event_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.url IS NOT NULL AND NEW.url !~* '^https?://' THEN
    RAISE EXCEPTION 'url do evento deve começar com http:// ou https://';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_event_url_safe ON public.events;
CREATE TRIGGER trg_event_url_safe
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.require_safe_event_url();
```

#### SEC-004 — Service_role como "senha" de endpoints públicos + broadcast global
`functions/notification-scheduler/index.ts:51-53`, `functions/send-push/index.ts:46-48`,
`config.toml` (`verify_jwt=false`).

A chave service_role fica em plaintext no job do cron (`push-notifications.md`) e roda em
requests públicos. `send-push` sem `userIds`/`categories` **notifica todos**.

**Fixes:**
- `send-push/index.ts`: exigir `userIds` **ou** `eventCategoryIds` (rejeitar broadcast), cap de
  destinatários (ex.: 5000) e validação de UUIDs; manter auth por service_role mas adicionar
  rejeição de corpo sem alvo.
- `notification-scheduler/index.ts`: adicionar idempotência (guard por `dispatched_at` já existe)
  e limitar concorrência; reter `verify_jwt=false` documentado como decisão (cron interno),
  mitigado pela exigência de alvo no send-push.
- Documentar rotação da chave para não quebrar o job do cron (comando `cron.unschedule/schedule`).

---

### MEDIUM / LOW

| ID | Achado | Correção |
|---|---|---|
| **SEC-005** | Conta `admin@lema.com`/`lema123` (super_admin) em migration+seed+script cloud | Migration `20260810000004_remove_mock_users.sql` deleta mock users; scripts ganham guarda de ambiente local |
| **SEC-006** | Sessão JWT (refresh) em `localStorage` (default supabase-js) | Avaliar storage custom `sessionStorage`/memória; pelo menos não logar tokens |
| **SEC-007** | Sem CSP / headers de segurança no Vercel | `vercel.json`: headers `Content-Security-Policy` (report-only em 1ª fase), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors` |
| **SEC-008** | Sem rate-limit em `admin-users`; senha mínima 6 chars | `admin-users/index.ts`: senha 12+ com complexidade e limite de tentativas in-memory simples |
| **SEC-009** | Dependências: 5 high, 2 moderate | `npm audit fix` + bump manual de react-router-dom p/ ≥7.18 (open redirect) |
| **SEC-010** | `.env.local` com creds vivas sincronizado no OneDrive | Rotação de service_role/access_token/Vercel OIDC + mover chaves p/ fora do OneDrive |
| **SEC-011** | Storage: qualquer autenticado upa no bucket | Migration: política de INSERT restrita a staff via RLS |
| **SEC-012** | `upsert_my_push_subscription` (SECURITY DEFINER) deleta linha de outro user | Migration: conferir ownership antes do DELETE do endpoint |
| **SEC-013** | `admin-users` CORS `*`; `url` do push navega origem externa | CORS específico p/ origins Vercel; `sw.js` resolve URL somente same-origin |

---

## Roteiro de execução (ordem)

Fase 1 — Crítico + High (bloqueantes p/ 300 clientes):
1. Migration SEC-001 (trigger client).
2. Migration SEC-002 (views security_invoker).
3. Migration SEC-003 (CHECK/trigger URL) + safeUrl no front.
4. Migration SEC-005 (remove mock users cloud).
5. Fix send-push/scheduler (SEC-004).
6. `supabase db push` (ou instrução para o usuário).

Fase 2 — Medium/Low:
7. CSP/headers no vercel.json.
8. admin-users: senha forte + CORS.
9. storage RLS + upsert push fix.
10. npm audit fix.
11. sw.js same-origin.

Fase 3 — Operacional:
12. Roteação de credenciais (Supabase Dashboard + Vercel) — requer ação manual do usuário.
13. Mover .env.local para fora do OneDrive.
14. Rodar `npm run lint`, `npm run test:run`, `npm run build`.

## Riscos/regressões a monitorar
- Trigger `on_auth_user_created` ignora metadata → confirmar que `admin-users` (upsert service_role) segue criando staff/super_admin.
- `security_invoker` em views pode afetar queries do `ManageEvents.jsx`/AdminDashboard (staff). Testar.
- CSP report-only primeiro para não quebrar mapa/fontes/push.
- Rotacionar service_role **quebra o job do cron** → seguir passo a passo documentado.