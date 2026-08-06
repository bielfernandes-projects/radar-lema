# Notificações push — Web Push API

Como habilitar de verdade as notificações push (funcionam com o app fechado).

## Arquitetura

```
[Service Worker src/sw.js]  recebe o evento push e mostra a notificação
        ▲
[Settings toggle] → subscribe() → PushManager.subscribe(VAPID_PUBLIC)
        │                └─ salva {endpoint,p256dh,auth} em push_subscriptions (RLS user)
        ▼
[Edge Function send-push]  --service_role-->  busca subscriptions → webput() para cada
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
nem no `npm run dev`, pois ainda não há SW). Ative "Receber notificações
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

A Edge Function só dispara quando é chamada. Para "novos eventos" em
produção você tem duas opções:

- **Direto do staff**: ao salvar um evento confirmado, um script/serviço
  chama `send-push` por `/gestao`. (mais simples)
- **Cron**: um agendador (e.g. `pg_cron` ou uma função schedule) chama a
  function com `eventCategoryIds` após o INSERT, disparando avisos de novos
  eventos automaticamente.

Lembretes por evento ainda dependem de um agendador que calcule `offset_minutes`
antes de `start_time` e chame `send-push` com `userIds` dos configs que escolhram.

## Limitações e notas

- Push só funciona em **HTTPS** e com **SW registrado** (a partir do build,
  `npm run build && npm run preview`; o Workbox registra o SW com `registerType:
'autoUpdate'`).
- iOS: Web Push funciona a partir do iOS 16.4 nos apps instalados via "Adicionar
  à Tela de Início" somente.
- `push_enabled` (notification_settings) é a "intenção"; a presença real de uma
  row em `push_subscriptions` é o que o servidor usa para enviar.
- A Edge Function exige `Authorization: service_role` para evitar abuso.