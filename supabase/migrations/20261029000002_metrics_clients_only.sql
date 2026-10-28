-- As metricas do painel Admin passam a contar apenas usuarios clientes
-- (user_type = 'client'). Contas staff e super_admin nao entram: nem telas,
-- nem usuarios ativos, nem cadastros, nem favoritos.

-- Eventos de clientes apenas. Sem acesso direto: so as funcoes SECURITY DEFINER leem.
CREATE OR REPLACE VIEW public.client_events AS
SELECT e.*
FROM public.app_events e
JOIN public.profiles p ON p.id = e.user_id AND p.user_type = 'client';

REVOKE ALL ON public.client_events FROM PUBLIC, anon, authenticated;

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
    'total_users', (SELECT count(*) FROM public.profiles WHERE user_type = 'client'),
    'new_users', (SELECT count(*) FROM public.profiles
                  WHERE user_type = 'client' AND created_at >= since),
    'active_now', (SELECT count(DISTINCT user_id) FROM public.client_events
                   WHERE created_at > now() - interval '5 minutes'),
    'active_users', (SELECT count(DISTINCT user_id) FROM public.client_events
                     WHERE created_at >= since),
    'screen_views', (SELECT count(*) FROM public.client_events
                     WHERE event = 'screen_view' AND created_at >= since),
    'lock_opened', (SELECT count(*) FROM public.client_events
                    WHERE event = 'lock_opened' AND created_at >= since),
    'lock_clicked', (SELECT count(*) FROM public.client_events
                     WHERE event = 'lock_clicked' AND created_at >= since),
    'signups_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(p.id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.profiles p
          ON p.user_type = 'client' AND (p.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'active_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(DISTINCT e.user_id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.client_events e ON (e.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'leads_by_day', (
      SELECT COALESCE(json_agg(json_build_object('day', d, 'count', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT g::date AS d, count(e.id) AS c
        FROM generate_series(d0, (now() AT TIME ZONE tz)::date, interval '1 day') g
        LEFT JOIN public.client_events e
          ON e.event = 'lock_clicked' AND (e.created_at AT TIME ZONE tz)::date = g::date
        GROUP BY 1
      ) s
    ),
    'top_screens', (
      SELECT COALESCE(json_agg(json_build_object('path', path, 'views', views, 'users', users)
                               ORDER BY views DESC), '[]'::json)
      FROM (
        SELECT path, count(*) AS views, count(DISTINCT user_id) AS users
        FROM public.client_events
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

-- Totais e series mensais do painel: usuarios e favoritos so de clientes.
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  stats JSONB;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles WHERE user_type = 'client'),
    'total_events', (SELECT count(*) FROM public.events),
    'total_favorites', (SELECT count(*) FROM public.favorites f
                        JOIN public.profiles p ON p.id = f.user_id AND p.user_type = 'client'),
    'users_by_month', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('month', m, 'count', c) ORDER BY m
      ), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS m, count(*) AS c
        FROM public.profiles
        WHERE user_type = 'client'
        GROUP BY 1
      ) t
    ),
    'favorites_by_month', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('month', m, 'count', c) ORDER BY m
      ), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', f.created_at), 'YYYY-MM') AS m, count(*) AS c
        FROM public.favorites f
        JOIN public.profiles p ON p.id = f.user_id AND p.user_type = 'client'
        GROUP BY 1
      ) t
    )
  ) INTO stats;

  RETURN stats;
END;
$function$;
