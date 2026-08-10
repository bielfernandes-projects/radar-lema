-- SEC-002: fecha bypass de RLS nos views de eventos.
--
-- ANTES: v_past_events / v_ongoing_events foram criadas sem
-- `security_invoker = true`, logo rodam com os privilegios do dono (postgres) e
-- ignoram as policies RLS da tabela events. Com a anon key (publica) qualquer
-- um podia fazer GET /rest/v1/v_past_events e enumerar eventos nao confirmados
-- ("A definir"), violando a regra do CONTEXT.md.
--
-- DEPOIS: com security_invoker, as policies da tabela events (is_confirmed =
-- true OR is_staff()) sao aplicadas tambem via views.

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