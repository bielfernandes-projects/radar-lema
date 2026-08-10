-- SEC-001: fecha escalada de privilegio no signup.
--
-- ANTES: o trigger on_auth_user_created() validava o user_type/role vindos do
-- raw_user_meta_data apenas contra uma whitelist ('client'|'staff'|'super_admin'),
-- entao qualquer pessoa podia chamar a API /auth/v1/signup direto com
-- user_metadata { user_type: 'super_admin', role: 'ROLE_SUPER_ADMIN' } e nascer
-- com privilegio total no sistema.
--
-- DEPOIS: TODO signup publico nasce client/ROLE_VIEWER (menor privilegio),
-- ignorando qualquer user_type/role enviado pelo cliente. Staff/super_admin so
-- podem ser criados pela Edge Function admin-users, que apos createUser
-- faz o upsert do perfil com o tipo correto usando service_role (o upsert roda
-- do lado do servidor e ignora RLS).

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'client',
    'ROLE_VIEWER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;