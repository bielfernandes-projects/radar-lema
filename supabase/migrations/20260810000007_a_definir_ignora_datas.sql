-- Evento "a definir" (is_confirmed = false) ignora classificacao por data.
--
-- Um evento a definir ainda esta em fechamento: datas/sessoes nao sao
-- definitivas. Por isso ele nunca deve ser classificado como "Realizado" nem
-- como "Em andamento" — fica sempre na aba "A definir". Quando o staff
-- confirma (is_confirmed = true), a classificacao por data volta a valer.

DROP VIEW IF EXISTS public.v_past_events CASCADE;
CREATE VIEW public.v_past_events
WITH (security_invoker = true) AS
SELECT e.*, MAX(s.end_date) AS last_end_date
FROM public.events e
LEFT JOIN public.event_sessions s ON s.event_id = e.id
WHERE e.is_confirmed = true
GROUP BY e.id
HAVING MAX((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo') < now()
    OR COUNT(s.id) = 0;

DROP VIEW IF EXISTS public.v_ongoing_events CASCADE;
CREATE VIEW public.v_ongoing_events
WITH (security_invoker = true) AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
WHERE e.is_confirmed = true
GROUP BY e.id
HAVING BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' < now())
   AND BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' >= now());
