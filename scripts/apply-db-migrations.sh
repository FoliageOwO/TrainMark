#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-trainmark-postgres}"
POSTGRES_DB="${POSTGRES_DB:-trainmark_ai}"
POSTGRES_USER="${POSTGRES_USER:-trainmark}"

table_exists() {
  local table_name="$1"
  docker exec "$POSTGRES_CONTAINER" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT to_regclass('public.$table_name') IS NOT NULL;" \
    | tr -d '[:space:]'
}

apply_sql() {
  local sql_file="$1"
  echo "[db:migrate] applying $(basename "$sql_file")"
  docker exec -i "$POSTGRES_CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$sql_file"
}

ensure_extended_demo_roles() {
  docker exec -i "$POSTGRES_CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$ROOT_DIR/backend/db/migration/V12__seed_extended_demo_roles.sql" \
    >/dev/null
}

if [[ "$(table_exists users)" == "t" ]]; then
  ensure_extended_demo_roles
  echo "[db:migrate] core schema already present"
  exit 0
fi

echo "[db:migrate] core schema missing; applying local migrations"
while IFS= read -r sql_file; do
  apply_sql "$sql_file"
done < <(find "$ROOT_DIR/backend/db/migration" -maxdepth 1 -name 'V*.sql' | sort -V)

ensure_extended_demo_roles

docker exec "$POSTGRES_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE TABLE IF NOT EXISTS audit_bootstrap (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());" \
  >/dev/null

docker exec "$POSTGRES_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "INSERT INTO audit_bootstrap (message) VALUES ('TrainMark AI database migrations applied') ON CONFLICT DO NOTHING;" \
  >/dev/null

echo "[db:migrate] migrations applied"
