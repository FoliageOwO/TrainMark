CREATE TABLE submission_files (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  object_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(120),
  file_size BIGINT,
  sha256 VARCHAR(64),
  preview_url VARCHAR(500),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rubric_points (
  id BIGSERIAL PRIMARY KEY,
  rubric_item_id BIGINT NOT NULL REFERENCES rubric_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  score INTEGER NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ocr_jobs (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  submission_file_id BIGINT REFERENCES submission_files(id) ON DELETE SET NULL,
  object_key VARCHAR(255) NOT NULL,
  status VARCHAR(40) NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  text_block_count INTEGER NOT NULL DEFAULT 0,
  table_count INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ocr_blocks (
  id BIGSERIAL PRIMARY KEY,
  ocr_job_id BIGINT NOT NULL REFERENCES ocr_jobs(id) ON DELETE CASCADE,
  block_type VARCHAR(40) NOT NULL,
  title VARCHAR(255),
  page INTEGER NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 0,
  text_content TEXT,
  bbox JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE grading_jobs (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  rubric_id BIGINT REFERENCES rubrics(id) ON DELETE SET NULL,
  status VARCHAR(40) NOT NULL,
  total_submission_count INTEGER NOT NULL DEFAULT 0,
  processed_submission_count INTEGER NOT NULL DEFAULT 0,
  failed_submission_count INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES users(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grading_results (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  grading_job_id BIGINT REFERENCES grading_jobs(id) ON DELETE SET NULL,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annotation_pdf_url VARCHAR(500),
  total_score INTEGER NOT NULL DEFAULT 100,
  ai_score INTEGER NOT NULL DEFAULT 0,
  teacher_score INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  review_status VARCHAR(40) NOT NULL,
  publication_status VARCHAR(40) NOT NULL,
  overall_comment TEXT,
  reviewed_by BIGINT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  published_by BIGINT REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id)
);

CREATE TABLE grading_result_items (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES grading_results(id) ON DELETE CASCADE,
  rubric_item_id BIGINT NOT NULL REFERENCES rubric_items(id),
  title VARCHAR(160) NOT NULL,
  max_score INTEGER NOT NULL,
  ai_score INTEGER NOT NULL DEFAULT 0,
  teacher_score INTEGER NOT NULL DEFAULT 0,
  deduction_reason TEXT,
  teacher_comment TEXT,
  confidence INTEGER NOT NULL DEFAULT 0,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (result_id, rubric_item_id)
);

CREATE TABLE grading_annotations (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES grading_results(id) ON DELETE CASCADE,
  page INTEGER NOT NULL,
  anchor_text TEXT,
  comment TEXT NOT NULL,
  severity VARCHAR(40) NOT NULL,
  bbox JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grade_publication_audits (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES grading_results(id) ON DELETE CASCADE,
  action VARCHAR(40) NOT NULL,
  operator_id BIGINT REFERENCES users(id),
  operator_name VARCHAR(80) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grade_appeals (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES grading_results(id) ON DELETE CASCADE,
  rubric_item_id BIGINT REFERENCES rubric_items(id) ON DELETE SET NULL,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  requested_change TEXT NOT NULL,
  status VARCHAR(40) NOT NULL,
  teacher_reply TEXT,
  resolved_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE similarity_jobs (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL,
  checked_submission_count INTEGER NOT NULL DEFAULT 0,
  max_similarity NUMERIC(5, 2) NOT NULL DEFAULT 0,
  high_risk_pair_count INTEGER NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE similarity_matches (
  id BIGSERIAL PRIMARY KEY,
  similarity_job_id BIGINT NOT NULL REFERENCES similarity_jobs(id) ON DELETE CASCADE,
  source_submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  target_submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  similarity NUMERIC(5, 2) NOT NULL,
  matched_section VARCHAR(255),
  risk_level VARCHAR(40) NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grade_statistics_snapshots (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  submitted_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  standard_deviation NUMERIC(6, 2) NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  min_score INTEGER NOT NULL DEFAULT 0,
  difficulty_index NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discrimination_index NUMERIC(5, 2) NOT NULL DEFAULT 0,
  score_buckets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loss_point_snapshots (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  rubric_item_id BIGINT REFERENCES rubric_items(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  course_outcome_code VARCHAR(40),
  average_lost_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  affected_student_count INTEGER NOT NULL DEFAULT 0,
  top_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_outcome_snapshots (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  course_outcome_code VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  target_value NUMERIC(5, 2) NOT NULL,
  achieved_value NUMERIC(5, 2) NOT NULL,
  status VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);
CREATE INDEX idx_rubric_points_item ON rubric_points(rubric_item_id);
CREATE INDEX idx_ocr_jobs_submission ON ocr_jobs(submission_id);
CREATE INDEX idx_ocr_blocks_job ON ocr_blocks(ocr_job_id);
CREATE INDEX idx_grading_jobs_assignment ON grading_jobs(assignment_id);
CREATE INDEX idx_grading_results_assignment_status ON grading_results(assignment_id, review_status, publication_status);
CREATE INDEX idx_grading_results_student ON grading_results(student_id);
CREATE INDEX idx_grading_result_items_result ON grading_result_items(result_id);
CREATE INDEX idx_grading_annotations_result ON grading_annotations(result_id);
CREATE INDEX idx_grade_publication_audits_result ON grade_publication_audits(result_id, created_at DESC);
CREATE INDEX idx_grade_appeals_result_status ON grade_appeals(result_id, status);
CREATE INDEX idx_grade_appeals_student ON grade_appeals(student_id, created_at DESC);
CREATE INDEX idx_similarity_jobs_assignment ON similarity_jobs(assignment_id);
CREATE INDEX idx_similarity_matches_job ON similarity_matches(similarity_job_id);
CREATE INDEX idx_grade_statistics_assignment_created ON grade_statistics_snapshots(assignment_id, created_at DESC);
CREATE INDEX idx_loss_points_assignment ON loss_point_snapshots(assignment_id);
CREATE INDEX idx_course_outcomes_assignment ON course_outcome_snapshots(assignment_id);
