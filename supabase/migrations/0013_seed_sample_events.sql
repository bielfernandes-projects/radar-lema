-- Eventos de exemplo para o prototipo.
-- Usa subquery por nome de categoria para nao depender de UUIDs fixos.

WITH admin_profile AS (
  SELECT id FROM public.profiles WHERE email = 'admin@lema.com' LIMIT 1
)
INSERT INTO public.events (
  id, title, description, modality, category_id, is_free, price_from,
  city, state, address, url, is_recurring, recurrence_freq, recurrence_until,
  created_by
) VALUES
  (
    '2ef68360-303c-48a8-958d-493bd90f8e17',
    'Comitê de Investimentos',
    'Reuniao semanal do comite de investimentos para RPPS. Discussao de alocacao, macros e oportunidades.',
    'online',
    (SELECT id FROM public.categories WHERE name = 'Comitê'),
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    'https://lema.vc/inscricao-comite',
    true,
    'semanal',
    '2026-12-31',
    (SELECT id FROM admin_profile)
  ),
  (
    '53d095e2-8b94-4516-9239-c5c48842dce3',
    'Congresso de RPPS 2026',
    'Maior congresso de RPPS do ano, com palestras nacionais e internacionais sobre governanca e investimentos.',
    'presencial',
    (SELECT id FROM public.categories WHERE name = 'Congresso'),
    false,
    500.00,
    'Sao Paulo',
    'SP',
    'Av. Paulista, 1000 - Bela Vista, Sao Paulo - SP',
    'https://lema.vc/inscricao-congresso',
    false,
    NULL,
    NULL,
    (SELECT id FROM admin_profile)
  ),
  (
    '881d7bee-af7c-4d7b-bf95-b72f2bd96373',
    'Workshop de Análise Macroeconômica',
    'Workshop pratico de analise macroeconomica aplicada a investimentos de RPPS.',
    'presencial',
    (SELECT id FROM public.categories WHERE name = 'Workshop'),
    false,
    350.00,
    'Sao Paulo',
    'SP',
    'Rua Augusta, 500 - Consolacao, Sao Paulo - SP',
    'https://lema.vc/inscricao-workshop',
    false,
    NULL,
    NULL,
    (SELECT id FROM admin_profile)
  ),
  (
    'b07520bf-cb66-461d-9eaa-f156042bc48e',
    'Live: Cenário Econômico da Semana',
    'Live semanal com comentarios sobre o cenario economico e os impactos para RPPS.',
    'online',
    (SELECT id FROM public.categories WHERE name = 'Live/Webinar'),
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    'https://lema.vc/live-cenario',
    false,
    NULL,
    NULL,
    (SELECT id FROM admin_profile)
  ),
  (
    'e85e09f5-be32-4a27-9bcb-042f5bd2c65f',
    'Seminário de Governança',
    'Seminario sobre boas praticas de governanca para RPPS, com cases e debates.',
    'hibrido',
    (SELECT id FROM public.categories WHERE name = 'Seminário'),
    false,
    300.00,
    'Brasilia',
    'DF',
    'Setor Comercial Sul, Quadra 6 - Brasilia - DF',
    'https://lema.vc/inscricao-governanca',
    false,
    NULL,
    NULL,
    (SELECT id FROM admin_profile)
  ),
  (
    'cc70fea6-d24b-4309-984a-f1fd506ed008',
    'Curso de ALM para RPPS',
    'Curso online em tres sessoes sobre Asset Liability Management para RPPS.',
    'online',
    (SELECT id FROM public.categories WHERE name = 'Curso'),
    false,
    800.00,
    NULL,
    NULL,
    NULL,
    'https://lema.vc/inscricao-alm',
    false,
    NULL,
    NULL,
    (SELECT id FROM admin_profile)
  )
ON CONFLICT (id) DO NOTHING;

-- Sessoes dos eventos.
INSERT INTO public.event_sessions (event_id, start_date, start_time, end_date, end_time, recurrence_instance) VALUES
  -- Comite: toda segunda-feira as 10h, ate 31/12/2026 (4 sessoes de exemplo).
  ('2ef68360-303c-48a8-958d-493bd90f8e17', '2026-08-10', '10:00', '2026-08-10', '11:30', true),
  ('2ef68360-303c-48a8-958d-493bd90f8e17', '2026-08-17', '10:00', '2026-08-17', '11:30', true),
  ('2ef68360-303c-48a8-958d-493bd90f8e17', '2026-08-24', '10:00', '2026-08-24', '11:30', true),
  ('2ef68360-303c-48a8-958d-493bd90f8e17', '2026-08-31', '10:00', '2026-08-31', '11:30', true),

  -- Congresso: 2 dias.
  ('53d095e2-8b94-4516-9239-c5c48842dce3', '2026-09-15', '09:00', '2026-09-15', '18:00', false),
  ('53d095e2-8b94-4516-9239-c5c48842dce3', '2026-09-16', '09:00', '2026-09-16', '18:00', false),

  -- Workshop: 1 dia.
  ('881d7bee-af7c-4d7b-bf95-b72f2bd96373', '2026-08-05', '09:00', '2026-08-05', '17:00', false),

  -- Live: 1 sessao.
  ('b07520bf-cb66-461d-9eaa-f156042bc48e', '2026-07-17', '18:00', '2026-07-17', '19:00', false),

  -- Seminario: 1 dia.
  ('e85e09f5-be32-4a27-9bcb-042f5bd2c65f', '2026-08-20', '09:00', '2026-08-20', '17:00', false),

  -- Curso: 3 sessoes.
  ('cc70fea6-d24b-4309-984a-f1fd506ed008', '2026-09-01', '19:00', '2026-09-01', '21:00', false),
  ('cc70fea6-d24b-4309-984a-f1fd506ed008', '2026-09-08', '19:00', '2026-09-08', '21:00', false),
  ('cc70fea6-d24b-4309-984a-f1fd506ed008', '2026-09-15', '19:00', '2026-09-15', '21:00', false);

-- Fotos placeholder publicas (apenas URLs estaticas, sem upload nesta fase).
INSERT INTO public.event_photos (event_id, public_url, "order") VALUES
  ('2ef68360-303c-48a8-958d-493bd90f8e17', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80', 0),
  ('53d095e2-8b94-4516-9239-c5c48842dce3', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', 0),
  ('881d7bee-af7c-4d7b-bf95-b72f2bd96373', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80', 0),
  ('b07520bf-cb66-461d-9eaa-f156042bc48e', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80', 0),
  ('e85e09f5-be32-4a27-9bcb-042f5bd2c65f', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', 0),
  ('cc70fea6-d24b-4309-984a-f1fd506ed008', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', 0);
