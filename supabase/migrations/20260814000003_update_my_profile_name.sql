-- Permite que o usuario altere apenas o proprio nome em profiles.
-- A policy RLS profiles_update bloqueia UPDATE de usuarios comuns (so o super
-- admin atualiza via profiles_admin_update); este RPC roda como owner (ignora
-- RLS) mas so atualiza a coluna `name` do proprio auth.uid().
CREATE OR REPLACE FUNCTION public.update_my_profile_name(new_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF new_name IS NULL OR length(btrim(new_name)) = 0 THEN
    RAISE EXCEPTION 'Nome nao pode ser vazio';
  END IF;
  UPDATE public.profiles
  SET name = btrim(new_name)
  WHERE id = uid;
END $$;
