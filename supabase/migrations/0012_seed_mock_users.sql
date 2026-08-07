-- Usuarios mockados para autenticacao no prototipo.
-- Senha de ambos: lema123 (hash bcrypt no formato $2a$ gerado pelo Supabase Auth).
--
-- Nota: inserir diretamente em auth.users funciona em `supabase db reset` local,
-- mas pode nao ser suficiente no Supabase cloud (GoTrue tambem precisa da identidade).
-- Em ambientes cloud, use o script scripts/seed-mock-users.mjs apos o push.

-- Admin super admin.
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '6ea73c10-8875-4a17-ac53-e9f51e1db777',
  'authenticated',
  'authenticated',
  'admin@lema.com',
  '$2a$10$0xfGYQz.qnUvUUaNlDsEPeq7/QY3Wjqa16CrX7JV65JF3ak.LsAwW',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Lema","user_type":"super_admin","role":"ROLE_SUPER_ADMIN"}',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Cliente visualizador.
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  'e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde',
  'authenticated',
  'authenticated',
  'dirigente@lema.com',
  '$2a$10$0xfGYQz.qnUvUUaNlDsEPeq7/QY3Wjqa16CrX7JV65JF3ak.LsAwW',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Dirigente RPPS","user_type":"client","role":"ROLE_VIEWER"}',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Identidades exigidas pelo GoTrue para login por senha.
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
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
    'email',
    now(),
    now(),
    now()
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
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Perfis correspondentes (fallback caso o trigger nao dispare).
INSERT INTO public.profiles (id, email, name, user_type, role) VALUES
  ('6ea73c10-8875-4a17-ac53-e9f51e1db777', 'admin@lema.com', 'Admin Lema', 'super_admin', 'ROLE_SUPER_ADMIN'),
  ('e7b8b2bd-db0d-4ca3-85f8-0dcc4f6f9cde', 'dirigente@lema.com', 'Dirigente RPPS', 'client', 'ROLE_VIEWER')
ON CONFLICT (id) DO NOTHING;
