-- Add unique constraint on source_id for blog-ingest upsert
-- This replaces the previous unique index which doesn't work with onConflict in Supabase JS

-- Drop the index if it exists
DROP INDEX IF EXISTS public.idx_articles_source_id;

-- Add the unique constraint
ALTER TABLE public.articles
ADD CONSTRAINT articles_source_id_unique UNIQUE (source_id);
