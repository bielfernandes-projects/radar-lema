-- Renomeia a coluna "order" (palavra reservada do PostgREST) para sort_order.
ALTER TABLE public.event_photos RENAME COLUMN "order" TO sort_order;
