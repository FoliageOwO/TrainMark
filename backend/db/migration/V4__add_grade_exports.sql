CREATE TABLE grade_exports (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(20) NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  download_url VARCHAR(500) NOT NULL,
  status VARCHAR(40) NOT NULL,
  operator_name VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grade_exports_assignment_created ON grade_exports(assignment_id, created_at DESC);
