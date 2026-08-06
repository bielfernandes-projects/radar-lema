-- Evento "Não definido" (a definir): eventos podem ser cadastrados sem ainda
-- estarem confirmados para publicacao. Enquanto is_confirmed = false, o evento
-- so e visivel para staff; clientes RPPS nao conseguem le-lo em nenhuma
-- listagem, nem por URL direta (RLS) nem pelas views (SECURITY INVOKER).

-- Coluna em events: confirmado por padrao (eventos existentes e novos nascem visiveis).
ALTER TABLE public.events
  ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT true;

-- Helper: retorna true se o usuario autenticado for staff (cadastra eventos).
-- Diferente de is_super_admin(): considera todo user_type = 'staff', nao so a role SUPER_ADMIN.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT user_type = 'staff'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- events: leitura de nao confirmados apenas para staff; escrita continua super admin.
DROP POLICY IF EXISTS events_select ON public.events;
CREATE POLICY events_select ON public.events
  FOR SELECT
  USING (is_confirmed = true OR public.is_staff());

DROP POLICY IF EXISTS events_write ON public.events;
CREATE POLICY events_write ON public.events
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
