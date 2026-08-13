-- Hub da Lema — Fase 7 (melhoria): adiciona tópico às notícias para filtro por assunto
-- tópicos sugeridos: 'rpps', 'economia', 'investimentos', 'regulamentacao', 'mercado', 'outros'

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS topic TEXT;

-- Índice para consultas por tópico
CREATE INDEX IF NOT EXISTS idx_news_topic ON public.news (topic);

-- Atualiza news-ingest para popular topic baseado em keywords da query (será feito no código)
-- Comentário: a function news-ingest (edge function) deve ser atualizada para setar topic