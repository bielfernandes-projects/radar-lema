-- Seed do Lema Discovery.
-- Orquestra inserts iniciais: categorias, usuarios mock e eventos de exemplo.
-- Nota: na pratica estes inserts tambem estao versionados nas migrations 0011-0013
-- para garantir reproducibilidade via `supabase db reset`.

-- Categorias iniciais.
INSERT INTO public.categories (id, name) VALUES
  ('fdabc5a4-ccf1-4314-9642-6dd7feddc8c2', 'Comitê'),
  ('e16bdeef-f5f0-488b-b353-cd61050437f0', 'Workshop'),
  ('b15f8dfc-be1b-4c6e-9cf7-7d58a48c8107', 'Live/Webinar'),
  ('ac019fdc-989b-4d44-9ec4-f4d482950757', 'Palestra'),
  ('87b71434-db84-4c79-8f4d-154802d7f427', 'Congresso'),
  ('dbbdc421-66e3-4a1d-9b66-43efc2dc7702', 'Seminário'),
  ('2b8e6298-05e0-4a88-ae87-60520454e7e3', 'Curso'),
  ('0580fb51-18a2-4e9f-baeb-7565a541d461', 'Encontro')
ON CONFLICT (name) DO NOTHING;

-- Usuarios mockados (senha: lema123).
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '6ea73c10-8875-4a17-ac53-e9f51e1db777',
    'authenticated', 'authenticated',
    'admin@lema.com',
    '$2a$10$0xfGYQz.qnUvUUaNlDsEPeq7/QY3Wjqa16CrX7JV65JF3ak.LsAwW',
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin Lema","user_type":"staff","role":"ROLE_SUPER_ADMIN"}',
    now(), now()
  ),
  (
    'e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde',
    'authenticated', 'authenticated',
    'dirigente@lema.com',
    '$2a$10$0xfGYQz.qnUvUUaNlDsEPeq7/QY3Wjqa16CrX7JV65JF3ak.LsAwW',
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dirigente RPPS","user_type":"client","role":"ROLE_DIRIGENTE"}',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (
    gen_random_uuid(),
    '6ea73c10-8875-4a17-ac53-e9f51e1db777',
    '6ea73c10-8875-4a17-ac53-e9f51e1db777',
    jsonb_build_object(
      'sub', '6ea73c10-8875-4a17-ac53-e9f51e1db777',
      'email', 'admin@lema.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(),
    'e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde',
    'e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde',
    jsonb_build_object(
      'sub', 'e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde',
      'email', 'dirigente@lema.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

INSERT INTO public.profiles (id, email, name, user_type, role) VALUES
  ('6ea73c10-8875-4a17-ac53-e9f51e1db777', 'admin@lema.com', 'Admin Lema', 'staff', 'ROLE_SUPER_ADMIN'),
  ('e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde', 'dirigente@lema.com', 'Dirigente RPPS', 'client', 'ROLE_DIRIGENTE')
ON CONFLICT (id) DO NOTHING;

-- Eventos de exemplo (demais sessoes e fotos estao na migration 0013_seed_sample_events.sql).
-- Mantemos aqui apenas os eventos-base para evitar duplicacao complexa no seed.
