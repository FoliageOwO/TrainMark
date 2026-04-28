INSERT INTO roles (code, name) VALUES
  ('STUDENT', '学生'),
  ('TEACHER', '教师'),
  ('COURSE_OWNER', '课程负责人'),
  ('SUPERVISOR', '督导/系主任'),
  ('ADMIN', '系统管理员')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name) VALUES
  ('course:read', '查看课程'),
  ('course:write', '管理课程'),
  ('assignment:read', '查看任务'),
  ('assignment:write', '管理任务'),
  ('submission:upload', '上传报告'),
  ('submission:review', '复核报告'),
  ('grade:publish', '发布成绩'),
  ('analytics:read', '查看统计分析'),
  ('admin:manage', '系统管理')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('course:read', 'assignment:read', 'submission:upload')
WHERE r.code = 'STUDENT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('course:read', 'course:write', 'assignment:read', 'assignment:write', 'submission:review', 'grade:publish', 'analytics:read')
WHERE r.code IN ('TEACHER', 'COURSE_OWNER')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('course:read', 'assignment:read', 'analytics:read')
WHERE r.code = 'SUPERVISOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;
