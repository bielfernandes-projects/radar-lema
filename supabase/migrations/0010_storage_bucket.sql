-- Bucket publico para fotos de eventos (criado via SQL, nao pelo Dashboard).
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura publica no bucket event-photos.
DROP POLICY IF EXISTS event_photos_public_read ON storage.objects;
CREATE POLICY event_photos_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-photos');

-- Escrita permitida apenas para usuarios autenticados (upload via SDK com JWT).
DROP POLICY IF EXISTS event_photos_authenticated_write ON storage.objects;
CREATE POLICY event_photos_authenticated_write ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-photos'
    AND auth.role() = 'authenticated'
  );
