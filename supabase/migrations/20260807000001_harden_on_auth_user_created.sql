-- Endurece o trigger de criacao de perfil: sanitiza user_type/role vindos do
-- metadata do signup para nunca violar as CHECK constraints do novo modelo.
--
-- Clientes antigos (build em cache no navegador) ainda enviam
-- user_type/role = client/ROLE_DIRIGENTE, que viola
-- profiles_role_check ('ROLE_VIEWER'|'ROLE_ADMIN'|'ROLE_SUPER_ADMIN') e faz o
-- /auth/v1/signup retornar 500 (unexpected_failure). Qualquer valor fora do
-- modelo atual cai para client/ROLE_VIEWER (menor privilegio).

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_role TEXT;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_role := NEW.raw_user_meta_data->>'role';

  IF v_user_type NOT IN ('client', 'staff', 'super_admin') THEN
    v_user_type := 'client';
  END IF;

  IF v_role NOT IN ('ROLE_VIEWER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN') THEN
    v_role := 'ROLE_VIEWER';
  END IF;

  INSERT INTO public.profiles (id, email, name, user_type, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    v_user_type,
    v_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
