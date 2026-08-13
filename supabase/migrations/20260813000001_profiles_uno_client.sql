-- Hub da Lema — Fase 1 (Fundação).
--
-- Cliente Lema (is_uno_client): flag ortogonal ao user_type que libera
-- conteudo exclusivo (artigos/materiais lema_client) e o Dashboard UNO.
-- No prototipo a flag e alternada manualmente pelo super admin no Painel
-- Admin; na integracao com o banco do UNO passa a ser derivada do vinculo
-- da conta (mesmo e-mail).

-- 1) Coluna em profiles: novo perfil nasce sem acesso exclusivo.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_uno_client BOOLEAN NOT NULL DEFAULT false;

-- 2) Helper: o usuario autenticado e Cliente Lema?
--    Usado nas politicas RLS de leitura (articles/materials lema_client) e
--    pela Edge Function uno-proxy. SECURITY DEFINER para ler o proprio
--    perfil mesmo com RLS restritiva de escrita.
CREATE OR REPLACE FUNCTION public.is_uno_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_uno_client
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) RLS: super admin pode atualizar perfis (alterna is_uno_client pelo
--    Painel Admin). O usuario continua sem poder editar o proprio perfil.
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
