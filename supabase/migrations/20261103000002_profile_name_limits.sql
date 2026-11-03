-- QA M5: o nome do perfil aceitava 5000 caracteres e HTML cru.
-- O RPC passa a recusar nomes longos e a tirar < e >; a constraint (NOT VALID: nao reprova
-- linhas antigas, so as novas/alteradas) garante o mesmo limite para qualquer caminho de escrita.
CREATE OR REPLACE FUNCTION public.update_my_profile_name(new_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  clean text := btrim(regexp_replace(coalesce(new_name, ''), '[<>]', '', 'g'));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF length(clean) = 0 THEN
    RAISE EXCEPTION 'Nome nao pode ser vazio';
  END IF;
  IF char_length(clean) > 100 THEN
    RAISE EXCEPTION 'Nome deve ter no maximo 100 caracteres';
  END IF;
  UPDATE public.profiles SET name = clean WHERE id = uid;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_length_check
  CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 100) NOT VALID;
