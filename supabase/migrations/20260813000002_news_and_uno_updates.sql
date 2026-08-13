-- Hub da Lema — Fase 2 (Vitrine).
--
-- Tabelas de conteudo do hub:
--   news        — noticias de mercado ingeridas automaticamente da NewsAPI
--                 pela Edge Function agendada `news-ingest`. Nao tem autor
--                 Lema nem visibilidade restrita (sempre public).
--   uno_updates — novidades do sistema UNO escritas pelo staff (tipo:
--                 atualizacao/manutencao/bug/instabilidade). Visivel para
--                 todos (serve de captacao).

-- ---------------------------------------------------------------------------
-- news
-- ---------------------------------------------------------------------------
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- url unico evita duplicata na ingestao (upsert).
ALTER TABLE public.news ADD CONSTRAINT news_url_unique UNIQUE (url);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY news_select ON public.news
  FOR SELECT USING (true);

CREATE POLICY news_write ON public.news
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_news_published_at ON public.news (published_at DESC);

-- ---------------------------------------------------------------------------
-- uno_updates
-- ---------------------------------------------------------------------------
CREATE TABLE public.uno_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'atualizacao',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uno_updates_type_check
    CHECK (type IN ('atualizacao', 'manutencao', 'bug', 'instabilidade'))
);

ALTER TABLE public.uno_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY uno_updates_select ON public.uno_updates
  FOR SELECT USING (true);

CREATE POLICY uno_updates_write ON public.uno_updates
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_uno_updates_created_at ON public.uno_updates (created_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger de updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS uno_updates_touch ON public.uno_updates;
CREATE TRIGGER uno_updates_touch
BEFORE UPDATE ON public.uno_updates
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();
