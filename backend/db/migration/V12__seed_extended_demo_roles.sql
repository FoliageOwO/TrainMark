INSERT INTO users (id, organization_id, username, password_hash, name, student_no, teacher_no, email, phone, status) VALUES
  (4, 1, 'owner', 'local-dev-disabled', '刘主任', NULL, 'O2026001', 'owner@trainmark.local', NULL, 'ACTIVE'),
  (5, 1, 'supervisor', 'local-dev-disabled', '陈督导', NULL, 'S2026001', 'supervisor@trainmark.local', NULL, 'ACTIVE')
ON CONFLICT (username) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  name = EXCLUDED.name,
  student_no = EXCLUDED.student_no,
  teacher_no = EXCLUDED.teacher_no,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  updated_at = now();

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users));

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON
  (u.username = 'owner' AND r.code = 'COURSE_OWNER')
  OR (u.username = 'supervisor' AND r.code = 'SUPERVISOR')
WHERE u.username IN ('owner', 'supervisor')
ON CONFLICT DO NOTHING;
