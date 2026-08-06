-- Fase C: motor de disparo automatico.
-- 1) notification_outbox: eventos novos confirmados aguardando aviso push
--    por categoria. A Edge Function agendada (notification-scheduler) le e
--    chama send-push, marcando dispatched_at.
-- 2) reminder_dispatch: registro de lembrete ja disparado (por sessao), para
--    o scheduler nao reenviar. A janela de disparo e ~1 min antes do inicio.
-- 3) get_due_reminders(): RPC que retorna os lembretes push vencidos nao
--    enviados ainda.

-- ---------------------------------------------------------------------------
-- Outbox de eventos novos
-- ---------------------------------------------------------------------------
CREATE TABLE public.notification_outbox (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
-- Sem policies: tabela interna, acessada apenas pela role service_role
-- (Edge Function) e pelos triggers SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.queue_new_event_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_outbox (event_id)
  VALUES (NEW.id)
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_new_event_on_insert ON public.events;
CREATE TRIGGER queue_new_event_on_insert
AFTER INSERT ON public.events
FOR EACH ROW
WHEN (NEW.is_confirmed IS NOT FALSE)
EXECUTE FUNCTION public.queue_new_event_notification();

DROP TRIGGER IF EXISTS queue_new_event_on_confirm ON public.events;
CREATE TRIGGER queue_new_event_on_confirm
AFTER UPDATE OF is_confirmed ON public.events
FOR EACH ROW
WHEN (NEW.is_confirmed IS NOT FALSE AND OLD.is_confirmed IS FALSE)
EXECUTE FUNCTION public.queue_new_event_notification();

CREATE INDEX idx_notification_outbox_pending
  ON public.notification_outbox (dispatched_at)
  WHERE dispatched_at IS NULL;

-- ---------------------------------------------------------------------------
-- Registro de disparo de lembretes
-- ---------------------------------------------------------------------------
CREATE TABLE public.reminder_dispatch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  offset_minutes INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'push',
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reminder_dispatch_unique
    UNIQUE (user_id, event_id, session_id, offset_minutes, channel)
);

ALTER TABLE public.reminder_dispatch ENABLE ROW LEVEL SECURITY;
-- Sem policies: tabela interna da Edge Function (service_role).

CREATE INDEX idx_reminder_dispatch_user ON public.reminder_dispatch(user_id);

-- ---------------------------------------------------------------------------
-- RPC: lembretes push vencidos nao enviados
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_due_reminders()
RETURNS TABLE (
  user_id UUID,
  event_id UUID,
  event_title TEXT,
  session_id UUID,
  offset_minutes INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    er.user_id,
    er.event_id,
    e.title::text AS event_title,
    s.id AS session_id,
    er.offset_minutes
  FROM public.event_reminders er
  JOIN public.events e ON e.id = er.event_id
  JOIN public.event_sessions s ON s.event_id = er.event_id
  WHERE er.channel = 'push'
    AND now() >= (s.start_date + s.start_time) AT TIME ZONE 'America/Sao_Paulo' - (er.offset_minutes || ' minutes')::interval
    AND now() < (s.start_date + s.start_time) AT TIME ZONE 'America/Sao_Paulo' - (er.offset_minutes || ' minutes')::interval + interval '2 minutes'
    AND NOT EXISTS (
      SELECT 1
      FROM public.reminder_dispatch rd
      WHERE rd.user_id = er.user_id
        AND rd.event_id = er.event_id
        AND rd.session_id = s.id
        AND rd.offset_minutes = er.offset_minutes
        AND rd.channel = 'push'
    )
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.get_due_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_due_reminders() TO service_role;
