#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/infra/docker-compose.yml}"
CONFIRM_RESTORE="${CONFIRM_RESTORE:-}"
BACKUP_DIR="${BACKUP_DIR:-${1:-}}"

if [[ -z "$BACKUP_DIR" ]]; then
  echo "Usage: BACKUP_DIR=backups/<timestamp> CONFIRM_RESTORE=trainmark-ai-restore pnpm restore" >&2
  exit 2
fi

if [[ "$CONFIRM_RESTORE" != "trainmark-ai-restore" ]]; then
  echo "Refusing to restore without CONFIRM_RESTORE=trainmark-ai-restore" >&2
  exit 2
fi

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
REQUIRE_OBJECT_RESTORE="${REQUIRE_OBJECT_RESTORE:-0}"

postgres_file="$BACKUP_DIR/postgres-${POSTGRES_DB}.dump"
object_source="$BACKUP_DIR/minio/$MINIO_BUCKET"

if [[ ! -f "$postgres_file" ]]; then
  echo "PostgreSQL backup file not found: $postgres_file" >&2
  exit 1
fi

restore_postgres() {
  echo "[restore] PostgreSQL <- $postgres_file"

  if command -v pg_restore >/dev/null 2>&1; then
    PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
      --host "$POSTGRES_HOST" \
      --port "$POSTGRES_PORT" \
      --username "$POSTGRES_USER" \
      --dbname "$POSTGRES_DB" \
      --clean \
      --if-exists \
      --no-owner \
      "$postgres_file"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore \
      --username "$POSTGRES_USER" \
      --dbname "$POSTGRES_DB" \
      --clean \
      --if-exists \
      --no-owner < "$postgres_file"
    return
  fi

  echo "[restore] pg_restore or docker is required for PostgreSQL restore" >&2
  return 1
}

restore_minio() {
  if [[ ! -d "$object_source" ]]; then
    echo "[restore] Object backup folder not found; skipping MinIO restore: $object_source" >&2
    if [[ "$REQUIRE_OBJECT_RESTORE" == "1" ]]; then
      return 1
    fi
    return
  fi

  echo "[restore] MinIO bucket $MINIO_BUCKET <- $object_source"

  if command -v mc >/dev/null 2>&1; then
    mc alias set trainmark "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
    mc mirror --overwrite "$object_source" "trainmark/$MINIO_BUCKET"
    return
  fi

  if command -v aws >/dev/null 2>&1; then
    AWS_ACCESS_KEY_ID="$MINIO_ACCESS_KEY" \
      AWS_SECRET_ACCESS_KEY="$MINIO_SECRET_KEY" \
      aws --endpoint-url "$MINIO_ENDPOINT" s3 sync "$object_source" "s3://$MINIO_BUCKET"
    return
  fi

  echo "[restore] mc or aws CLI not found; object storage restore skipped" >&2

  if [[ "$REQUIRE_OBJECT_RESTORE" == "1" ]]; then
    return 1
  fi
}

restore_postgres
restore_minio

echo "[restore] Completed from: $BACKUP_DIR"
