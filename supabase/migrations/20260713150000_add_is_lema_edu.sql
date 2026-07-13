ALTER TABLE IF EXISTS public.events
ADD COLUMN IF NOT EXISTS is_lema_edu BOOLEAN DEFAULT false;

-- Recria views para incluir a nova coluna (PostgreSQL expande e.* no momento da criacao).
DROP VIEW IF EXISTS public.v_past_events CASCADE;
CREATE VIEW public.v_past_events AS
SELECT e.*, MAX(s.end_date) AS last_end_date
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING MAX(s.end_date) < CURRENT_DATE;

DROP VIEW IF EXISTS public.v_ongoing_events CASCADE;
CREATE VIEW public.v_ongoing_events AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING BOOL_OR(s.end_date < CURRENT_DATE)
   AND BOOL_OR(s.end_date >= CURRENT_DATE);
