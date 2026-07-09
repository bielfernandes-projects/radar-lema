-- Tabela de eventos (agregado principal do dominio).
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'online', 'hibrido')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_free BOOLEAN DEFAULT true,
  price_from NUMERIC(10,2),
  city TEXT,
  state TEXT CHECK (state IS NULL OR LENGTH(state) = 2),
  address TEXT,
  url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_freq TEXT CHECK (recurrence_freq IN ('semanal', 'quinzenal', 'mensal')),
  recurrence_until DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Se recorrente, frequencia e data fim sao obrigatorias.
  CONSTRAINT chk_recurring_requires_freq_and_until
    CHECK (
      is_recurring = false
      OR (is_recurring = true AND recurrence_freq IS NOT NULL AND recurrence_until IS NOT NULL)
    ),

  -- Se gratuito, nao pode ter valor.
  CONSTRAINT chk_free_requires_null_price
    CHECK (is_free = false OR price_from IS NULL)
);
