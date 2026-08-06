-- Motor de disparo automatico: a Edge Function notification-scheduler roda a
-- cada minuto via pg_cron + pg_net (mecanismo oficial do Supabase para
-- funcoes agendadas).
--
-- Somente as extensoes sao criadas aqui. O job do cron e registrado em
-- deploy (nao versionado) porque a chamada HTTP autentica com a service role
-- key, que nao pode ficar gravada no repositorio.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
