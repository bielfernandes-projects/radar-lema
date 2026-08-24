-- Schedule blog-ingest cron job to run 3x per day
-- UTC: 10:00, 16:00, 22:00 (Fortaleza: 07:00, 13:00, 19:00)
-- 
-- NOTE: Before running this migration, ensure that:
-- 1. SERVICE_ROLE_KEY is set as an environment variable in Supabase
-- 2. The blog-ingest edge function is deployed
-- 3. pg_cron extension is enabled
--
-- This job can be managed via Supabase Dashboard > Database > Cron Jobs

-- Uncomment and run manually via Supabase Studio SQL Editor:
-- SELECT cron.schedule(
--   'radar-blog-ingest',
--   '0 10,16,22 * * *',
--   'SELECT net.http_post(
--     url := current_setting(''app.supabase_url'') || ''/functions/v1/blog-ingest'',
--     headers := jsonb_build_object(
--       ''Authorization'', ''Bearer '' || current_setting(''app.service_role_key'')
--     ),
--     body := ''''
--   ) as request_id;'
-- );

-- Placeholder migration to track that cron was scheduled
-- The actual cron scheduling is done via Supabase Dashboard or manual SQL execution
SELECT 1;
