-- SEC-003: evita stored XSS via event.url (esquema javascript:/data:).
--
-- O campo url e renderizado em <a href> no detalhe do evento. Sem validacao de
-- esquema, um evento malicioso com url = 'javascript:...' executaria script no
-- browser de todos os visitantes. Aqui garantimos no banco que a url so aceita
-- http(s).

-- Eventos novos/atualizados precisam de url http(s) quando preenchida.
ALTER TABLE public.events
  ADD CONSTRAINT chk_events_url_http_s
  CHECK (url IS NULL OR url ~* '^https?://');

-- Trigger de defesa em profundidade (falha explicita com mensagem clara).
CREATE OR REPLACE FUNCTION public.require_safe_event_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.url IS NOT NULL AND NEW.url !~* '^https?://' THEN
    RAISE EXCEPTION 'url do evento deve comecar com http:// ou https://';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_url_safe ON public.events;
CREATE TRIGGER trg_event_url_safe
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.require_safe_event_url();