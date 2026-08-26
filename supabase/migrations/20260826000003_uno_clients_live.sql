-- Substitui a tabela uno_clients (mantida manualmente) pelos endpoints reais
-- do UNO, descobertos com acesso ao codebase do UNO: outer_api/clientesUNO
-- lista todos os clientes do consulting_id (so precisa da mesma chave de
-- integracao que ja usamos), e outer_api/clienteUNO devolve um so. Nao
-- precisamos mais espelhar isso numa tabela local — profiles.uno_client_id
-- passa a guardar o client_id real do UNO direto (texto), em vez de uma FK
-- para uma copia manual.
--
-- Postgres nao aceita subquery correlacionada em `ALTER COLUMN ... USING`,
-- entao a conversao e feita via coluna nova + backfill + troca de nome.

ALTER TABLE public.profiles ADD COLUMN uno_client_id_text TEXT;

UPDATE public.profiles p
SET uno_client_id_text = uc.uno_client_id
FROM public.uno_clients uc
WHERE uc.id = p.uno_client_id;

ALTER TABLE public.profiles DROP COLUMN uno_client_id;
ALTER TABLE public.profiles RENAME COLUMN uno_client_id_text TO uno_client_id;

DROP TABLE public.uno_clients;
