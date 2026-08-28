-- Retenção de notícias de mercado.
--
-- A tabela `news` recebe ingestão de 8 fontes de hora em hora (`news-ingest`)
-- e, sem expurgo, cresceria indefinidamente contra o teto de 500 MB do plano
-- gratuito do Supabase. Mantemos ~6 meses — janela suficiente para um "radar"
-- de mercado; o histórico antigo não é consultado.
--
-- Chamada a cada rodada do `news-ingest` (via RPC). Pode ser agendada
-- separadamente por pg_cron se um dia o ingest parar.

CREATE OR REPLACE FUNCTION public.purge_old_news(retention_days INT DEFAULT 180)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed INTEGER;
BEGIN
  DELETE FROM public.news
  WHERE published_at < now() - make_interval(days => retention_days);
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

-- Só a Edge Function (service_role) expurga; ninguém mais.
REVOKE ALL ON FUNCTION public.purge_old_news(INT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_news(INT) TO service_role;
