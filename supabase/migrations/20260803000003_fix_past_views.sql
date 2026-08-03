-- Corrige a classificacao de "Realizado"/"Em andamento": antes comparava
-- apenas CURRENT_DATE (eventos que ja terminaram hoje ficavam na listagem
-- principal). Agora compara timestamp completo (end_date + end_time) no
-- fuso America/Sao_Paulo contra now().
-- Eventos sem nenhuma sessao tambem contam como realizados.

DROP VIEW IF EXISTS public.v_past_events CASCADE;
CREATE VIEW public.v_past_events AS
SELECT e.*, MAX(s.end_date) AS last_end_date
FROM public.events e
LEFT JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING MAX((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo') < now()
    OR COUNT(s.id) = 0;

DROP VIEW IF EXISTS public.v_ongoing_events CASCADE;
CREATE VIEW public.v_ongoing_events AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' < now())
   AND BOOL_OR((s.end_date + s.end_time) AT TIME ZONE 'America/Sao_Paulo' >= now());
