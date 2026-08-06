-- Observabilidade da entrega: guarda o resultado retornado pelo send-push
-- ({sent, gone, failed, total}) junto de cada disparo, para auditoria no banco
-- sem depender dos logs do dashboard.

ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS result jsonb;

ALTER TABLE public.reminder_dispatch
  ADD COLUMN IF NOT EXISTS result jsonb;
