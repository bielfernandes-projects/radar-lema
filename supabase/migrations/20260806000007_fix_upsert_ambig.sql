-- Fix: "column reference endpoint is ambiguous" na upsert_my_push_subscription.
-- Os nomes de parametro (endpoint, p256dh, user_agent) colidiam com colunas da
-- tabela, gerando ambiguidade no DELETE/INSERT. Renomeados com prefixo p_.
-- CREATE OR REPLACE nao permite renomear parametro de entrada (SQLSTATE 42P13),
-- entao usamos DROP + CREATE e reaplicamos as permissoes.

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
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.push_subscriptions
  WHERE endpoint = p_endpoint
    AND user_id <> uid;

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
