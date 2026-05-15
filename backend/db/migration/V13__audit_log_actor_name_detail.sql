ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_name VARCHAR(120);

ALTER TABLE audit_logs
  ALTER COLUMN detail TYPE TEXT
  USING CASE
    WHEN detail IS NULL THEN NULL
    WHEN jsonb_typeof(detail) = 'string' THEN detail #>> '{}'
    ELSE detail::text
  END;
