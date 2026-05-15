ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_name VARCHAR(120);

DO $$
DECLARE
  detail_type TEXT;
BEGIN
  SELECT data_type INTO detail_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'detail';

  IF detail_type = 'jsonb' THEN
    ALTER TABLE audit_logs
      ALTER COLUMN detail TYPE TEXT
      USING CASE
        WHEN detail IS NULL THEN NULL
        WHEN jsonb_typeof(detail) = 'string' THEN detail #>> '{}'
        ELSE detail::text
      END;
  END IF;
END $$;
