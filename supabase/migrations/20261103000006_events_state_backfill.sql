-- QA L6: eventos presenciais sem estado (o filtro Estado nao os encontrava). UF pela cidade,
-- confirmada pela Lema. Ficam de fora (sem dado seguro): Evento 4UM Acip (Vitoria),
-- APEPREV Invest (2) e o Circuito BB sem cidade. Guarda: so preenche se state ainda for nulo.
UPDATE public.events SET state = 'CE' WHERE id = 'bf2670ec-23e4-53b2-821f-460cc859aca4' AND state IS NULL; -- 14º Congresso Brasileiro de Conselheiros de RPPS (Fortaleza)
UPDATE public.events SET state = 'RS' WHERE id = 'b11bafb2-586d-5217-91c1-45a111c70da7' AND state IS NULL; -- 24º Seminário Sul Brasileiro (Gramado)
UPDATE public.events SET state = 'RN' WHERE id = 'd3e3e5ca-09fc-51f3-b29a-57d2908f18c4' AND state IS NULL; -- Circuito BB (Natal)
UPDATE public.events SET state = 'RN' WHERE id = '544404f6-dee7-52b4-b56f-133e9eb57d6d' AND state IS NULL; -- Congresso Brasileiro ABIPEM (Natal)
UPDATE public.events SET state = 'SC' WHERE id = 'c193f72c-c277-5a66-a642-ed03f65dfa85' AND state IS NULL; -- Evento de Investimentos (Florianópolis)
UPDATE public.events SET state = 'AL' WHERE id = '05a2c11a-78be-5627-b707-03e735a870dc' AND state IS NULL; -- Evento TCE + APPEAL (Maceió)
UPDATE public.events SET state = 'CE' WHERE id = '323bbbec-31f9-57b3-b61e-c9f00be1759e' AND state IS NULL; -- GIRO ABIPEM - Pró-Regularidade (Fortaleza)
UPDATE public.events SET state = 'RJ' WHERE id = '7694fb3d-495a-5754-b05c-c2f6c36d3341' AND state IS NULL; -- Investimentos (Vassouras)
UPDATE public.events SET state = 'AL' WHERE id = '4642e718-54f9-51fa-b4a5-fe500cc40da3' AND state IS NULL; -- Oficina APPEAL (Olho D´água das Flores)
UPDATE public.events SET state = 'SP' WHERE id = '1ae16f98-aacc-5e99-857f-8dcb846c6217' AND state IS NULL; -- Seminário Previdenciário (Votuporanga)
UPDATE public.events SET state = 'PR' WHERE id = '13dc3c39-7514-5e6e-b034-834aee893b84' AND state IS NULL; -- Workshop Contábil/Atuarial (Curitiba)

-- Grafia: o nome usava o acento agudo (´) no lugar do apostrofo.
UPDATE public.events
   SET city = 'Olho d''Água das Flores',
       address = CASE WHEN address = 'Olho D´água das Flores' THEN 'Olho d''Água das Flores' ELSE address END
 WHERE city = 'Olho D´água das Flores';
