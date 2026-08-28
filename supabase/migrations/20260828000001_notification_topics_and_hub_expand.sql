-- Revisão do sistema de notificações — preferências por tópico + canal.
--
-- 1. notification_settings.topics (JSONB): o usuário escolhe, por tipo de
--    conteúdo NÃO-evento, se quer push (e futuramente e-mail). Formato:
--      { "news": {"push": true, "email": false}, "articles": {...},
--        "materials": {...}, "uno_updates": {...} }
--    Ausência de chave = desligado (opt-in). Eventos continuam em
--    `categories_enabled` (não entram aqui).
--
-- 2. hub_notification_outbox passa a cobrir `material` e a enfileirar TODO
--    artigo novo (antes só `lema_client`) — o scheduler agrupa por rodada
--    para não floodar (ex.: backlog do blog-ingest).

-- ---------------------------------------------------------------------------
-- 1. Preferências por tópico
-- ---------------------------------------------------------------------------
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS topics JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. Ampliar o outbox do hub
-- ---------------------------------------------------------------------------
ALTER TABLE public.hub_notification_outbox
  DROP CONSTRAINT IF EXISTS hub_notification_outbox_content_type_check;
ALTER TABLE public.hub_notification_outbox
  ADD CONSTRAINT hub_notification_outbox_content_type_check
    CHECK (content_type IN ('uno_update', 'article', 'material'));

-- Artigo: qualquer INSERT gera fila (inclui os importados do blog, que são
-- `visibility = 'public'`). A função em si não muda.
DROP TRIGGER IF EXISTS queue_article_on_insert ON public.articles;
CREATE TRIGGER queue_article_on_insert
AFTER INSERT ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.queue_article_notification();
-- queue_article_on_visibility_change permanece: cobre o caso de um artigo já
-- despachado como `public` virar `lema_client` depois.

-- Material de apoio: novo trigger, mesmo padrão.
CREATE OR REPLACE FUNCTION public.queue_material_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hub_notification_outbox (content_type, content_id)
  VALUES ('material', NEW.id)
  ON CONFLICT (content_type, content_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_material_on_insert ON public.materials;
CREATE TRIGGER queue_material_on_insert
AFTER INSERT ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.queue_material_notification();

-- ---------------------------------------------------------------------------
-- 3. View do scheduler: inclui material e expõe visibility (define audience)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_hub_notification_outbox
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.content_type,
  o.content_id,
  o.created_at,
  COALESCE(a.title, u.title, m.title) AS title,
  COALESCE(a.subtitle, u.body, m.description) AS subtitle,
  COALESCE(a.visibility, m.visibility, 'public') AS visibility
FROM public.hub_notification_outbox o
LEFT JOIN public.articles a ON o.content_type = 'article' AND a.id = o.content_id
LEFT JOIN public.uno_updates u ON o.content_type = 'uno_update' AND u.id = o.content_id
LEFT JOIN public.materials m ON o.content_type = 'material' AND m.id = o.content_id
WHERE o.dispatched_at IS NULL;

REVOKE ALL ON public.v_hub_notification_outbox FROM anon, authenticated;
