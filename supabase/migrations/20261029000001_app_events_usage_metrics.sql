-- Metricas de uso proprias (sem depender do PostHog): telas visitadas,
-- presenca ao vivo e cliques no cadeado. Alimenta o painel Admin.
--
-- ponytail: sem expurgo automatico; se a tabela crescer, agendar um
-- DELETE de eventos com mais de 180 dias (pg_cron).

CREATE TABLE IF NOT EXISTS public.app_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event      text NOT NULL CHECK (event IN ('screen_view', 'ping', 'lock_opened', 'lock_clicked')),
  path       text CHECK (char_length(path) <= 60)
);

CREATE INDEX IF NOT EXISTS app_events_event_created_idx ON public.app_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS app_events_created_idx ON public.app_events (created_at DESC);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Cada usuario so insere eventos proprios; leitura apenas via admin_usage_metrics.
DROP POLICY IF EXISTS app_events_insert_own ON public.app_events;
CREATE POLICY app_events_insert_own ON public.app_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_usage_metrics(p_days int DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz    text := 'America/Sao_Paulo';
  d0    date := (now() AT TIME ZONE tz)::date - (GREATEST(p_days, 1) - 1);
  since timestamptz := d0::timestamp AT TIME ZONE tz;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'new_users', (SELECT count(*) FROM public.profiles WHERE created_at >= since),
    'active_now', (SELECT count(DISTINCT user_id) FROM public.app_events
                   WHERE created_at > now() - interval '5 minutes'),
    'active_users', (SELECT count(DISTINCT user_id) FROM public.app_events
                     WHERE created_at >= since),
    'screen_views', (SELECT count(*) FROM public.app_events
                     WHERE event = 'screen_view' AND created_at >= since),
    'lock_opened', (SELECT count(*) FROM public.app_events
                    WHERE event = 'lock_opened' AND created_at >= since),
    'lock_clicked', (SELECT count(*) FROM public.app_events
                     WHERE event = 'lock_clicked' AND created_at >= since),
    'signups_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(p.id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.profiles p ON (p.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'active_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(DISTINCT e.user_id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.app_events e ON (e.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'leads_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(e.id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.app_events e
          ON e.event = 'lock_clicked' AND (e.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'top_screens', (
      SELECT COALESCE(json_agg(json_build_object('path', path, 'views', views, 'users', users)
                               ORDER BY views DESC), '[]'::json)
      FROM (
        SELECT path, count(*) AS views, count(DISTINCT user_id) AS users
        FROM public.app_events
        WHERE event = 'screen_view' AND created_at >= since AND path IS NOT NULL
        GROUP BY path
        ORDER BY views DESC
        LIMIT 8
      ) t
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_usage_metrics(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_usage_metrics(int) TO authenticated;
