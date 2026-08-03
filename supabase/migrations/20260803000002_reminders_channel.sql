-- Lembretes: offsets livres (qualquer antecedencia em minutos) e canal
-- de envio (push ou email). O mesmo offset pode existir nos dois canais.

ALTER TABLE public.event_reminders DROP CONSTRAINT IF EXISTS event_reminders_offset_minutes_check;
ALTER TABLE public.event_reminders
  ADD CONSTRAINT event_reminders_offset_minutes_check CHECK (offset_minutes > 0);

ALTER TABLE public.event_reminders DROP CONSTRAINT IF EXISTS event_reminders_user_id_event_id_offset_minutes_key;
ALTER TABLE public.event_reminders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'push';
ALTER TABLE public.event_reminders
  ADD CONSTRAINT event_reminders_channel_check CHECK (channel IN ('push', 'email'));
ALTER TABLE public.event_reminders
  ADD CONSTRAINT event_reminders_user_event_offset_channel_key
  UNIQUE (user_id, event_id, offset_minutes, channel);
