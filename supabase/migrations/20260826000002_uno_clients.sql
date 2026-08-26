-- Dashboard UNO multi-cliente (item 1).
--
-- O outer_api do UNO nao tem endpoint de "listar clientes" (todo endpoint ja
-- exige saber o client_id de antemao — ver api_uno.yml). Por isso a lista de
-- clientes reais nao pode ser buscada dinamicamente do UNO: mantemos uma
-- tabela propria, cadastrada manualmente pela LEMA a cada novo Cliente Lema
-- vinculado, com o client_id real do UNO.

CREATE TABLE public.uno_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uno_client_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.uno_clients (uno_client_id, name) VALUES ('192', 'Demonstração Lema');

ALTER TABLE public.uno_clients ENABLE ROW LEVEL SECURITY;

-- Leitura liberada a qualquer Cliente Lema/staff/super admin: o combobox de
-- clientes (Super Admin) e o vinculo do proprio usuario precisam ler esta
-- tabela.
CREATE POLICY uno_clients_select ON public.uno_clients
  FOR SELECT
  USING (public.is_uno_client() OR public.is_staff());

-- Escrita (cadastro de novos clientes) apenas pelo tier staff.
CREATE POLICY uno_clients_write ON public.uno_clients
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Vinculo do perfil a um cliente UNO real. Nulo = ainda nao vinculado (o
-- Dashboard UNO fica bloqueado para esse usuario, mesmo com is_uno_client).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS uno_client_id UUID REFERENCES public.uno_clients(id) ON DELETE SET NULL;
