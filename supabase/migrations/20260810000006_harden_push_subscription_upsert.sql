-- SEC-012: endurece upsert_my_push_subscription.
--
-- ANTES: a funcao (SECURITY DEFINER) aceitava qualquer endpoint como entrada e
-- deletava a linha de OUTRO usuario com aquele endpoint sem validar o formato,
-- permitindo que um autenticado removesse a assinatura de outra pessoa caso
-- soubesse o endpoint.
--
-- DEPOIS:
--   1) endpoint deve ser uma URL https valida (endpoints de Web Push sao
--      sempre https), o que bloqueia strings arbitrias/craftadas;
--   2) o DELETE do "orfao" (mesmo endpoint, outro user) so acontece quando o
--      proprio usuario ja possui OU esta registrando aquele endpoint no
--      dispositivo (transferencia legitima de conta no mesmo aparelho).
--   Leitura/escrita continuam restritas ao owner via policies RLS.

DROP FUNCTION IF EXISTS public.upsert_my_push_subscription(TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION public.upsert_my_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS public.push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.push_subscriptions;
  mine integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Web Push endpoints sao sempre https. Rejeita qualquer outra forma.
  IF p_endpoint IS NULL OR p_endpoint !~ '^https://' THEN
    RAISE EXCEPTION 'endpoint invalido (esperado https)';
  END IF;

  IF p_p256dh IS NULL OR p_p256dh = '' OR p_auth IS NULL OR p_auth = '' THEN
    RAISE EXCEPTION 'p256dh/auth sao obrigatorios';
  END IF;

  -- So remove o "orfao" (outro usuario no mesmo endpoint) se o chamador ainda
  -- nao possuir essa assinatura -- caso contrario mantemos a dele.
  SELECT count(*) INTO mine
  FROM public.push_subscriptions
  WHERE endpoint = p_endpoint AND user_id = uid;

  IF mine = 0 THEN
    DELETE FROM public.push_subscriptions
    WHERE endpoint = p_endpoint
      AND user_id <> uid;
  END IF;

  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  VALUES (uid, p_endpoint, p_p256dh, p_auth, p_user_agent)
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