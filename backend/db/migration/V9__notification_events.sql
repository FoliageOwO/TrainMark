CREATE TABLE IF NOT EXISTS notification_events (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
  recipient_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  channel VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL,
  message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_assignment ON notification_events(assignment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_recipient ON notification_events(recipient_id, created_at DESC);
