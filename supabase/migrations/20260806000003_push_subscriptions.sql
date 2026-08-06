-- Subscriptions de Web Push por usuario (Web Push API).
-- Cada linha guarda o push subscription JSON (endpoint + chaves) que o
-- frontend obteve do service worker, permitindo que o servidor envie
-- notificacoes para o dispositivo mesmo com o app fechado.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Select/Delete/Update: apenas o proprietario gerencia as proprias
-- assinaturas. Insert restrito ao proprio usuario.
DROP POLICY IF EXISTS push_subscriptions_select ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_insert ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_update ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_delete ON public.push_subscriptions;

CREATE POLICY push_subscriptions_select ON public.push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY push_subscriptions_insert ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY push_subscriptions_update ON public.push_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY push_subscriptions_delete ON public.push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- O servico de envio (Edge Function) usa a role service_role, que ignora RLS.
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);