-- Multi-selecao de categorias: relacionamento muitos-para-muitos entre
-- eventos e categorias (um evento pode pertencer a varias categorias).

CREATE TABLE public.event_categories (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- Backfill: migra o category_id unico de events para a tabela de relacao.
INSERT INTO public.event_categories (event_id, category_id)
SELECT id, category_id FROM public.events WHERE category_id IS NOT NULL
ON CONFLICT (event_id, category_id) DO NOTHING;

ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Leitura publica; escrita somente super admin (mesmo padrao das demais).
CREATE POLICY event_categories_select ON public.event_categories
  FOR SELECT USING (true);
CREATE POLICY event_categories_write ON public.event_categories
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE INDEX idx_event_categories_category ON public.event_categories(category_id);

-- Remove a coluna unica (agora representada pela tabela de relacao).
-- As views dependem de e.* e precisam ser recriadas (migration 0018 as recria).
DROP INDEX IF EXISTS idx_events_category;
DROP VIEW IF EXISTS public.v_past_events;
DROP VIEW IF EXISTS public.v_ongoing_events;
ALTER TABLE public.events DROP COLUMN IF EXISTS category_id;
