-- Materiais de Apoio: todos os materiais devem aparecer para todos os
-- clientes (inclusive os marcados 'lema_client'), com o bloqueio real ficando
-- por conta do clique estar desabilitado no front. Isso exige abrir a
-- listagem da tabela `materials` para qualquer usuario autenticado.
--
-- Como o `storage_path` passa a vir na linha para todo mundo, a leitura do
-- arquivo no bucket nao pode mais depender so de "autenticado" (isso deixaria
-- qualquer usuario baixar um arquivo exclusivo direto pela storage_path,
-- ignorando o front). A policy de leitura do bucket passa a repetir a mesma
-- regra de elegibilidade da tabela, resolvida a partir do storage_path.

DROP POLICY IF EXISTS materials_select ON public.materials;
CREATE POLICY materials_select ON public.materials
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS materials_authenticated_read ON storage.objects;
CREATE POLICY materials_authenticated_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'materials'
    AND EXISTS (
      SELECT 1 FROM public.materials m
      WHERE m.storage_path = storage.objects.name
        AND (
          m.visibility = 'public'
          OR public.is_uno_client()
          OR public.is_staff()
        )
    )
  );
