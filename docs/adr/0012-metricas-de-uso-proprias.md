# Métricas de uso próprias no Painel Admin (em vez do dashboard do PostHog)

**Status:** aceita (28/10/2026)

## Contexto

O Painel Admin embutia um dashboard compartilhado do PostHog por iframe. O
visual não combinava com o app, não dava para traduzir/ajustar, e o iframe
exigia liberar `eu.posthog.com` no CSP (`frame-src` do `vercel.json`).

## Decisão

As métricas passam a ser nativas, no visual do app (abas **Observabilidade** e
**Usuários** em `AdminDashboard`):

- Tabela `app_events` (migration `20261029000001`): `screen_view`, `ping`
  (a cada 2 min com a aba visível), `lock_opened`, `lock_clicked`. O cliente só
  insere eventos próprios (RLS); leitura apenas pelas funções `SECURITY
  DEFINER` `admin_usage_metrics` e `admin_dashboard_stats`, restritas a
  super admin.
- **Só clientes são medidos** (migration `20261029000002`): o app não registra
  eventos de staff/super admin (`useLogEvent`) e as consultas leem a view
  `client_events` (sem acesso direto). Totais de usuários, favoritos e
  cadastros também contam só `user_type = 'client'`.
- "Ao vivo" = clientes com algum evento nos últimos 5 minutos. "Leads ao
  comercial" = cliques em "Falar com um consultor" (abre um `mailto:`; mede o
  clique, não o e-mail enviado).
- O PostHog continua coletando (pageviews, autocapture, eventos
  `cadastro_concluido`, `cadeado_aberto`, `cadeado_lead_clicado`), mas não é
  mais exibido no app.

## Consequências

- Sem histórico de telas/presença antes do deploy; cadastros usam o histórico
  real de `profiles`.
- ponytail: sem expurgo de `app_events`; agendar um DELETE (> 180 dias) com
  pg_cron se a tabela crescer.
- O `frame-src` do PostHog no CSP não é mais necessário e pode ser removido.
