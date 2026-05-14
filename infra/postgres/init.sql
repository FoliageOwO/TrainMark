CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\i /docker-entrypoint-initdb.d/migration/V1__init_core_schema.sql
\i /docker-entrypoint-initdb.d/migration/V2__seed_roles_permissions.sql
\i /docker-entrypoint-initdb.d/migration/V3__seed_demo_directory.sql

CREATE TABLE IF NOT EXISTS audit_bootstrap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO audit_bootstrap (message)
VALUES ('TrainMark AI database initialized')
ON CONFLICT DO NOTHING;
