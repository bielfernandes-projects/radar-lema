-- Hub da Lema — Fase 4 (Social).
--
--   likes    — curtidas polimorficas (content_type + content_id) em Artigos,
--              Eventos, Noticias e Novidades UNO. Materiais NAO recebem.
--   comments — comentarios polimorficos nos mesmos tipos. Moderação
--              pos-publicacao via flag `hidden` (staff oculta pelo /moderacao).
--   v_comments_with_content — visao para a fila de moderação, resolvendo
--              titulo do conteudo e nome do autor.

-- ---------------------------------------------------------------------------
-- likes
-- ---------------------------------------------------------------------------
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT likes_content_type_check
    CHECK (content_type IN ('article', 'event', 'news', 'uno_update')),
  CONSTRAINT likes_unique UNIQUE (content_type, content_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem as curtidas.
CREATE POLICY likes_select ON public.likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Cada usuario curte/descurte apenas a propria curtida.
CREATE POLICY likes_insert_own ON public.likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_delete_own ON public.likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_likes_content ON public.likes (content_type, content_id);
CREATE INDEX idx_likes_user ON public.likes (user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT comments_content_type_check
    CHECK (content_type IN ('article', 'event', 'news', 'uno_update'))
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Leitura: todos veem apenas os nao ocultos; staff ve tambem os ocultos.
CREATE POLICY comments_select ON public.comments
  FOR SELECT
  USING (NOT hidden OR public.is_staff());

-- Comentario aparece na hora (moderação pos-publicacao).
CREATE POLICY comments_insert_own ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff alterna hidden (ocultar/exibir) pela fila de moderação.
CREATE POLICY comments_staff_moderate ON public.comments
  FOR UPDATE
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Autor exclui o proprio comentario; staff exclui qualquer um.
CREATE POLICY comments_delete ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_staff());

CREATE INDEX idx_comments_content ON public.comments (content_type, content_id);
CREATE INDEX idx_comments_hidden ON public.comments (hidden) WHERE hidden = true;

-- ---------------------------------------------------------------------------
-- v_comments_with_content (fila de moderação).
-- security_invoker: a view roda com as permissoes do chamador, entao as RLS
-- das tabelas base valem aqui — a fila so mostra `hidden` para staff via
-- `comments_select`, e o titulo de conteudo exclusivo segue a RLS dele.
CREATE OR REPLACE VIEW public.v_comments_with_content
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.content_type,
  c.content_id,
  c.body,
  c.hidden,
  c.user_id,
  c.created_at,
  p.name AS user_name,
  COALESCE(a.title, e.title, n.title, u.title) AS content_title
FROM public.comments c
LEFT JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.articles a ON c.content_type = 'article' AND a.id = c.content_id
LEFT JOIN public.events e ON c.content_type = 'event' AND e.id = c.content_id
LEFT JOIN public.news n ON c.content_type = 'news' AND n.id = c.content_id
LEFT JOIN public.uno_updates u ON c.content_type = 'uno_update' AND u.id = c.content_id;
