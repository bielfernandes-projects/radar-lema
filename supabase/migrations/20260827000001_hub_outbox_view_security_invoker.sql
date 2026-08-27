-- ---------------------------------------------------------------------------
-- SEC: v_hub_notification_outbox rodava com privilegio do dono (sem
-- security_invoker), furando a RLS de `articles` e vazando titulo/subtitulo
-- de artigos `visibility = 'lema_client'` para anon/authenticated via PostgREST.
-- Mesmo bug ja corrigido nas views de evento (20260810000002).
--
-- O notification-scheduler chama esta view com a chave service_role, que
-- ignora RLS de qualquer forma, entao o dispatch continua funcionando.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_hub_notification_outbox
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.content_type,
  o.content_id,
  o.created_at,
  COALESCE(a.title, u.title) AS title,
  COALESCE(a.subtitle, u.body) AS subtitle
FROM public.hub_notification_outbox o
LEFT JOIN public.articles a ON o.content_type = 'article' AND a.id = o.content_id
LEFT JOIN public.uno_updates u ON o.content_type = 'uno_update' AND u.id = o.content_id
WHERE o.dispatched_at IS NULL;

-- So a Edge Function (service_role) precisa ler o outbox.
REVOKE ALL ON public.v_hub_notification_outbox FROM anon, authenticated;
