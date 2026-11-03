-- QA M6: comentarios e curtidas sao polimorficos (content_type + content_id, sem FK), entao
-- apagar um artigo/noticia/evento/novidade deixava os comentarios e curtidas orfaos
-- (v_comments_with_content devolvia content_title = null).

-- 1) Daqui pra frente: apagar o conteudo apaga os comentarios e curtidas dele.
--    SECURITY DEFINER: quem apaga o conteudo (staff) nao tem policy para apagar o que
--    outros usuarios escreveram.
CREATE OR REPLACE FUNCTION public.delete_content_social()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.comments WHERE content_type = TG_ARGV[0] AND content_id = OLD.id;
  DELETE FROM public.likes    WHERE content_type = TG_ARGV[0] AND content_id = OLD.id;
  RETURN OLD;
END $$;

CREATE TRIGGER articles_delete_social    AFTER DELETE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.delete_content_social('article');
CREATE TRIGGER news_delete_social        AFTER DELETE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.delete_content_social('news');
CREATE TRIGGER events_delete_social      AFTER DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.delete_content_social('event');
CREATE TRIGGER uno_updates_delete_social AFTER DELETE ON public.uno_updates
  FOR EACH ROW EXECUTE FUNCTION public.delete_content_social('uno_update');

-- 2) Limpeza unica do que ja ficou orfao.
DELETE FROM public.comments c WHERE NOT EXISTS (
  SELECT 1 FROM public.articles   t WHERE c.content_type = 'article'    AND t.id = c.content_id
  UNION ALL SELECT 1 FROM public.news        t WHERE c.content_type = 'news'       AND t.id = c.content_id
  UNION ALL SELECT 1 FROM public.events      t WHERE c.content_type = 'event'      AND t.id = c.content_id
  UNION ALL SELECT 1 FROM public.uno_updates t WHERE c.content_type = 'uno_update' AND t.id = c.content_id);
DELETE FROM public.likes l WHERE NOT EXISTS (
  SELECT 1 FROM public.articles   t WHERE l.content_type = 'article'    AND t.id = l.content_id
  UNION ALL SELECT 1 FROM public.news        t WHERE l.content_type = 'news'       AND t.id = l.content_id
  UNION ALL SELECT 1 FROM public.events      t WHERE l.content_type = 'event'      AND t.id = l.content_id
  UNION ALL SELECT 1 FROM public.uno_updates t WHERE l.content_type = 'uno_update' AND t.id = l.content_id);
