INSERT INTO courses (id, code, name, semester, description, status, owner_id) VALUES
  (1, 'JAVA-WEB-2026', 'Java Web 综合实训', '2025-2026-2', '默认本地联调课程', 'ACTIVE', 1)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  semester = EXCLUDED.semester,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  owner_id = EXCLUDED.owner_id,
  updated_at = now();

SELECT setval(pg_get_serial_sequence('courses', 'id'), (SELECT max(id) FROM courses));

INSERT INTO teaching_classes (id, course_id, name, major, grade) VALUES
  (1, 1, '软件2401班', '软件技术', '2024'),
  (2, 1, '软件2402班', '软件技术', '2024')
ON CONFLICT (course_id, name) DO UPDATE SET
  major = EXCLUDED.major,
  grade = EXCLUDED.grade,
  updated_at = now();

SELECT setval(pg_get_serial_sequence('teaching_classes', 'id'), (SELECT max(id) FROM teaching_classes));

INSERT INTO class_students (class_id, student_id)
SELECT tc.id, u.id
FROM teaching_classes tc
JOIN users u ON u.username = '2024010101'
WHERE tc.course_id = 1 AND tc.name = '软件2401班'
ON CONFLICT DO NOTHING;

INSERT INTO course_members (course_id, user_id, member_role)
SELECT 1, u.id, 'TEACHER'
FROM users u
WHERE u.username = 'teacher'
ON CONFLICT DO NOTHING;

INSERT INTO assignments (
  id, course_id, title, description, deadline, total_score, status,
  similarity_check_enabled, ai_grading_enabled, created_by
) VALUES (
  1, 1, 'Java Web 综合实训报告', '默认本地联调任务', now() + interval '7 days', 100,
  'PUBLISHED', true, true, 1
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  deadline = EXCLUDED.deadline,
  total_score = EXCLUDED.total_score,
  status = EXCLUDED.status,
  similarity_check_enabled = EXCLUDED.similarity_check_enabled,
  ai_grading_enabled = EXCLUDED.ai_grading_enabled,
  created_by = EXCLUDED.created_by,
  updated_at = now();

SELECT setval(pg_get_serial_sequence('assignments', 'id'), (SELECT max(id) FROM assignments));

INSERT INTO assignment_classes (assignment_id, class_id)
SELECT 1, tc.id
FROM teaching_classes tc
WHERE tc.course_id = 1
ON CONFLICT DO NOTHING;
