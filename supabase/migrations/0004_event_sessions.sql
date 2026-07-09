-- Tabela de sessoes (data/horario especifico dentro de um evento).
CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,
  recurrence_instance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
