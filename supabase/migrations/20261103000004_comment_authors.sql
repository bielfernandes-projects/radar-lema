-- QA L7: o app buscava o autor do comentario em profiles(name), mas o RLS de profiles so deixa
-- cada um ler o proprio perfil — entao todo comentario alheio aparecia como "Usuario".
-- Esta view expoe SO id + nome de quem tem comentario visivel (nada de e-mail, papel etc.).
-- Sem security_invoker de proposito: ela roda com os privilegios do dono para atravessar o RLS.
CREATE OR REPLACE VIEW public.comment_authors AS
SELECT DISTINCT p.id, p.name
FROM public.profiles p
JOIN public.comments c ON c.user_id = p.id
WHERE NOT c.hidden;

REVOKE ALL ON public.comment_authors FROM PUBLIC, anon;
GRANT SELECT ON public.comment_authors TO authenticated;
