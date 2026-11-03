-- Respostas, curtidas em comentarios e notificacoes para o autor do comentario.
--
--   comments.parent_id   — comentario raiz da conversa (respostas de 1 nivel).
--   comments.reply_to_id — comentario especifico que foi respondido (quem recebe o aviso).
--   comment_likes        — curtida em comentario (a curtida do CONTEUDO continua em `likes`).
--   user_notifications   — aviso por usuario: alimenta o sino do app e a fila de push.
--
-- Responder a uma resposta fica no mesmo nivel: o front manda parent_id = comentario clicado e
-- o trigger achata para a raiz, guardando o clicado em reply_to_id.

-- ---------------------------------------------------------------------------
-- 1. Respostas
-- ---------------------------------------------------------------------------
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments (parent_id);

CREATE OR REPLACE FUNCTION public.comments_flatten_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.comments;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.reply_to_id := NULL;
    RETURN NEW;
  END IF;

  SELECT * INTO target FROM public.comments WHERE id = NEW.parent_id;
  IF NOT FOUND
     OR target.content_type <> NEW.content_type
     OR target.content_id <> NEW.content_id THEN
    RAISE EXCEPTION 'Comentario respondido nao encontrado neste conteudo';
  END IF;

  NEW.reply_to_id := target.id;
  NEW.parent_id := COALESCE(target.parent_id, target.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS comments_flatten_reply ON public.comments;
CREATE TRIGGER comments_flatten_reply
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.comments_flatten_reply();

-- ---------------------------------------------------------------------------
-- 2. Curtida em comentario
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_likes_select ON public.comment_likes
  FOR SELECT USING (auth.role() = 'authenticated');

-- So curte como si mesmo, e so um comentario que o proprio usuario consegue ver
-- (o EXISTS passa pelo RLS de comments: comentario oculto nao e curtivel).
CREATE POLICY comment_likes_insert_own ON public.comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.comments c WHERE c.id = comment_id)
  );

CREATE POLICY comment_likes_delete_own ON public.comment_likes
  FOR DELETE USING (auth.uid() = user_id);

REVOKE ALL ON public.comment_likes FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Notificacoes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,   -- quem recebe
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- quem curtiu/respondeu
  kind TEXT NOT NULL CHECK (kind IN ('comment_like', 'comment_reply')),
  -- comment_like: o comentario curtido; comment_reply: a resposta
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  push_dispatched_at TIMESTAMPTZ,
  -- curtir, descurtir e curtir de novo nao avisa duas vezes
  CONSTRAINT user_notifications_once UNIQUE (kind, actor_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_push_pending
  ON public.user_notifications (created_at) WHERE push_dispatched_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
-- Sem policies: o app le pela view v_my_notifications e marca como lida pelo RPC; o scheduler
-- usa a service_role.
REVOKE ALL ON public.user_notifications FROM anon, authenticated;

-- Leitura do proprio usuario, com o nome de quem agiu e um trecho do comentario. Sem
-- security_invoker de proposito: roda como dono (atravessa o RLS de profiles/comments), mas o
-- WHERE trava em auth.uid() — so devolve as notificacoes de quem pergunta.
CREATE OR REPLACE VIEW public.v_my_notifications AS
SELECT
  n.id,
  n.kind,
  n.created_at,
  n.read_at,
  a.name AS actor_name,
  c.content_type,
  c.content_id,
  left(c.body, 120) AS snippet
FROM public.user_notifications n
JOIN public.profiles a ON a.id = n.actor_id
JOIN public.comments c ON c.id = n.comment_id
WHERE n.user_id = auth.uid();

REVOKE ALL ON public.v_my_notifications FROM PUBLIC, anon;
GRANT SELECT ON public.v_my_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_notifications SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.mark_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Gatilhos que geram o aviso (nunca avisa o proprio autor)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_comment_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author UUID;
BEGIN
  SELECT user_id INTO author FROM public.comments WHERE id = NEW.comment_id;
  IF author IS NOT NULL AND author <> NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, actor_id, kind, comment_id)
    VALUES (author, NEW.user_id, 'comment_like', NEW.comment_id)
    ON CONFLICT ON CONSTRAINT user_notifications_once DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_comment_like ON public.comment_likes;
CREATE TRIGGER notify_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_comment_like();

CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author UUID;
BEGIN
  SELECT user_id INTO author FROM public.comments WHERE id = NEW.reply_to_id;
  IF author IS NOT NULL AND author <> NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, actor_id, kind, comment_id)
    VALUES (author, NEW.user_id, 'comment_reply', NEW.id)
    ON CONFLICT ON CONSTRAINT user_notifications_once DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_comment_reply ON public.comments;
CREATE TRIGGER notify_comment_reply
AFTER INSERT ON public.comments
FOR EACH ROW WHEN (NEW.reply_to_id IS NOT NULL)
EXECUTE FUNCTION public.notify_comment_reply();
