-- Bucket publico para capas de artigos do hub.
--
-- Capas eram URLs externas coladas no form (ex.: CDN do LinkedIn), que
-- frequentemente quebravam por hotlink-block / expiração. Com o bucket, a capa
-- fica hospedada na Lema (mesmo padrão do bucket `event-photos`).

INSERT INTO storage.buckets (id, name, public)
VALUES ('article-covers', 'article-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura publica no bucket article-covers.
DROP POLICY IF EXISTS article_covers_public_read ON storage.objects;
CREATE POLICY article_covers_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'article-covers');

-- Escrita apenas pelo tier staff (mesmo controle do event-photos).
DROP POLICY IF EXISTS article_covers_staff_write ON storage.objects;
CREATE POLICY article_covers_staff_write ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'article-covers'
    AND auth.role() = 'authenticated'
    AND public.is_staff()
  );

-- Delete apenas pelo tier staff.
DROP POLICY IF EXISTS article_covers_staff_delete ON storage.objects;
CREATE POLICY article_covers_staff_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'article-covers'
    AND public.is_staff()
  );
