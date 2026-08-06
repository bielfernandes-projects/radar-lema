-- Fase A: troca de conta no mesmo dispositivo.
-- O endpoint de push eh atributo do dispositivo, nao do usuario. Quando um
-- segundo usuario faz login no mesmo aparelho, o upsert (ON CONFLICT endpoint)
-- nao conseguia atualizar a linha existente (pertencente ao outro usuario)
-- porque a policy RLS de UPDATE exige user_id = auth.uid().
--
-- Solucao: upsert via SECURITY DEFINER (roda como owner, ignora RLS), que
-- primeiro remove a linha orfa do endpoint e depois insere/atualiza a do
-- usuario autenticado. auth.uid() continua respeitando o usuario logado.

CREATE OR REPLACE FUNCTION public.upsert_my_push_subscription(
  endpoint TEXT,
  p256dh TEXT,
  auth_value TEXT,
  user_agent TEXT DEFAULT NULL
)
RETURNS public.push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.push_subscriptions;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove a assinatura orfa do mesmo endpoint (dispositivo em outra conta).
  DELETE FROM public.push_subscriptions
  WHERE endpoint = upsert_my_push_subscription.endpoint
    AND user_id <> uid;

  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  VALUES (uid, endpoint, p256dh, auth_value, user_agent)
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now()
  RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_my_push_subscription(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_my_push_subscription(TEXT, TEXT, TEXT, TEXT)
  TO authenticated;
