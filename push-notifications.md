# Notificações push — Web Push API

Como habilitar de verdade as notificações push (funcionam com o app fechado).

## Arquitetura

```
[Service Worker src/sw.js]  recebe o evento push e mostra a notificação
        ▲
[Settings toggle] → subscribe() → PushManager.subscribe(VAPID_PUBLIC)
        │                └─ salva {endpoint,p256dh,auth} em push_subscriptions
        │                   via RPC upsert_my_push_subscription (troca de conta ok)
        ▼
[notification-scheduler]  --service_role-->  chama send-push (evento novo / lembrete)
        ▲                                          │
[pg_cron * * * * *]  →  net.http_post  -----------┘   busca subscriptions → webpush() para cada
        ▲
[notification_outbox trigger] / [get_due_reminders()]
```

## Passo 1 — Gerar chaves VAPID

```bash
npx web-push generate-vapid-keys --json
```

Saída (ex.):
```json
{
  "publicKey": "BEl62iU...",
  "privateKey": "qX33MMm..."
}
```

## Passo 2 — Frontend (.env.local + Vercel)

`VITE_VAPID_PUBLIC_KEY` = a chave pública acima.
Tanto no `.env.local` quanto nas Env Vars do projeto Vercel (frontend, ramo
principal).

## Passo 3 — Supabase (Edge Function)

1. Aplicar a migration `push_subscriptions`:
   ```bash
   supabase db push   # ou rode o SQL manualmente no Dashboard
   ```
2. Criar a edge function:
   ```bash
   supabase functions deploy send-push
   ```
3. Set secrets OBRIGATÓRIOS da function:
   ```bash
   supabase secrets set VAPID_PRIVATE_KEY="(privada)"
   supabase secrets set VAPID_PUBLIC_KEY="(pública)"
   supabase secrets set VAPID_SUBJECT="mailto:alerts@lema.com.br"
   ```
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente
   no runtime das edge functions.

Confirmar no Dashboard em **Edge Functions** que as secrets estão setadas.

## Passo 4 — Testar o envio

Abre o app **em produção/HTTPS** (push não funciona em contextos inseguros
nem no `npm run dev`, pois o service worker é registrado apenas no build —
`devOptions.enabled: false` no `vite-plugin-pwa`). Ative "Receber notificações
push" na Config — vai pedir permissão e gravar a subscription. Depois dispara
um envio de teste:

```bash
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/send-push" \
  -H "Authorization: Bearer SUA_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey:SUA_SERVICE_ROLE_KEY" \
  -d '{"userIds":["ID_DO_USUARIO"],"payload":{"title":"Teste","body":"push ok"}}'
```

Para "novo evento" por categoria, use `eventCategoryIds` em vez de `userIds`
— o servidor envia a todos os assins com push ativo e categoria compatível.

## Disparo automático (novos eventos / lembretes)

Implementado de ponta a ponta. A Edge Function `notification-scheduler` roda a
cada minuto via `pg_cron` + `pg_net` e faz dois trabalhos:

1. **Eventos novos por categoria** — lê `notification_outbox` (linhas criadas
   por trigger no INSERT de evento confirmado), chama `send-push` com
   `eventCategoryIds` do evento e marca `dispatched_at`.
2. **Lembretes** — lê `get_due_reminders()` (janela de 2 min antes do início,
   horário em `America/Sao_Paulo`, dedup por `reminder_dispatch`) e chama
   `send-push` com `userIds` do dono do lembrete.

Cada disparo grava o resultado do `send-push` (`{sent, gone, failed, total}`)
nas colunas `result` de `notification_outbox` e `reminder_dispatch` — auditoria
no banco, sem depender dos logs do dashboard.

### Deploy

```bash
supabase functions deploy notification-scheduler
```

A função usa as mesmas secrets do `send-push` (`SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` já são injetadas pelo runtime).

### Provisionar o job do cron

O job **não é versionado** (a migration `20260806000006_scheduler_cron.sql`
cria apenas as extensões `pg_cron` e `pg_net`). Ele é registrado em deploy
porque a chamada HTTP autentica com a service role key, que não pode ficar no
repositorio:

```sql
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'radar-notification-scheduler';

SELECT cron.schedule(
  'radar-notification-scheduler',
  '* * * * *',
  'SELECT net.http_post(
    url := ''https://SEU-PROJETO.supabase.co/functions/v1/notification-scheduler'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer SUA_SERVICE_ROLE_KEY''
    ),
    body := ''{}''
  ) AS request_id;'
);
```

> **Atenção (bug real já ocorrido):** se a service role key estiver vazia no
> comando, cada tique do cron chama a função e recebe **401 Unauthorized** — o
> scheduler roda "com sucesso" no `cron.job_run_details` mas nada é processado.
> Verificar em `net._http_response` (status_code) que os requests retornam 200.
> Se a service role key do projeto for **rotacionada**, o job quebra de novo
> silenciosamente — é preciso re-provisionar com a nova chave.

Para o **ambiente local**, o Supabase CLI v2 ainda não suporta `schedule_cron`
no `config.toml`; o mecanismo acima (pg_cron + pg_net) é o oficial.

## Limitações e notas

- Push só funciona em **HTTPS** e com **SW registrado** (a partir do build,
  `npm run build && npm run preview`; o Workbox registra o SW com `registerType:
'autoUpdate'`).
- iOS: Web Push funciona a partir do iOS 16.4 nos apps instalados via "Adicionar
  à Tela de Início" somente.
- O toggle "Notificar novos eventos" usa `categories_enabled` (default `[]`,
  opt-in; `['*']` = todas). Sem ele, o usuário não recebe aviso de evento novo,
  mas continua recebendo lembretes dos eventos favoritados.
- Lembretes hoje são enviados **somente via push**. O canal E-mail está
  desabilitado na UI ("em breve").
- `push_enabled` (notification_settings) é a "intenção"; a presença real de uma
  row em `push_subscriptions` é o que o servidor usa para enviar. O `signOut`
  remove a subscription do dispositivo (limpeza da linha em `push_subscriptions`).
- A Edge Function exige `Authorization: service_role` para evitar abuso.