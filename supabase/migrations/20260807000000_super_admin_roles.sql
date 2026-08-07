-- Super Admin e novo modelo de roles.
--
-- Novo modelo:
--   user_type   | role              | acesso
--   ------------+-------------------+-----------------------------------------------
--   super_admin | ROLE_SUPER_ADMIN  | tudo (incl. painel admin e gestao de usuarios)
--   staff       | ROLE_ADMIN        | visualiza e gerencia eventos/categorias
--   client      | ROLE_VIEWER       | visualiza/favorita eventos
--
-- Apos aplicar, rode o script scripts/promote-super-admin.mjs (ou o painel) para
-- garantir que a conta principal esteja em super_admin/ROLE_SUPER_ADMIN.

-- 1) Remove as CHECK constraints atuais ANTES de reclassificar dados:
--    a constraint antiga so aceita ROLE_DIRIGENTE/ROLE_SUPER_ADMIN, e a nova
--    so pode ser adicionada quando os dados ja estao dentro dos novos valores.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2) Reclassifica dados existentes.
-- Antigos admins (staff/ROLE_SUPER_ADMIN) viram super_admin.
UPDATE public.profiles
SET user_type = 'super_admin', role = 'ROLE_SUPER_ADMIN'
WHERE user_type = 'staff';

-- Antigos clientes (ROLE_DIRIGENTE) viram ROLE_VIEWER.
UPDATE public.profiles
SET role = 'ROLE_VIEWER'
WHERE user_type = 'client';

-- Garante a conta principal (se existir) em super_admin.
UPDATE public.profiles
SET user_type = 'super_admin', role = 'ROLE_SUPER_ADMIN'
WHERE email = 'gabrielfernandes@lemaef.com.br';

-- 3) Adiciona as novas CHECK constraints (dados ja reclassificados).
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('super_admin', 'staff', 'client'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_VIEWER'));

-- 4) Trigger de novo usuario: padrao de role agora e ROLE_VIEWER.
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'ROLE_VIEWER')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) is_staff(): qualquer tier que gerencia eventos (staff OU super_admin).
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT user_type IN ('staff', 'super_admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Escrita de eventos/categorias agora liberada para o tier staff
--    (staff/ROLE_ADMIN e super_admin/ROLE_SUPER_ADMIN), nao apenas SUPER_ADMIN.

DROP POLICY IF EXISTS categories_write ON public.categories;
CREATE POLICY categories_write ON public.categories
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS events_write ON public.events;
CREATE POLICY events_write ON public.events
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS event_sessions_write ON public.event_sessions;
CREATE POLICY event_sessions_write ON public.event_sessions
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS event_photos_write ON public.event_photos;
CREATE POLICY event_photos_write ON public.event_photos
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS event_categories_write ON public.event_categories;
CREATE POLICY event_categories_write ON public.event_categories
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- 7) RPC do painel admin: agregados cross-usuario (apenas super_admin).
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_events', (SELECT count(*) FROM public.events),
    'total_favorites', (SELECT count(*) FROM public.favorites),
    'users_by_month', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('month', m, 'count', c) ORDER BY m
      ), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS m, count(*) AS c
        FROM public.profiles
        GROUP BY 1
      ) t
    ),
    'favorites_by_month', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('month', m, 'count', c) ORDER BY m
      ), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS m, count(*) AS c
        FROM public.favorites
        GROUP BY 1
      ) t
    )
  ) INTO stats;

  RETURN stats;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
