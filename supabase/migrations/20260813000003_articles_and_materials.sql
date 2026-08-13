-- Hub da Lema — Fase 3 (Diferenciais 1 e 2).
--
--   articles  — conteudo editorial da Lema publicado manualmente pelo staff,
--               com visibilidade public/lema_client, corpo em Markdown e
--               source_url opcional (LinkedIn original).
--   materials — materiais de apoio (manuais, resolucoes, guias) com upload de
--               arquivo no bucket `materials` e visibilidade public/lema_client.

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  body TEXT NOT NULL,
  cover_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  source_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT articles_visibility_check
    CHECK (visibility IN ('public', 'lema_client'))
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Leitura: publico ve conteudo publico; Cliente Lema ve publico + exclusivo;
-- staff ve tudo (inclusive o que ainda nao saiu).
CREATE POLICY articles_select ON public.articles
  FOR SELECT
  USING (
    visibility = 'public'
    OR public.is_uno_client()
    OR public.is_staff()
  );

CREATE POLICY articles_write ON public.articles
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_articles_created_at ON public.articles (created_at DESC);

DROP TRIGGER IF EXISTS articles_touch ON public.articles;
CREATE TRIGGER articles_touch
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------------
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT materials_visibility_check
    CHECK (visibility IN ('public', 'lema_client'))
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY materials_select ON public.materials
  FOR SELECT
  USING (
    visibility = 'public'
    OR public.is_uno_client()
    OR public.is_staff()
  );

CREATE POLICY materials_write ON public.materials
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_materials_created_at ON public.materials (created_at DESC);

DROP TRIGGER IF EXISTS materials_touch ON public.materials;
CREATE TRIGGER materials_touch
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Bucket `materials` (privado)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Leitura autenticada: paths sao UUIDs (não adivinhaveis); o que realmente
-- gateia a visibilidade e a RLS da tabela `materials`.
DROP POLICY IF EXISTS materials_authenticated_read ON storage.objects;
CREATE POLICY materials_authenticated_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'materials'
    AND auth.role() = 'authenticated'
  );

-- Escrita apenas pelo tier staff.
DROP POLICY IF EXISTS materials_staff_write ON storage.objects;
CREATE POLICY materials_staff_write ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'materials'
    AND public.is_staff()
  );

DROP POLICY IF EXISTS materials_staff_delete ON storage.objects;
CREATE POLICY materials_staff_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'materials'
    AND public.is_staff()
  );
