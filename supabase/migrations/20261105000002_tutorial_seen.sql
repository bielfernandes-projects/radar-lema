-- Tutorial de primeiro uso: marca de que o usuario ja viu o tour.
-- profiles bloqueia UPDATE direto (RLS), entao a escrita vai por RPC.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tutorial_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_tutorial_seen()
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
  UPDATE public.profiles SET tutorial_seen_at = now() WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.mark_tutorial_seen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_tutorial_seen() TO authenticated;
