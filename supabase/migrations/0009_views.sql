-- View de eventos realizados (todas as sessoes ja passaram).
CREATE OR REPLACE VIEW public.v_past_events AS
SELECT e.*, MAX(s.end_date) AS last_end_date
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING MAX(s.end_date) < CURRENT_DATE;

-- View de eventos em andamento (pelo menos uma sessao passada e uma futura).
CREATE OR REPLACE VIEW public.v_ongoing_events AS
SELECT e.*
FROM public.events e
JOIN public.event_sessions s ON s.event_id = e.id
GROUP BY e.id
HAVING BOOL_OR(s.end_date < CURRENT_DATE)
   AND BOOL_OR(s.end_date >= CURRENT_DATE);
