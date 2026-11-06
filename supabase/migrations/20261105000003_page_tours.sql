-- Mini-tours por tela: "ja viu" por tela e opt-out global das dicas.
-- profiles bloqueia UPDATE direto (RLS), entao a escrita vai por RPC.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tours_seen jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tips_disabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.mark_tour_seen(tour_key text)
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
  IF tour_key IS NULL OR tour_key !~ '^[a-z0-9-]{1,40}$' THEN
    RAISE EXCEPTION 'Chave de tour invalida';
  END IF;
  -- limite de chaves: ninguem enche o jsonb chamando a RPC com chaves arbitrarias
  IF (SELECT count(*) FROM public.profiles p, jsonb_object_keys(p.tours_seen) WHERE p.id = uid) >= 50 THEN
    RETURN;
  END IF;
  UPDATE public.profiles
     SET tours_seen = tours_seen || jsonb_build_object(tour_key, now())
   WHERE id = uid;
END $$;

CREATE OR REPLACE FUNCTION public.set_tips_disabled(disabled boolean)
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
  UPDATE public.profiles SET tips_disabled = coalesce(disabled, false) WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION public.mark_tour_seen(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_tips_disabled(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_tour_seen(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_tips_disabled(boolean) TO authenticated;
