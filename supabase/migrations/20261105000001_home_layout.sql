-- Home personalizavel: ordem e visibilidade dos blocos, por usuario.
-- profiles bloqueia UPDATE direto (RLS), entao a escrita vai por RPC (mesmo molde de update_my_profile_name).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_layout jsonb;

CREATE OR REPLACE FUNCTION public.update_my_home_layout(new_layout jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  item jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- NULL (ou JSON null) = voltar ao padrao
  IF new_layout IS NULL OR jsonb_typeof(new_layout) = 'null' THEN
    UPDATE public.profiles SET home_layout = NULL WHERE id = uid;
    RETURN;
  END IF;

  IF jsonb_typeof(new_layout) <> 'array' OR jsonb_array_length(new_layout) > 20 THEN
    RAISE EXCEPTION 'Layout invalido';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(new_layout) LOOP
    IF jsonb_typeof(item) <> 'object'
       OR jsonb_typeof(item->'id') <> 'string'
       OR char_length(item->>'id') > 40
       OR jsonb_typeof(item->'visible') <> 'boolean' THEN
      RAISE EXCEPTION 'Layout invalido';
    END IF;
  END LOOP;

  UPDATE public.profiles SET home_layout = new_layout WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.update_my_home_layout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_home_layout(jsonb) TO authenticated;
