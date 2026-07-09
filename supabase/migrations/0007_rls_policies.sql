-- Habilita RLS em todas as tabelas.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Helper: retorna true se o usuario autenticado for ROLE_SUPER_ADMIN.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'ROLE_SUPER_ADMIN'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles: usuario le proprio perfil; staff le todos.
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR public.is_super_admin());

-- profiles: insert/update/delete bloqueados (perfil criado apenas pelo trigger de auth).
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK (false);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (false);
CREATE POLICY profiles_delete ON public.profiles FOR DELETE USING (false);

-- categories: leitura publica; escrita somente super admin.
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_write ON public.categories;
CREATE POLICY categories_select ON public.categories FOR SELECT USING (true);
CREATE POLICY categories_write ON public.categories
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- events: leitura publica; escrita somente super admin.
DROP POLICY IF EXISTS events_select ON public.events;
DROP POLICY IF EXISTS events_write ON public.events;
CREATE POLICY events_select ON public.events FOR SELECT USING (true);
CREATE POLICY events_write ON public.events
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- event_sessions: leitura publica; escrita somente super admin.
DROP POLICY IF EXISTS event_sessions_select ON public.event_sessions;
DROP POLICY IF EXISTS event_sessions_write ON public.event_sessions;
CREATE POLICY event_sessions_select ON public.event_sessions FOR SELECT USING (true);
CREATE POLICY event_sessions_write ON public.event_sessions
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- event_photos: leitura publica; escrita somente super admin.
DROP POLICY IF EXISTS event_photos_select ON public.event_photos;
DROP POLICY IF EXISTS event_photos_write ON public.event_photos;
CREATE POLICY event_photos_select ON public.event_photos FOR SELECT USING (true);
CREATE POLICY event_photos_write ON public.event_photos
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- favorites: isolado por usuario autenticado.
DROP POLICY IF EXISTS favorites_select ON public.favorites;
DROP POLICY IF EXISTS favorites_write ON public.favorites;
CREATE POLICY favorites_select ON public.favorites
  FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY favorites_write ON public.favorites
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
