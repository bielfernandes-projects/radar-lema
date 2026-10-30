-- Cache servidor das respostas do UNO que gastam pageview do ComDinheiro
-- (demonstrativoFundosCliente e evolucaoAnualCliente). Só a Edge Function uno-proxy
-- acessa (service role); RLS ligada e sem policy = nenhum acesso pelo app.
create table if not exists public.uno_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.uno_cache enable row level security;
