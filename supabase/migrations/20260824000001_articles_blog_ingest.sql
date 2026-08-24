-- Ingestão automática de artigos do blog da Lema
--
-- Novas colunas em `articles` para rastrear a origem (manual vs. blog) e
-- sincronização da fonte.
--
-- article_ingest_tombstones rastreia artigos excluídos do blog, impedindo que
-- o cron os reinsira na próxima rodada.

-- ---------------------------------------------------------------------------
-- Adicionar colunas de origem e rastreamento
-- ---------------------------------------------------------------------------
ALTER TABLE public.articles
ADD COLUMN origin TEXT NOT NULL DEFAULT 'staff' CHECK (origin IN ('staff', 'blog')),
ADD COLUMN source_id TEXT,
ADD COLUMN source_modified_at TIMESTAMPTZ,
ADD COLUMN source_cover_url TEXT;

-- Índice único em source_id (permite NULL sem conflitar, autodeduplicação).
CREATE UNIQUE INDEX idx_articles_source_id ON public.articles (source_id)
WHERE source_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Tabela de tombstones para artigos excluídos do blog
-- ---------------------------------------------------------------------------
CREATE TABLE public.article_ingest_tombstones (
  source_id TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.article_ingest_tombstones ENABLE ROW LEVEL SECURITY;

-- Leitura: staff apenas (consultada pelo cron, não pela UI).
CREATE POLICY tombstones_staff_read ON public.article_ingest_tombstones
  FOR SELECT
  USING (public.is_staff());

-- Escrita: trigger AFTER DELETE (automática); delete manual pela Gestão também.
CREATE POLICY tombstones_staff_write ON public.article_ingest_tombstones
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- Trigger para registrar exclusões de artigos do blog
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS article_delete_tombstone ON public.articles;
CREATE TRIGGER article_delete_tombstone
AFTER DELETE ON public.articles
FOR EACH ROW
WHEN (OLD.origin = 'blog' AND OLD.source_id IS NOT NULL)
EXECUTE FUNCTION public.insert_article_tombstone();

-- Função PL/pgSQL para criar o tombstone.
DROP FUNCTION IF EXISTS public.insert_article_tombstone();
CREATE FUNCTION public.insert_article_tombstone()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.article_ingest_tombstones (source_id)
  VALUES (OLD.source_id)
  ON CONFLICT (source_id) DO NOTHING;
  RETURN NULL;
END;
$$;
