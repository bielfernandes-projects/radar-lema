-- SEC-011: restringe upload de fotos no bucket event-photos a staff.
--
-- ANTES: a policy event_photos_authenticated_write permitia qualquer usuario
-- autenticado (incluindo clientes RPPS) fazer upload no bucket publico, abrindo
-- porta para armazenamento abusivo / arquivos orfaos sem limite.
--
-- DEPOIS: apenas staff/super_admin (via public.is_staff()) pode inserir objetos
-- no bucket. Leitura publica permanece (fotos sao publicas por design).

DROP POLICY IF EXISTS event_photos_authenticated_write ON storage.objects;
CREATE POLICY event_photos_authenticated_write ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-photos'
    AND auth.role() = 'authenticated'
    AND public.is_staff()
  );