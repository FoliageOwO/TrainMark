CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(160) PRIMARY KEY,
  display_name VARCHAR(160) NOT NULL,
  setting_value TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  sensitive BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO system_settings (setting_key, display_name, setting_value, category, sensitive) VALUES
  ('ai.ocr.provider', 'OCR Provider', 'LOCAL_DETERMINISTIC', 'AI', false),
  ('ai.scoring.provider', 'Scoring Provider', 'LOCAL_RULES', 'AI', false),
  ('upload.max-file-size-mb', 'Max Upload Size', '50', 'FILE', false),
  ('export.retention-days', 'Export Retention', '30', 'EXPORT', false),
  ('notification.default-channels', 'Default Reminder Channels', 'IN_APP,EMAIL,WECHAT_WORK', 'NOTIFICATION', false),
  ('security.jwt-secret', 'JWT Secret', 'trainmark_dev_secret', 'SECURITY', true)
ON CONFLICT (setting_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  setting_value = EXCLUDED.setting_value,
  category = EXCLUDED.category,
  sensitive = EXCLUDED.sensitive,
  updated_at = now();

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
