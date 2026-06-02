-- Upgrade legacy local-dev seed passwords to BCrypt hash of "trainmark".
-- Keeps old rows usable after auth-service password hardening.
UPDATE users
SET password_hash = '$2a$10$rYQxUTNf6Dji2S9KuX3s8Onf9cWz6YKfA18Qqj7jLQzjQwimeISF2',
    updated_at = now()
WHERE username IN ('teacher', 'admin', '2024010101', 'owner', 'supervisor')
  AND (password_hash = 'local-dev-disabled' OR password_hash LIKE 'plain:%');
