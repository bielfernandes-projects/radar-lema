-- Desfaz 20261105000003: o desenho "mini-tour por tela" foi trocado por um unico tour guiado
-- (que percorre o app inteiro e usa so profiles.tutorial_seen_at). Nada aqui e usado pelo app.
DROP FUNCTION IF EXISTS public.mark_tour_seen(text);
DROP FUNCTION IF EXISTS public.set_tips_disabled(boolean);
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tours_seen;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tips_disabled;
