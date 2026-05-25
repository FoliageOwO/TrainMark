ALTER TABLE notification_events
  ADD COLUMN IF NOT EXISTS title VARCHAR(160),
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_url VARCHAR(500);

UPDATE notification_events
SET
  title = COALESCE(title, '通知'),
  event_type = COALESCE(event_type, 'REMINDER'),
  target_url = COALESCE(target_url, CASE
    WHEN assignment_id IS NOT NULL THEN '/tasks/' || assignment_id
    ELSE NULL
  END)
WHERE title IS NULL OR event_type IS NULL OR target_url IS NULL;

ALTER TABLE notification_events
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_events_unread
  ON notification_events(recipient_id, is_read, created_at DESC);
