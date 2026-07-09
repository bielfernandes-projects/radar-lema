-- Lembretes por evento favoritado
CREATE TABLE public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  offset_minutes INT NOT NULL CHECK (offset_minutes IN (1440, 60, 30, 10, 5)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_id, offset_minutes)
);

-- Configuracao global de notificacoes por usuario
CREATE TABLE public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,
  categories_enabled TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY reminders_owner ON public.event_reminders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY settings_owner ON public.notification_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_reminders_user_event ON event_reminders(user_id, event_id);
