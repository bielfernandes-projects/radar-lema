-- Tabela de perfis: espelha usuarios autenticados do Supabase Auth com metadados.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('staff', 'client')),
  role TEXT NOT NULL CHECK (role IN ('ROLE_SUPER_ADMIN', 'ROLE_DIRIGENTE')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Funcao que cria perfil automaticamente ao criar usuario no Supabase Auth.
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'ROLE_DIRIGENTE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado apos insercao em auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created();
