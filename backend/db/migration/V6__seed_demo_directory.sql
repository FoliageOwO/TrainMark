INSERT INTO organizations (id, parent_id, name, type) VALUES
  (1, NULL, '信息工程学院', 'COLLEGE'),
  (2, 1, '软件技术', 'MAJOR'),
  (3, 2, '软件2401班', 'CLASS')
ON CONFLICT (id) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  updated_at = now();

SELECT setval(pg_get_serial_sequence('organizations', 'id'), (SELECT max(id) FROM organizations));

INSERT INTO users (id, organization_id, username, password_hash, name, student_no, teacher_no, email, phone, status) VALUES
  (1, 1, 'teacher', 'local-dev-disabled', '王老师', NULL, 'T2026001', 'teacher@trainmark.local', NULL, 'ACTIVE'),
  (2, 3, '2024010101', 'local-dev-disabled', '张三', '2024010101', NULL, 'student@trainmark.local', NULL, 'ACTIVE'),
  (3, 1, 'admin', 'local-dev-disabled', '系统管理员', NULL, NULL, 'admin@trainmark.local', NULL, 'ACTIVE')
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
  (u.username = 'teacher' AND r.code = 'TEACHER')
  OR (u.username = '2024010101' AND r.code = 'STUDENT')
  OR (u.username = 'admin' AND r.code = 'ADMIN')
WHERE u.username IN ('teacher', '2024010101', 'admin')
ON CONFLICT DO NOTHING;
