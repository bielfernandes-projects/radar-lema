-- O Dashboard UNO passou a usar a rota dashboardCliente (sem ComDinheiro),
-- então a cópia guardada em uno_cache não é mais usada.
drop table if exists public.uno_cache;
