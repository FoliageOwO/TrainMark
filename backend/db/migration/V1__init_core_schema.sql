CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES organizations(id),
  name VARCHAR(120) NOT NULL,
  type VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id),
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(80) NOT NULL,
  student_no VARCHAR(80),
  teacher_no VARCHAR(80),
  email VARCHAR(160),
  phone VARCHAR(40),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permissions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE role_permissions (
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  semester VARCHAR(80) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  owner_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teaching_classes (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  major VARCHAR(120),
  grade VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, name)
);

CREATE TABLE class_students (
  class_id BIGINT NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE course_members (
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(40) NOT NULL,
  PRIMARY KEY (course_id, user_id, member_role)
);

CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  similarity_check_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_grading_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignment_classes (
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  class_id BIGINT NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, class_id)
);

CREATE TABLE rubrics (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rubric_items (
  id BIGSERIAL PRIMARY KEY,
  rubric_id BIGINT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  score INTEGER NOT NULL,
  course_outcome_code VARCHAR(40),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (assignment_id, student_id, version)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id BIGINT REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(80),
  detail JSONB,
  ip_address VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_courses_owner ON courses(owner_id);
CREATE INDEX idx_classes_course ON teaching_classes(course_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);
CREATE INDEX idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
