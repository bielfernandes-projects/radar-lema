-- SEC-005: remove contas mock com senha publica do projeto cloud.
--
-- As contas admin@lema.com (super_admin) e dirigente@lema.com tinham a senha
-- 'lema123' documentada em migrations/scripts/README. Se algum dia o push ou o
-- script de seed rodou contra o projeto cloud, essas contas existem la com
-- senha publicamente conhecida. Esta migration as remove do ambiente de
-- producao (nao faz nada quando as contas nao existem).
--
-- Em ambiente local (`supabase db reset`), o seed.sql (que roda DEPOIS das
-- migrations) recria as contas mock para o prototipo.

DELETE FROM auth.users
WHERE email IN ('admin@lema.com', 'dirigente@lema.com');

-- Caso a identidade/profiler fique orfa (DELETE em auth.users deve ter
-- limpado via FK, mas garantimos por seguranca).
DELETE FROM public.profiles
WHERE email IN ('admin@lema.com', 'dirigente@lema.com');