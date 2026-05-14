#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-$BACKUP_ROOT/$TIMESTAMP}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/infra/docker-compose.yml}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-trainmark_ai}"
POSTGRES_USER="${POSTGRES_USER:-trainmark}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-trainmark_dev}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-trainmark}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-trainmark_dev_password}"
MINIO_BUCKET="${MINIO_BUCKET:-trainmark-reports}"
REQUIRE_OBJECT_BACKUP="${REQUIRE_OBJECT_BACKUP:-0}"

mkdir -p "$BACKUP_DIR/minio"

manifest="$BACKUP_DIR/manifest.txt"
postgres_file="$BACKUP_DIR/postgres-${POSTGRES_DB}.dump"
object_target="$BACKUP_DIR/minio/$MINIO_BUCKET"

write_manifest() {
  {
    echo "TrainMark AI backup"
    echo "created_at=$TIMESTAMP"
    echo "env_file=$ENV_FILE"
    echo "postgres_db=$POSTGRES_DB"
    echo "postgres_host=$POSTGRES_HOST"
    echo "postgres_port=$POSTGRES_PORT"
    echo "postgres_dump=$postgres_file"
    echo "minio_endpoint=$MINIO_ENDPOINT"
    echo "minio_bucket=$MINIO_BUCKET"
    echo "minio_target=$object_target"
  } > "$manifest"
}

backup_postgres() {
  echo "[backup] PostgreSQL -> $postgres_file"

  if command -v pg_dump >/dev/null 2>&1; then
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
      --host "$POSTGRES_HOST" \
      --port "$POSTGRES_PORT" \
      --username "$POSTGRES_USER" \
      --format custom \
      --file "$postgres_file" \
      "$POSTGRES_DB"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
      --username "$POSTGRES_USER" \
      --format custom \
      "$POSTGRES_DB" > "$postgres_file"
    return
  fi

  echo "[backup] pg_dump or docker is required for PostgreSQL backup" >&2
  return 1
}

backup_minio() {
  echo "[backup] MinIO bucket $MINIO_BUCKET -> $object_target"

  if command -v mc >/dev/null 2>&1; then
    mc alias set trainmark "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
    mc mirror --overwrite "trainmark/$MINIO_BUCKET" "$object_target"
    return
  fi

  if command -v aws >/dev/null 2>&1; then
    AWS_ACCESS_KEY_ID="$MINIO_ACCESS_KEY" \
      AWS_SECRET_ACCESS_KEY="$MINIO_SECRET_KEY" \
      aws --endpoint-url "$MINIO_ENDPOINT" s3 sync "s3://$MINIO_BUCKET" "$object_target"
    return
  fi

  echo "[backup] mc or aws CLI not found; object storage backup skipped" >&2
  echo "minio_status=skipped_missing_cli" >> "$manifest"

  if [[ "$REQUIRE_OBJECT_BACKUP" == "1" ]]; then
    return 1
  fi
}

write_manifest
backup_postgres
backup_minio

echo "postgres_status=completed" >> "$manifest"
echo "[backup] Completed: $BACKUP_DIR"
