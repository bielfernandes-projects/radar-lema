-- Indices para otimizar consultas frequentes.
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_event ON public.event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event_date ON public.event_sessions(event_id, start_date);
CREATE INDEX IF NOT EXISTS idx_photos_event ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
-- UNIQUE(user_id, event_id) em favorites ja cria indice em (user_id, event_id).
