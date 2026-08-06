-- Todos os eventos passam a exibir a imagem placeholder public/placeholder-event.png.
-- Remove as fotos cadastradas para que o fallback do frontend assuma.
-- Arquivos no storage (events/*) ficam orfaos no bucket (nao sao apagados).
DELETE FROM public.event_photos;
