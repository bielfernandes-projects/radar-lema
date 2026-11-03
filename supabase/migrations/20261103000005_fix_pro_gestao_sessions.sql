-- QA M4: o evento "RPPS de Excelencia: Pro-Gestao e Investimento na Pratica" (APREMAT, edicao
-- 2025) foi cadastrado com as sessoes em 11-13/11/2026; a data correta, confirmada pela Lema,
-- e 11 a 13 de junho de 2025 (o banner ja dizia isso). Guarda no WHERE: so mexe se ainda
-- estiver com a data errada.
UPDATE public.event_sessions SET start_date = '2025-06-11', end_date = '2025-06-11'
 WHERE id = '0022ffc4-52a0-4cc0-8924-851efc9b171f' AND start_date = '2026-11-11';
UPDATE public.event_sessions SET start_date = '2025-06-12', end_date = '2025-06-12'
 WHERE id = 'a4925bee-7088-4cdf-a3ed-defdb897e79c' AND start_date = '2026-11-12';
UPDATE public.event_sessions SET start_date = '2025-06-13', end_date = '2025-06-13'
 WHERE id = '2e2184cf-d7ba-4e02-bd76-9ae606344c90' AND start_date = '2026-11-13';
