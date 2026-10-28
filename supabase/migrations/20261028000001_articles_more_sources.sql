-- Artigos de outras fontes de RPPS (Revista RPPS do Brasil e Panorama RPPS),
-- ingeridos pela Edge Function `articles-ingest`.
--
-- `origin` passa a aceitar as novas fontes; o tombstone vale para qualquer
-- artigo importado (origin <> 'staff'), nao so para o blog da Lema.

ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_origin_check;
ALTER TABLE public.articles
  ADD CONSTRAINT articles_origin_check
  CHECK (origin IN ('staff', 'blog', 'revista', 'panorama'));

DROP TRIGGER IF EXISTS article_delete_tombstone ON public.articles;
CREATE TRIGGER article_delete_tombstone
AFTER DELETE ON public.articles
FOR EACH ROW
WHEN (OLD.origin <> 'staff' AND OLD.source_id IS NOT NULL)
EXECUTE FUNCTION public.insert_article_tombstone();
