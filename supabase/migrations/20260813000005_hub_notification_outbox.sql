-- Hub da Lema — Fase 5 (Push novo).
--
-- hub_notification_outbox: fila de notificacoes push de conteudos do hub.
-- O `notification-scheduler` (Edge Function agendada) le os pendentes e chama
-- `send-push` com o audience adequado:
--   - uno_update -> audience 'all'          (todos com push ativo)
--   - article     -> audience 'uno_clients' (apenas Clientes Lema)
-- e entao marca dispatched_at.
--
-- Trigger em uno_updates: qualquer novidade publicada gera push.
-- Trigger em articles: apenas visibilidade lema_client gera push (no insert
-- ou quando a visibilidade muda para lema_client).

CREATE TABLE public.hub_notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT hub_notification_outbox_content_type_check
    CHECK (content_type IN ('uno_update', 'article')),
  CONSTRAINT hub_notification_outbox_unique UNIQUE (content_type, content_id)
);

ALTER TABLE public.hub_notification_outbox ENABLE ROW LEVEL SECURITY;
-- Sem policies: tabela interna, acessada apenas pela role service_role
-- (Edge Function) e pelos triggers SECURITY DEFINER.

CREATE INDEX idx_hub_notification_outbox_pending
  ON public.hub_notification_outbox (content_type, created_at)
  WHERE dispatched_at IS NULL;

-- ---------------------------------------------------------------------------
-- Trigger: novidade UNO
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_uno_update_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hub_notification_outbox (content_type, content_id)
  VALUES ('uno_update', NEW.id)
  ON CONFLICT (content_type, content_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_uno_update_on_insert ON public.uno_updates;
CREATE TRIGGER queue_uno_update_on_insert
AFTER INSERT ON public.uno_updates
FOR EACH ROW
EXECUTE FUNCTION public.queue_uno_update_notification();

-- ---------------------------------------------------------------------------
-- Trigger: artigo exclusivo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_article_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hub_notification_outbox (content_type, content_id)
  VALUES ('article', NEW.id)
  ON CONFLICT (content_type, content_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_article_on_insert ON public.articles;
CREATE TRIGGER queue_article_on_insert
AFTER INSERT ON public.articles
FOR EACH ROW
WHEN (NEW.visibility = 'lema_client')
EXECUTE FUNCTION public.queue_article_notification();

DROP TRIGGER IF EXISTS queue_article_on_visibility_change ON public.articles;
CREATE TRIGGER queue_article_on_visibility_change
AFTER UPDATE OF visibility ON public.articles
FOR EACH ROW
WHEN (NEW.visibility = 'lema_client' AND OLD.visibility IS DISTINCT FROM 'lema_client')
EXECUTE FUNCTION public.queue_article_notification();

-- ---------------------------------------------------------------------------
-- Visao para o scheduler (resolver titulo por content_type)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_hub_notification_outbox AS
SELECT
  o.id,
  o.content_type,
  o.content_id,
  o.created_at,
  COALESCE(a.title, u.title) AS title,
  COALESCE(a.subtitle, u.body) AS subtitle
FROM public.hub_notification_outbox o
LEFT JOIN public.articles a ON o.content_type = 'article' AND a.id = o.content_id
LEFT JOIN public.uno_updates u ON o.content_type = 'uno_update' AND u.id = o.content_id
WHERE o.dispatched_at IS NULL;
