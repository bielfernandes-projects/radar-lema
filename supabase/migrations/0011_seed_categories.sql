-- Categorias iniciais de eventos.
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
